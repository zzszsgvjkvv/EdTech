import { Request, Response } from 'express';

import { Tutor } from '../models/tutor.model';

/**
 * @desc    Create or update teacher profile, expertise, and availability slots
 * @route   PUT /api/teacher/profile
 */
export const updateTeacherProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id as any; // Attached by your authenticate middleware
    const { bio, expertise, hourlyRate, availability, isOnline } = req.body;

    // Find and update the tutor profile, or create one if it doesn't exist yet (upsert)
    const updatedTutor = await Tutor.findOneAndUpdate(
      { userId },
      {
        $set: {
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
export const updateAvailability = async (req: Request, res: Response): Promise<void> => {
  // Access the authenticated user attached by middleware
  const teacherId = req.user?._id;

  res.status(200).json({
    message: `Availability updated successfully for teacher ID: ${teacherId}`,
    schedule: req.body.schedule
  });
};
