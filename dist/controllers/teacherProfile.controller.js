"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOnboardingStatus = exports.updateTeacherProfile = void 0;
const teacherProfile_model_1 = require("../models/teacherProfile.model");
const tutor_model_1 = require("../models/tutor.model");
const mongoose_1 = require("mongoose");
// Endpoint for Step 2: Teacher Profile Upsert
const updateTeacherProfile = async (req, res) => {
    try {
        const userId = req.user?._id; // Ensure this is coming from authenticate middleware
        const { bio, expertise, hourlyRate, availability, isOnline } = req.body;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized user ID' });
            return;
        }
        // Upsert using explicit ObjectId conversion to prevent duplicate/mismatched keys
        const updatedTutor = await tutor_model_1.Tutor.findOneAndUpdate({ userId: new mongoose_1.Types.ObjectId(userId) }, {
            $set: {
                userId: new mongoose_1.Types.ObjectId(userId), // ensure it's saved as an ObjectId
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
// Optional: Get current teacher onboarding state for frontend redirection
const getOnboardingStatus = async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        const profile = await teacherProfile_model_1.TeacherProfile.findOne({ userId });
        const profileDoc = profile;
        res.status(200).json({
            isProfileComplete: profileDoc?.isProfileComplete ?? false,
            isApprovedByAdmin: profileDoc?.isApprovedByAdmin ?? false,
            profile,
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getOnboardingStatus = getOnboardingStatus;
//# sourceMappingURL=teacherProfile.controller.js.map