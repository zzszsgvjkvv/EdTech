import { Request, Response } from 'express';
import { TeacherProfile } from '../models/teacherProfile.model';

// Endpoint for Step 2: Teacher Profile Upsert
export const updateTeacherProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { headline, bio, hourlyRate, languagesTaught, videoIntroUrl } = req.body;

    // Validate required onboarding fields
    if (!headline || !bio || !hourlyRate || !languagesTaught?.length) {
      res.status(400).json({ message: 'Missing required profile fields' });
      return;
    }

    const profile = await TeacherProfile.findOneAndUpdate(
      { userId } as any,
      {
        userId,
        headline,
        bio,
        hourlyRate,
        languagesTaught,
        videoIntroUrl,
        isProfileComplete: true, // Mark step 2 as completed
      },
      { new: true, upsert: true }
    );

    res.status(200).json({
      message: 'Teacher profile details saved successfully. Next step: Set availability.',
      profile,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
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