import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import { ShowcaseEvent } from '@/models/ShowcaseEvent';
import { ShowcaseSubmission } from '@/models/ShowcaseSubmission';
import { College } from '@/models/College';
import { PodProject } from '@/models/PodProject';
import { PodMember } from '@/models/PodMember';
import { ShowcaseSubmissionSchema } from '@/schemas/builder-pods';
import {
    getAuthContext,
    hasAnyRole,
    UnauthorizedError,
    verifyCollegeAccess,
    ForbiddenError,
} from '@/lib/rbac';
import { buildPublicShowcases } from '@/lib/builder-pods/showcase-details';

// GET — list all showcase events
export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const ctx = await getAuthContext(req).catch(() => null);

        const [events, regionColleges] = await Promise.all([
            ShowcaseEvent.find().sort({ eventDate: -1 }).lean(),
            College.find({ deletedAt: null })
                .select('name slug city podName regionId')
                .lean(),
        ]);
        const publicShowcases = buildPublicShowcases(events, regionColleges);
        const showcases = events.map((event, index) => ({
            ...event,
            ...publicShowcases[index],
            _id: event._id,
            regionSnapshot: event.regionSnapshot,
            status: event.status,
        }));

        let userSubmissions: any[] = [];
        if (ctx?.walletAddress) {
            const wallet = ctx.walletAddress.toLowerCase();
            const memberProjects = await PodProject.find({
                deletedAt: null,
                $or: [
                    { teamLeader: wallet },
                    { 'teamMembers.walletAddress': wallet },
                ],
            }).select('_id').lean();
            const projectIds = memberProjects.map((p) => p._id);

            const rawSubmissions = await ShowcaseSubmission.find({
                isActive: { $ne: false },
                $or: [
                    { submittedBy: wallet },
                    ...(projectIds.length > 0 ? [{ projectId: { $in: projectIds } }] : []),
                ],
            })
                .select(
                    'showcaseEventId status projectSnapshot collegeSnapshot.podName certificateClaimable ' +
                    'patramCertificateOnChain patramMemberCertificates projectId'
                )
                .lean();

            const submissionProjectIds = [
              ...new Set(
                rawSubmissions
                  .map((s: any) => s.projectId?.toString?.())
                  .filter(Boolean),
              ),
            ];
            const projects = submissionProjectIds.length
              ? await PodProject.find({
                    _id: { $in: submissionProjectIds },
                    deletedAt: null,
                  })
                    .select("name problemStatement submittedToShowcase")
                    .lean()
              : [];
            const projectById = new Map(
              projects.map((p: any) => [p._id.toString(), p]),
            );

            // Resolve the caller's OWN on-chain certificate (one unique cert per team
            // member, keyed by wallet). No project-level fallback — a teammate who
            // hasn't been issued yet simply has no link.
            userSubmissions = rawSubmissions.map((sub: any) => {
                const proj = projectById.get(sub.projectId?.toString?.());
                const updatedProjectSnapshot = proj
                  ? {
                      ...(sub.projectSnapshot || {}),
                      name: proj.name ?? sub.projectSnapshot?.name,
                      problemStatement:
                        proj.problemStatement ??
                        sub.projectSnapshot?.problemStatement,
                    }
                  : sub.projectSnapshot;

                const mine = Array.isArray(sub.patramMemberCertificates)
                    ? sub.patramMemberCertificates.find(
                        (m: any) => (m?.wallet || '').toLowerCase() === wallet && m?.url
                    )
                    : null;
                const patramCertificateUrl = mine?.url || null;
                const { patramMemberCertificates, ...rest } = sub;
                return {
                    ...rest,
                    projectSnapshot: updatedProjectSnapshot,
                    patramCertificateUrl,
                    patramCertificateTxHash: mine?.txHash || null,
                };
            });
        }

        return NextResponse.json({ 
            success: true, 
            showcases,
            userSubmissions 
        }, { status: 200 });
    } catch (error) {
        console.error('Error fetching showcases:', error);
        return NextResponse.json(
            { success: false, error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

// POST — submit a showcase entry
export async function POST(req: NextRequest) {
    try {
        const ctx = await getAuthContext(req);
        if (!ctx) throw new UnauthorizedError('Not authenticated');

        await dbConnect();
        const parsed = ShowcaseSubmissionSchema.safeParse(await req.json());
        if (!parsed.success) {
            return NextResponse.json(
                { success: false, error: parsed.error.issues[0]?.message || 'Invalid showcase submission payload' },
                { status: 400 }
            );
        }
        const {
            showcaseEventId,
            collegeSlug,
            projectId,
            demoLink,
            githubRepo,
            contractAddress,
            pitchDeckUrl,
        } = parsed.data;
        const walletAddress = ctx.walletAddress;

        const showcase = await ShowcaseEvent.findById(showcaseEventId);

        if (!showcase || showcase.status === 'completed') {
            return NextResponse.json(
                { success: false, error: 'Showcase not found or already completed' },
                { status: 404 }
            );
        }

        const college = await College.findOne({ slug: collegeSlug, deletedAt: null });
        if (!college) {
            return NextResponse.json(
                { success: false, error: 'College not found' },
                { status: 404 }
            );
        }

        const isAdmin = hasAnyRole(ctx, ['super_admin', 'college_admin', 'mentor'], college._id.toString());
        if (isAdmin) {
            verifyCollegeAccess(ctx, college._id.toString());
        } else {
            const member = await PodMember.findOne({
                collegeId: college._id,
                walletAddress,
                status: 'active',
            }).lean();

            const isPodLead = member?.role === 'pod_lead';
            if (!member || !isPodLead) {
                throw new ForbiddenError('Only an active pod lead can submit to a showcase for this college');
            }
        }

        const project = await PodProject.findById(projectId);
        if (!project || project.collegeId.toString() !== college._id.toString()) {
            return NextResponse.json(
                { success: false, error: 'Project not found or does not belong to this college' },
                { status: 404 }
            );
        }

        // Project-wise permission: Only project lead (or admin) can submit
        if (!isAdmin && project.teamLeader.toLowerCase() !== walletAddress.toLowerCase()) {
            throw new ForbiddenError('Only the project lead can submit this project to a showcase');
        }

        const submission = await ShowcaseSubmission.create({
            showcaseEventId,
            collegeId: college._id,
            projectId: project._id,
            collegeSnapshot: {
                name: college.name,
                slug: college.slug,
                podName: college.podName,
            },
            projectSnapshot: {
                name: project.name,
                problemStatement: project.problemStatement?.trim() || '',
            },
            demoLink: demoLink || null,
            githubRepo,
            contractAddress: contractAddress || null,
            pitchDeckUrl: pitchDeckUrl || null,
            submittedBy: walletAddress,
        });

        // Mark project as submitted to showcase (idempotent marker)
        await PodProject.findByIdAndUpdate(project._id, { submittedToShowcase: true });

        return NextResponse.json(
            { success: true, submission: { _id: submission._id, status: submission.status } },
            { status: 201 }
        );
    } catch (error: any) {
        if (error instanceof UnauthorizedError) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            );
        }
        if (error instanceof ForbiddenError) {
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 403 }
            );
        }
        console.error('Showcase submission error:', error);
        if (error.code === 11000) {
            return NextResponse.json(
                { success: false, error: 'This project has already been submitted to this showcase' },
                { status: 409 }
            );
        }
        if (error.name === 'ValidationError') {
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { success: false, error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
