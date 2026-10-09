import { Document, Types } from 'mongoose';
export interface IStudentProfile extends Document {
    userId: Types.ObjectId;
    targetLanguage: string;
    nativeLanguage: string;
    learningReason: string;
    currentLevel: 'beginner' | 'intermediate' | 'advanced';
    dailyGoalMinutes: number;
}
export declare const StudentProfile: import("mongoose").Model<IStudentProfile, {}, {}, {}, Document<unknown, {}, IStudentProfile, {}, import("mongoose").DefaultSchemaOptions> & IStudentProfile & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IStudentProfile & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}>;
//# sourceMappingURL=studentProfile.model.d.ts.map