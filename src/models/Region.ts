import mongoose, { Document, Schema } from 'mongoose';

export interface IRegion extends Document {
    name: string;
    showcaseCity: string;
    stateCodes: string[];
    createdAt: Date;
}

const RegionSchema = new Schema<IRegion>(
    {
        name: { type: String, required: true, unique: true, trim: true },
        showcaseCity: { type: String, required: true, trim: true },
        stateCodes: { type: [String], required: true },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

export const Region =
    mongoose.models.Region || mongoose.model<IRegion>('Region', RegionSchema);

export const REGION_SEED = [
    { name: 'Mumbai Zone', showcaseCity: 'Mumbai', stateCodes: ['MH'] },
    { name: 'Ahmedabad Zone', showcaseCity: 'Ahmedabad', stateCodes: ['GJ'] },
    { name: 'Central Zone', showcaseCity: 'Jaipur', stateCodes: ['MP', 'RJ'] },
];
