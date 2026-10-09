import { Document, Types } from 'mongoose';
export interface ITeacherProfile extends Document {
    userId: Types.ObjectId;
    headline: string;
    bio: string;
    hourlyRate: number;
    languagesTaught: string[];
    videoIntroUrl?: string;
    isProfileComplete: boolean;
    isApprovedByAdmin: boolean;
}
export declare const TeacherProfile: import("mongoose").Model<ITeacherProfile, {}, {}, {}, Document<unknown, {}, ITeacherProfile, {}, import("mongoose").DefaultSchemaOptions> & ITeacherProfile & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, ITeacherProfile & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}>;
//# sourceMappingURL=teacherProfile.model.d.ts.map