import { model, models, Schema, Types, type Model } from 'mongoose';

export interface AIIllustrationRecord {
  userId: Types.ObjectId;
  conversationId?: Types.ObjectId | null;
  word: string;
  translation: string;
  cacheKey: string;
  publicId?: string;
  fileName?: string;
  imageUrl: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const AIIllustrationSchema = new Schema<AIIllustrationRecord>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    conversationId: { type: Schema.Types.ObjectId, ref: 'AIConversation', default: null, index: true },
    word: { type: String, required: true, trim: true, maxlength: 120 },
    translation: { type: String, required: true, trim: true, maxlength: 500 },
    cacheKey: { type: String, required: true, trim: true },
    publicId: { type: String, trim: true, default: undefined },
    // Optional legacy field retained for older records.
    fileName: { type: String, trim: true, default: undefined },
    imageUrl: { type: String, required: true, trim: true },
  },
  { timestamps: true, versionKey: false },
);

AIIllustrationSchema.index({ userId: 1, cacheKey: 1 }, { unique: true });

const cachedModel = models.AIIllustration as Model<AIIllustrationRecord> | undefined;
export const AIIllustration: Model<AIIllustrationRecord> =
  cachedModel ?? model<AIIllustrationRecord>('AIIllustration', AIIllustrationSchema);
