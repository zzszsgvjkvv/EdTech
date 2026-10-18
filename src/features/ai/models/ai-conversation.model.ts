import { model, models, Schema, Types, type Model } from 'mongoose';

export interface AIConversationRecord {
  userId: Types.ObjectId;
  categoryId: string;
  categoryName: string;
  title: string;
  targetLanguage: string;
  nativeLanguage?: string | null;
  lastMessageAt?: Date | null;
  lastMessagePreview?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const AIConversationSchema = new Schema<AIConversationRecord>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
   
    categoryId: { type: String, required: true, trim: true, index: true },
    categoryName: { type: String, required: true, trim: true, maxlength: 40 },
    title: { type: String, required: true, trim: true, maxlength: 80, default: 'New conversation' },
    targetLanguage: { type: String, required: true, trim: true, maxlength: 40, default: 'English' },
    nativeLanguage: { type: String, trim: true, maxlength: 40, default: null },
    lastMessageAt: { type: Date, default: null, index: true },
    lastMessagePreview: { type: String, maxlength: 180, default: '' },
  },
  { timestamps: true, versionKey: false },
);

AIConversationSchema.index({ userId: 1, categoryId: 1, lastMessageAt: -1, updatedAt: -1 });

if (models.AIConversation) {
  delete models.AIConversation;
}

export const AIConversation: Model<AIConversationRecord> = 
  model<AIConversationRecord>('AIConversation', AIConversationSchema);

// const cachedModel = models.AIConversation as Model<AIConversationRecord> | undefined;

// export const AIConversation: Model<AIConversationRecord> =
//   cachedModel ?? model<AIConversationRecord>('AIConversation', AIConversationSchema);
