import { Schema, model, Document, Types } from 'mongoose';

export interface ITeacherProfile extends Document {
  userId: Types.ObjectId;
  headline: string;
  bio: string;
  hourlyRate: number;
  languagesTaught: string[];
  videoIntroUrl?: string;
  isProfileComplete: boolean;
  isApprovedByAdmin: boolean; // Useful if you want manual vetting before public listing
}

const teacherProfileSchema = new Schema<ITeacherProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    headline: { type: String, required: true },
    bio: { type: String, required: true },
    hourlyRate: { type: Number, required: true, min: 0 },
    languagesTaught: [{ type: String, required: true }],
    videoIntroUrl: { type: String },
    isProfileComplete: { type: Boolean, default: false },
    isApprovedByAdmin: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const TeacherProfile = model<ITeacherProfile>('TeacherProfile', teacherProfileSchema);
