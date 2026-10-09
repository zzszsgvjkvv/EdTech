import { Request, Response, NextFunction } from 'express';
import { TeacherProfile } from '../models/teacherProfile.model';

export const requireCompletedProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const teacherId = req.user?._id;

    if (!teacherId) {
      res.status(401).json({
        message: 'Unauthorized: user not found.',
        code: 'USER_NOT_FOUND',
      });
      return;
    }

    const profile = (await TeacherProfile.findOne({ userId: teacherId } as any)) as any;

    if (!profile || !profile.isProfileComplete) {
      res.status(403).json({
        message: 'Forbidden: You must complete your teacher profile details before setting availability.',
        code: 'PROFILE_INCOMPLETE',
      });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({ message: 'Error checking profile status' });
  }
};