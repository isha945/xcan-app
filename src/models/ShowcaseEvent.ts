import mongoose, { Document, Schema, Types } from 'mongoose';

export const SHOWCASE_STATUS = ['upcoming', 'open', 'judging', 'completed'] as const;

export interface IShowcaseEvent extends Document {
    name: string;
    slug: string | null;
    regionId: Types.ObjectId;
    regionSnapshot: { name: string; showcaseCity: string };
    city: string;
    eventDate: Date | null;
    eventTime: string | null;
    venue: string | null;
    status: typeof SHOWCASE_STATUS[number];
    prizePoolUsd: number;
    prizeCurrency: 'USD' | 'INR';
    subtitle: string | null;
    tagline: string | null;
    format: string | null;
    poster: string | null;
    joinLink: string | null;
    joinLinkLabel: string | null;
    description: string | null;
    createdBy: string | null;
    createdAt: Date;
    updatedAt: Date;
}

const ShowcaseEventSchema = new Schema<IShowcaseEvent>(
    {
        name: { type: String, required: true },
        slug: { type: String, default: null, lowercase: true, trim: true, sparse: true, unique: true },
        regionId: { type: Schema.Types.ObjectId, ref: 'Region', required: true },
        regionSnapshot: {
            name: { type: String, required: true },
            showcaseCity: { type: String, required: true },
        },
        city: { type: String, required: true },
        eventDate: { type: Date, default: null },
        eventTime: { type: String, default: null },
        venue: { type: String, default: null },
        status: { type: String, enum: SHOWCASE_STATUS, default: 'upcoming' },
        prizePoolUsd: { type: Number, default: 1000 },
        prizeCurrency: { type: String, enum: ['USD', 'INR'], default: 'USD' },
        subtitle: { type: String, default: null },
        tagline: { type: String, default: null },
        format: { type: String, default: 'Virtual' },
        poster: { type: String, default: null },
        joinLink: { type: String, default: null },
        joinLinkLabel: { type: String, default: 'Join Showcase' },
        description: { type: String, default: null },
        createdBy: { type: String, default: null, lowercase: true },
    },
    { timestamps: true }
);

export const ShowcaseEvent =
    mongoose.models.ShowcaseEvent || mongoose.model<IShowcaseEvent>('ShowcaseEvent', ShowcaseEventSchema);
