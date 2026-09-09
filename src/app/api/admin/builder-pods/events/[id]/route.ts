import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import { ShowcaseEvent } from '@/models/ShowcaseEvent';
import { Region } from '@/models/Region';
import { ShowcaseSubmission } from '@/models/ShowcaseSubmission';
import {
    getAuthContext, requireAnyRole,
    UnauthorizedError, ForbiddenError
} from '@/lib/rbac';
import { slugifyShowcase } from '@/lib/builder-pods/showcase-details';

// PATCH — update showcase event
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const ctx = await getAuthContext(req);
        requireAnyRole(ctx, ['super_admin', 'college_admin', 'mentor']);

        const { id } = params;
        await dbConnect();
        const body = await req.json();

        const event = await ShowcaseEvent.findById(id);
        if (!event) {
            return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 });
        }

        // If region changed, update snapshot
        if (body.regionId && body.regionId !== event.regionId.toString()) {
            const region = await Region.findById(body.regionId);
            if (region) {
                event.regionId = body.regionId;
                event.regionSnapshot = {
                    name: region.name,
                    showcaseCity: region.showcaseCity,
                };
            }
        }

        if (body.name) event.name = body.name;
        if (body.city) event.city = body.city;
        if (body.eventDate) event.eventDate = new Date(body.eventDate);
        if (body.eventTime !== undefined) event.eventTime = body.eventTime || null;
        if (body.venue !== undefined) event.venue = body.venue;
        if (body.status) event.status = body.status;
        if (body.prizePoolUsd !== undefined) event.prizePoolUsd = Number(body.prizePoolUsd) || 0;
        if (body.prizeCurrency) event.prizeCurrency = body.prizeCurrency === 'INR' ? 'INR' : 'USD';
        if (body.subtitle !== undefined) event.subtitle = body.subtitle || null;
        if (body.tagline !== undefined) event.tagline = body.tagline || null;
        if (body.format !== undefined) event.format = body.format || 'Virtual';
        if (body.poster !== undefined) event.poster = body.poster || null;
        if (body.joinLink !== undefined) event.joinLink = body.joinLink || null;
        if (body.slug || !event.slug) {
            const base = body.slug || event.slug || body.city || event.city;
            const root = slugifyShowcase(String(base));
            if (root) {
                let slug = root;
                let n = 2;
                while (await ShowcaseEvent.findOne({ slug, _id: { $ne: event._id } }).select('_id').lean()) {
                    slug = `${root}-${n}`;
                    n += 1;
                }
                event.slug = slug;
            }
        }

        await event.save();

        return NextResponse.json({ success: true, event }, { status: 200 });
    } catch (error: any) {
        if (error instanceof UnauthorizedError) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
        if (error instanceof ForbiddenError) return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE — remove showcase event
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const ctx = await getAuthContext(req);
        requireAnyRole(ctx, ['super_admin']); // Only super_admin can delete

        const { id } = params;
        await dbConnect();
        
        // Cascade delete submissions
        await ShowcaseSubmission.deleteMany({ showcaseEventId: id });
        await ShowcaseEvent.findByIdAndDelete(id);

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error: any) {
        if (error instanceof UnauthorizedError) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
        if (error instanceof ForbiddenError) return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
