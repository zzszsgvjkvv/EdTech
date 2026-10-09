import { Request, Response } from 'express';

export const updateAvailability = async (req: Request, res: Response): Promise<void> => {
  // Access the authenticated user attached by middleware
  const teacherId = req.user?._id;

  res.status(200).json({
    message: `Availability updated successfully for teacher ID: ${teacherId}`,
    schedule: req.body.schedule
  });
};