"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOnboardingStatus = exports.updateTeacherProfile = void 0;
const teacherProfile_model_1 = require("../models/teacherProfile.model");
// Endpoint for Step 2: Teacher Profile Upsert
const updateTeacherProfile = async (req, res) => {
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
        const profile = await teacherProfile_model_1.TeacherProfile.findOneAndUpdate({ userId }, {
            userId,
            headline,
            bio,
            hourlyRate,
            languagesTaught,
            videoIntroUrl,
            isProfileComplete: true, // Mark step 2 as completed
        }, { new: true, upsert: true });
        res.status(200).json({
            message: 'Teacher profile details saved successfully. Next step: Set availability.',
            profile,
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
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