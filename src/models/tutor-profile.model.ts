import { Schema, model, Document, Types } from 'mongoose';

export interface ITutorProfile extends Document {
  userId: Types.ObjectId;
  bio: string;
  languages: string[];
  hourlyRate: number;
  currency: string;
  rating: number;
  totalSessions: number;
}

const tutorProfileSchema = new Schema<ITutorProfile>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  bio: { type: String, required: true, trim: true },
  languages: [{ type: String, required: true, index: true }],
  hourlyRate: { type: Number, default: 0.00 }, // Scalable for future payments
  currency: { type: String, default: 'USD' },
  rating: { type: Number, default: 5.0 },
  totalSessions: { type: Number, default: 0 },
}, { timestamps: true });

export const TutorProfile = model<ITutorProfile>('TutorProfile', tutorProfileSchema);