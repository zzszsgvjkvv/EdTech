import { Schema, model, Document, Types } from 'mongoose';

export interface IPost extends Document {
  authorId: Types.ObjectId;
  authorRole: string; // Changed from strict union to string to support all roles seamlessly
  content: string;
  mediaUrl?: string;
  createdAt: Date;
}

const postSchema = new Schema<IPost>({
  authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  authorRole: { type: String, required: true }, // Accepts 'student', 'teacher', 'admin', etc.
  content: { type: String, required: true },
  mediaUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export const Post = model<IPost>('Post', postSchema);