import { Document, Types } from 'mongoose';
export interface IVocabulary extends Document {
    userId: Types.ObjectId;
    word: string;
    translation: string;
    language: string;
    category: string;
    exampleSentence?: string;
    source: 'ai_chat' | 'category_generator' | 'teacher_lesson';
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