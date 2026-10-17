import { Schema, model, Document, Types } from 'mongoose';

export interface IAIConversation extends Document {
  studentId: Types.ObjectId;
  categoryId: Types.ObjectId;
  title: string;
  createdAt: Date;
}

const aiConversationSchema = new Schema<IAIConversation>({
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  categoryId: { type: Schema.Types.ObjectId, ref: 'AICategory', required: true },
  title: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const AIConversation = model<IAIConversation>('AIConversation', aiConversationSchema);