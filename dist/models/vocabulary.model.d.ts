import { Document, Types } from 'mongoose';
export interface IVocabulary extends Document {
    userId: Types.ObjectId;
    word: string;
    translation: string;
    exampleSentence?: string;
    imageUrl?: string;
    category?: string;
    targetLanguage?: string;
    source: 'ai_chat' | 'ai_generator' | 'teacher' | 'me';
    createdBy?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Vocabulary: import("mongoose").Model<IVocabulary, {}, {}, {}, Document<unknown, {}, IVocabulary, {}, import("mongoose").DefaultSchemaOptions> & IVocabulary & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IVocabulary & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}>;
//# sourceMappingURL=vocabulary.model.d.ts.map