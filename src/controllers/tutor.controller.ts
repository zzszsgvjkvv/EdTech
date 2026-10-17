import { Request, Response } from 'express';
import { Tutor } from '../models/tutor.model';

/**
 * @desc    Get all tutors (with optional filtering by language/expertise)
 * @route   GET /api/student/tutors
 */
export const getTutors = async (req: Request, res: Response): Promise<void> => {
    try {
        const { language, online } = req.query;
        let query: any = {};

        if (language) {
            query.expertise = { $regex: language, $options: 'i' };
        }

        if (online === 'true') {
            query.isOnline = true;
        }

        // Populate user info (name, email, profile image) from the User model reference
        const tutors = await Tutor.find(query)
            .populate('userId', 'name email avatar')
            .select('-__v');

        res.status(200).json({
            success: true,
            count: tutors.length,
            data: tutors,
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Server error fetching tutors' });
    }
};

/**
 * @desc    Get single tutor profile & availability by ID
 * @route   GET /api/student/tutors/:id
 */
export const getTutorById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const tutor = await Tutor.findById(id).populate('userId', 'name email avatar');

        if (!tutor) {
            res.status(404).json({ message: 'Tutor not found' });
            return;
        }

        res.status(200).json({ success: true, data: tutor });
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Server error fetching tutor profile' });
    }
};