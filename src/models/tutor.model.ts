import { Schema, model, Document, Types } from 'mongoose';

export interface ITutor extends Document {
  userId: Types.ObjectId; // References the base User model (with role 'teacher')
  bio: string;
  expertise: string[]; // e.g., ["Spanish", "Conversation", "Grammar"]
  hourlyRate: number;
  rating: number;
  totalReviews: number;
  isOnline: boolean; // Updated live via WebSockets
  availability: {
    day: string; // e.g., "Monday"
    slots: string[]; // e.g., ["10:00 AM - 11:00 AM", "02:00 PM - 03:00 PM"]
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const tutorSchema = new Schema<ITutor>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    bio: { type: String, required: true, trim: true },
    expertise: [{ type: String, required: true }],
    hourlyRate: { type: Number, required: true, default: 0 },
    rating: { type: Number, default: 5.0 },
    totalReviews: { type: Number, default: 0 },
    isOnline: { type: Boolean, default: false },
    availability: [
      {
        day: { type: String, required: true },
        slots: [{ type: String, required: true }],
      },
    ],
  },
  { timestamps: true }
);

export const Tutor = model<ITutor>('Tutor', tutorSchema);