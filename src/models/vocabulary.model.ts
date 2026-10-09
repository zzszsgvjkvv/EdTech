import { Schema, model, Document, Types } from 'mongoose';

export interface IVocabulary extends Document {
  userId: Types.ObjectId;
  word: string;
  translation: string;
  language: string;
  category: string; // e.g., "Food & Dining", "Travel", "Grammar"
  exampleSentence?: string;
  source: 'ai_chat' | 'category_generator' | 'teacher_lesson';
}

const vocabularySchema = new Schema<IVocabulary>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    word: { type: String, required: true },
    translation: { type: String, required: true },
    language: { type: String, required: true },
    category: { type: String, default: 'General' },
    exampleSentence: { type: String },
    source: { 
      type: String, 
      enum: ['ai_chat', 'category_generator', 'teacher_lesson'], 
      default: 'ai_chat' 
    },
  },
  { timestamps: true }
);

export const Vocabulary = model<IVocabulary>('Vocabulary', vocabularySchema);