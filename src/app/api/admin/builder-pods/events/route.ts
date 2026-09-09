import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import { ShowcaseEvent } from '@/models/ShowcaseEvent';
import { Region } from '@/models/Region';
import {
    getAuthContext, requireAnyRole,
    UnauthorizedError, ForbiddenError
} from '@/lib/rbac';
import { slugifyShowcase } from '@/lib/builder-pods/showcase-details';

async function uniqueEventSlug(base: string, excludeId?: string): Promise<string> {
    const root = slugifyShowcase(base) || `showcase-${Date.now()}`;
    let slug = root;
    let n = 2;
    while (true) {
        const existing = await ShowcaseEvent.findOne({
            slug,
            ...(excludeId ? { _id: { $ne: excludeId } } : {}),
        }).select('_id').lean();
        if (!existing) return slug;
        slug = `${root}-${n}`;
        n += 1;
    }
}

// Manages ShowcaseEvent entities (the events themselves, not submissions)

// GET — list all showcase events and regions
export async function GET(req: NextRequest) {
    try {
        const ctx = await getAuthContext(req);
        requireAnyRole(ctx, ['super_admin', 'college_admin', 'mentor']);

        await dbConnect();

        const [events, regions] = await Promise.all([
            ShowcaseEvent.find().sort({ eventDate: -1 }).lean(),
            Region.find().sort({ name: 1 }).lean(),
        ]);

        return NextResponse.json({ success: true, events, regions }, { status: 200 });
    } catch (error: any) {
        if (error instanceof UnauthorizedError) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
        if (error instanceof ForbiddenError) return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST — create new showcase event
export async function POST(req: NextRequest) {
    try {
        const ctx = await getAuthContext(req);
        requireAnyRole(ctx, ['super_admin', 'college_admin', 'mentor']);

        await dbConnect();
        const body = await req.json();
        const {
            name, regionId, city, eventDate, venue, status, prizePoolUsd,
            eventTime, format, joinLink, poster, subtitle, tagline, prizeCurrency,
        } = body;

        if (!name || !regionId || !city) {
            return NextResponse.json({ success: false, error: 'Name, Region, and City are required' }, { status: 400 });
        }

        const region = await Region.findById(regionId);
        if (!region) {
            return NextResponse.json({ success: false, error: 'Region not found' }, { status: 404 });
        }

        const slug = await uniqueEventSlug(body.slug || city || name);

        const event = await ShowcaseEvent.create({
            name,
            slug,
            regionId,
            regionSnapshot: {
                name: region.name,
                showcaseCity: region.showcaseCity,
            },
            city,
            eventDate: eventDate ? new Date(eventDate) : null,
            eventTime: eventTime || null,
            venue: venue || null,
            status: status || 'upcoming',
            prizePoolUsd: Number(prizePoolUsd) || 0,
            prizeCurrency: prizeCurrency === 'INR' ? 'INR' : 'USD',
            subtitle: subtitle || null,
            tagline: tagline || null,
            format: format || 'Virtual',
            poster: poster || null,
            joinLink: joinLink || null,
            createdBy: ctx!.walletAddress,
        });

        return NextResponse.json({ success: true, event }, { status: 201 });
    } catch (error: any) {
        if (error instanceof UnauthorizedError) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
        if (error instanceof ForbiddenError) return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
        console.error('Create event error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
