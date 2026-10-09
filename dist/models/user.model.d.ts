import { Document } from 'mongoose';
export declare enum AllowedLanguages {
    ENGLISH = "en",
    FRENCH = "fr",
    SPANISH = "es",
    ARABIC = "ar",
    GERMAN = "de"
}
export type UserRole = 'student' | 'teacher' | 'admin';
export interface IUser extends Document {
    name: string;
    email: string;
    password?: string;
    role: UserRole;
    nativeLanguage?: string;
    targetLanguage?: AllowedLanguages;
    comparePassword(candidatePassword: string): Promise<boolean>;
}
export declare const User: import("mongoose").Model<IUser, {}, {}, {}, Document<unknown, {}, IUser, {}, import("mongoose").DefaultSchemaOptions> & IUser & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IUser & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}>;
//# sourceMappingURL=user.model.d.ts.map