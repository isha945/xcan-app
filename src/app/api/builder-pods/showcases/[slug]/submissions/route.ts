import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import { ShowcaseEvent } from "@/models/ShowcaseEvent";
import { ShowcaseSubmission } from "@/models/ShowcaseSubmission";
import { College } from "@/models/College";
import { buildPublicShowcases } from "@/lib/builder-pods/showcase-details";

export const dynamic = "force-dynamic";

/**
 * GET /api/builder-pods/showcases/[slug]/submissions
 * Public list of active showcase submissions for a showcase event.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } },
) {
  try {
    await dbConnect();

    const slug = (params.slug || "").toLowerCase().trim();
    if (!slug) {
      return NextResponse.json(
        { success: false, error: "Showcase slug is required" },
        { status: 400 },
      );
    }

    const [events, regionColleges] = await Promise.all([
      ShowcaseEvent.find().sort({ eventDate: -1 }).lean(),
      College.find({ deletedAt: null })
        .select("name slug city podName regionId")
        .lean(),
    ]);
    const publicShowcases = buildPublicShowcases(events, regionColleges);
    const matched = publicShowcases.find((s) => s.slug === slug);

    if (!matched) {
      return NextResponse.json({
        success: true,
        submissions: [],
        event: null,
      });
    }

    const submissions = await ShowcaseSubmission.find({
      showcaseEventId: matched._id,
      isActive: { $ne: false },
      status: { $ne: "rejected" },
    })
      .select(
        "status placement projectSnapshot collegeSnapshot demoLink githubRepo contractAddress pitchDeckUrl createdAt projectId",
      )
      .populate(
        "projectId",
        "name problemStatement techStack teamMembers teamLeader githubRepo demoLink contractAddress",
      )
      .sort({ createdAt: -1 })
      .lean();

    const normalizedSubmissions = submissions.map((s: any) => {
      const proj = s.projectId as any;
      if (!proj) return s;

      return {
        ...s,
        projectSnapshot: {
          ...(s.projectSnapshot || {}),
          name: proj.name ?? s.projectSnapshot?.name,
          problemStatement:
            proj.problemStatement ?? s.projectSnapshot?.problemStatement,
        },
      };
    });

    return NextResponse.json({
      success: true,
      event: matched,
      submissions: normalizedSubmissions,
    });
  } catch (error) {
    console.error("Error fetching showcase city submissions:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
