import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
export enum AllowedLanguages {
  ENGLISH = 'en',
  FRENCH = 'fr',
  SPANISH = 'es',
  ARABIC = 'ar',
  GERMAN = 'de'
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

const userSchema = new Schema<IUser>(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true, lowercase: true },
        password: { type: String, required: true, select: false },
        role: {
            type: String,
            enum: ['student', 'teacher', 'admin'],
            default: 'student'
        },
        nativeLanguage: { type: String },
         targetLanguage: { 
    type: String, 
    enum: Object.values(AllowedLanguages) 
  }
    },
    { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password!, salt);
});

// Instance method to verify password
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};

export const User = model<IUser>('User', userSchema);