import { model, models, Schema, Types, type Model } from 'mongoose';

export interface VocabularyCandidateRecord {
  word: string;
  translation: string;
  exampleSentence: string | null;
  category: string | null;
  targetLanguage: string;
}

export interface AIMessageRecord {
  userId: Types.ObjectId;
  conversationId: Types.ObjectId;
  role: 'user' | 'assistant';
  content: string;
  status?: 'pending' | 'complete' | 'failed';
  clientMessageId?: string;
  replyToMessageId?: Types.ObjectId | null;
  vocabularyCandidates?: VocabularyCandidateRecord[];
  createdAt?: Date;
  updatedAt?: Date;
}

const VocabularyCandidateSchema = new Schema<VocabularyCandidateRecord>(
  {
    word: { type: String, required: true, trim: true, maxlength: 120 },
    translation: { type: String, required: true, trim: true, maxlength: 500 },
    exampleSentence: { type: String, default: null, maxlength: 1000 },
    category: { type: String, default: null, maxlength: 80 },
    targetLanguage: { type: String, required: true, maxlength: 40 },
  },
  { _id: false },
);

const AIMessageSchema = new Schema<AIMessageRecord>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    conversationId: { type: Schema.Types.ObjectId, ref: 'AIConversation', required: true, index: true },
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true, maxlength: 5000 },
    status: { type: String, enum: ['pending', 'complete', 'failed'], default: 'complete' },
    clientMessageId: { type: String, trim: true, maxlength: 100, default: undefined },
    replyToMessageId: { type: Schema.Types.ObjectId, ref: 'AIMessage', default: null },
    vocabularyCandidates: { type: [VocabularyCandidateSchema], default: [] },
  },
  { timestamps: true, versionKey: false },
);

AIMessageSchema.index(
  { conversationId: 1, clientMessageId: 1 },
  { unique: true, partialFilterExpression: { clientMessageId: { $type: 'string' } } },
);
AIMessageSchema.index({ conversationId: 1, createdAt: 1, _id: 1 });
AIMessageSchema.index({ conversationId: 1, replyToMessageId: 1 });
AIMessageSchema.index(
  { replyToMessageId: 1 },
  {
    name: 'uniq_ai_reply_per_user_message',
    unique: true,
    partialFilterExpression: { replyToMessageId: { $type: 'objectId' } },
  },
);

if (models.AIMessage) {
  delete models.AIMessage;
}

export const AIMessage: Model<AIMessageRecord> = 
  model<AIMessageRecord>('AIMessage', AIMessageSchema);