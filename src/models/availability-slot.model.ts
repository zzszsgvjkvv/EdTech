import { Schema, model, Document, Types } from 'mongoose';

export interface IAvailabilitySlot extends Document {
  tutorId: Types.ObjectId;
  startTime: Date;
  endTime: Date;
  isBooked: boolean;
}

const availabilitySlotSchema = new Schema<IAvailabilitySlot>({
  tutorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  startTime: { type: Date, required: true, index: true },
  endTime: { type: Date, required: true },
  isBooked: { type: Boolean, default: false },
}, { timestamps: true });

availabilitySlotSchema.index({ tutorId: 1, startTime: 1 }, { unique: true });

export const AvailabilitySlot = model<IAvailabilitySlot>('AvailabilitySlot', availabilitySlotSchema);