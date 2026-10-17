import { Request, Response } from 'express';
import { TeacherProfile } from '../models/teacherProfile.model';
import { Tutor } from '../models/tutor.model';
import { Types } from 'mongoose';
// Endpoint for Step 2: Teacher Profile Upsert

export const updateTeacherProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id; // Ensure this is coming from authenticate middleware
    const { bio, expertise, hourlyRate, availability, isOnline } = req.body;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized user ID' });
      return;
    }

    // Upsert using explicit ObjectId conversion to prevent duplicate/mismatched keys
    const updatedTutor = await Tutor.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      {
        $set: {
          userId: new Types.ObjectId(userId), // ensure it's saved as an ObjectId
          ...(bio && { bio }),
          ...(expertise && { expertise }),
          ...(hourlyRate !== undefined && { hourlyRate }),
          ...(availability && { availability }),
          ...(isOnline !== undefined && { isOnline }),
        },
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Teacher profile and availability updated successfully',
      data: updatedTutor,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server error updating profile' });
  }
};
// Optional: Get current teacher onboarding state for frontend redirection
export const getOnboardingStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const profile = await TeacherProfile.findOne({ userId }) as any;
    const profileDoc = profile as any;

    res.status(200).json({
      isProfileComplete: profileDoc?.isProfileComplete ?? false,
      isApprovedByAdmin: profileDoc?.isApprovedByAdmin ?? false,
      profile,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};