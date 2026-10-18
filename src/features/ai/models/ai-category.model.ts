import { model, models, Schema, Types, type Model } from 'mongoose';

export interface StudentAICategoryRecord {
  userId: Types.ObjectId;
  name: string;
  slug: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const StudentAICategorySchema = new Schema<StudentAICategoryRecord>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 40 },
    slug: { type: String, required: true, trim: true, lowercase: true },
  },
  { timestamps: true, versionKey: false },
);

StudentAICategorySchema.index({ userId: 1, slug: 1 }, { unique: true });

const cachedModel = models.StudentAICategory as Model<StudentAICategoryRecord> | undefined;
export const StudentAICategory: Model<StudentAICategoryRecord> =
  cachedModel ?? model<StudentAICategoryRecord>('StudentAICategory', StudentAICategorySchema);
