import { Request, Response } from 'express';
import { User } from '../models/user.model';
import { Tutor } from '../models/tutor.model';
// Assuming you have a Vocabulary model
// import { Vocabulary } from '../models/vocabulary.model';

export const getStudentDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const studentId = req.user?._id;

    // 1. Fetch User Profile
    const user = await User.findById(studentId).select('-password');
    if (!user) {
      res.status(404).json({ message: 'Student not found' });
      return;
    }

    // 2. Fetch Online Tutors for live preview
    const onlineTutors = await Tutor.find({ isOnline: true })
      .populate('userId', 'name email avatar')
      .limit(5);

    // 3. Mock or fetch saved vocabulary count
    // const savedVocabCount = await Vocabulary.countDocuments({ userId: studentId });
    const savedVocabCount = 12; // Example count for MVP demo

    res.status(200).json({
      success: true,
      data: {
        student: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        stats: {
          savedVocabularyCount: savedVocabCount,
          completedSessions: 3,
          currentStreakDays: 5,
        },
        onlineTutors,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error loading dashboard' });
  }
};