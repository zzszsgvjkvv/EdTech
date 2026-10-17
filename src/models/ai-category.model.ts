import { Schema, model, Document } from 'mongoose';

export interface IAICategory extends Document {
  name: string;
  description: string;
  icon: string;
}

const aiCategorySchema = new Schema<IAICategory>({
  name: { type: String, required: true },
  description: { type: String },
  icon: { type: String },
});

export const AICategory = model<IAICategory>('AICategory', aiCategorySchema);