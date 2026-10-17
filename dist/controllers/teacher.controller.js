"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAvailability = exports.updateTeacherProfile = void 0;
const tutor_model_1 = require("../models/tutor.model");
/**
 * @desc    Create or update teacher profile, expertise, and availability slots
 * @route   PUT /api/teacher/profile
 */
const updateTeacherProfile = async (req, res) => {
    try {
        const userId = req.user?._id; // Attached by your authenticate middleware
        const { bio, expertise, hourlyRate, availability, isOnline } = req.body;
        // Find and update the tutor profile, or create one if it doesn't exist yet (upsert)
        const updatedTutor = await tutor_model_1.Tutor.findOneAndUpdate({ userId }, {
            $set: {
                ...(bio && { bio }),
                ...(expertise && { expertise }),
                ...(hourlyRate !== undefined && { hourlyRate }),
                ...(availability && { availability }),
                ...(isOnline !== undefined && { isOnline }),
            },
        }, { new: true, upsert: true, runValidators: true });
        res.status(200).json({
            success: true,
            message: 'Teacher profile and availability updated successfully',
            data: updatedTutor,
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Server error updating profile' });
    }
};
exports.updateTeacherProfile = updateTeacherProfile;
const updateAvailability = async (req, res) => {
    // Access the authenticated user attached by middleware
    const teacherId = req.user?._id;
    res.status(200).json({
        message: `Availability updated successfully for teacher ID: ${teacherId}`,
        schedule: req.body.schedule
    });
};
exports.updateAvailability = updateAvailability;
//# sourceMappingURL=teacher.controller.js.map