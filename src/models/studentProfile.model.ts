import { Schema, model, Document, Types } from 'mongoose';

export interface IStudentProfile extends Document {
  userId: Types.ObjectId;
  targetLanguage: string;
  nativeLanguage: string;
  learningReason: string; // e.g., "For travel", "For work", "Exam prep"
  currentLevel: 'beginner' | 'intermediate' | 'advanced';
  dailyGoalMinutes: number;
}

const studentProfileSchema = new Schema<IStudentProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    targetLanguage: { type: String, required: true },
    nativeLanguage: { type: String, required: true },
    learningReason: { type: String, required: true },
    currentLevel: { 
      type: String, 
      enum: ['beginner', 'intermediate', 'advanced'], 
      default: 'beginner' 
    },
    dailyGoalMinutes: { type: Number, default: 15 },
  },
  { timestamps: true }
);

export const StudentProfile = model<IStudentProfile>('StudentProfile', studentProfileSchema);