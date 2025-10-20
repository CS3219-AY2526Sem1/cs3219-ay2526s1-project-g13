import mongoose, { Schema, Document, Model } from 'mongoose';

export interface MatchingEventDocument extends Document {
  category: string;
  difficulty: string;
  createdAt: Date;
  updatedAt: Date;
}

const MatchingEventSchema = new Schema<MatchingEventDocument>(
  {
    category: { type: String, required: true },
    difficulty: { type: String, required: true },
  },
  { timestamps: true }
);

export const MatchingEventModel: Model<MatchingEventDocument> =
  mongoose.models.MatchingEvent || mongoose.model<MatchingEventDocument>('MatchingEvent', MatchingEventSchema);


