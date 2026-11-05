import { Schema, model, Document, Types } from 'mongoose';

export interface IAppointment extends Document {
  studentId: Types.ObjectId;
  tutorId: Types.ObjectId;
  slotId: Types.ObjectId;
  targetLanguage: string;
  topicNote: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  teacherNote?: string; // Apology or feedback note when approved/rejected
  paymentStatus: 'not_required' | 'pending_payment' | 'paid' | 'refunded'; // Future payment hook
  price: number;
  currency: string;
  createdAt: Date;
}

const appointmentSchema = new Schema<IAppointment>({
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  tutorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  slotId: { type: Schema.Types.ObjectId, ref: 'AvailabilitySlot', required: true },
  targetLanguage: { type: String, required: true, index: true },
  topicNote: { type: String, required: true, trim: true },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'completed', 'cancelled'], 
    default: 'pending',
    index: true 
  },
  teacherNote: { type: String, trim: true },
  paymentStatus: { type: String, enum: ['not_required', 'pending_payment', 'paid', 'refunded'], default: 'not_required' },
  price: { type: Number, default: 0.00 },
  currency: { type: String, default: 'USD' },
}, { timestamps: true });

export const Appointment = model<IAppointment>('Appointment', appointmentSchema);