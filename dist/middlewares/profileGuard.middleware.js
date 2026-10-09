"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireCompletedProfile = void 0;
const teacherProfile_model_1 = require("../models/teacherProfile.model");
const requireCompletedProfile = async (req, res, next) => {
    try {
        const teacherId = req.user?._id;
        if (!teacherId) {
            res.status(401).json({
                message: 'Unauthorized: user not found.',
                code: 'USER_NOT_FOUND',
            });
            return;
        }
        const profile = (await teacherProfile_model_1.TeacherProfile.findOne({ userId: teacherId }));
        if (!profile || !profile.isProfileComplete) {
            res.status(403).json({
                message: 'Forbidden: You must complete your teacher profile details before setting availability.',
                code: 'PROFILE_INCOMPLETE',
            });
            return;
        }
        next();
    }
    catch (error) {
        res.status(500).json({ message: 'Error checking profile status' });
    }
};
exports.requireCompletedProfile = requireCompletedProfile;
//# sourceMappingURL=profileGuard.middleware.js.map