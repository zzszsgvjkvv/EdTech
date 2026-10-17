import { Schema, model, Document, Types } from 'mongoose';

export interface IVocabularyItem {
  word: string;
  translation: string;
  exampleSentence: string;
}

export interface IAIMessage extends Document {
  conversationId: Types.ObjectId;
  sender: 'user' | 'ai';
  text: string;
  vocabularyItems?: IVocabularyItem[];
  createdAt: Date;
}

const aiMessageSchema = new Schema<IAIMessage>({
  conversationId: { type: Schema.Types.ObjectId, ref: 'AIConversation', required: true, index: true },
  sender: { type: String, enum: ['user', 'ai'], required: true },
  text: { type: String, required: true },
  vocabularyItems: [{
    word: String,
    translation: String,
    exampleSentence: String,
  }],
  createdAt: { type: Date, default: Date.now },
});

export const AIMessage = model<IAIMessage>('AIMessage', aiMessageSchema);