import { Schema, model, Document, Types } from 'mongoose';

export interface IVocabulary extends Document {
  userId: Types.ObjectId;
  word: string;
  translation: string;
  exampleSentence?: string;
  imageUrl?: string;

  category?: string;

  targetLanguage?: string;

  source: 'ai_chat' | 'ai_generator' | 'teacher' | 'me';
  createdBy?: Types.ObjectId; // Reference to Teacher ID if added by instructor
  createdAt: Date;
  updatedAt: Date;
}

const vocabularySchema = new Schema<IVocabulary>(
  {

    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    word: { type: String, required: true, trim: true },

    targetLanguage: { type: String, },

    category: { type: String, },

    translation: { type: String, required: true, trim: true },
    exampleSentence: { type: String, trim: true },
    imageUrl: { type: String, trim: true }, // Handles Cloudinary, Unsplash, or AI image URLs
    source: {
      type: String,
      enum: ['ai_chat', 'ai_generator', 'teacher', 'me'],
      required: true,
      default: 'me'
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const Vocabulary = model<IVocabulary>('Vocabulary', vocabularySchema);