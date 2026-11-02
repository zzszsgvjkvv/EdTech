import { Schema, model, Document, Types } from 'mongoose';

export interface IPost extends Document {
  authorId: Types.ObjectId;
  authorRole: 'student' | 'teacher' | 'admin';
  content: string;
  mediaUrl?: string;
  createdAt: Date;
}

const postSchema = new Schema<IPost>({
  authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  authorRole: { type: String, enum: ['teacher', 'student'], required: true },
  content: { type: String, required: true },
  mediaUrl: { type: String }, // Optional image/media attachment URL
  createdAt: { type: Date, default: Date.now },
});

export const Post = model<IPost>('Post', postSchema);