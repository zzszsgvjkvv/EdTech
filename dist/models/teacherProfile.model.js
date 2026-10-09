"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeacherProfile = void 0;
const mongoose_1 = require("mongoose");
const teacherProfileSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    headline: { type: String, required: true },
    bio: { type: String, required: true },
    hourlyRate: { type: Number, required: true, min: 0 },
    languagesTaught: [{ type: String, required: true }],
    videoIntroUrl: { type: String },
    isProfileComplete: { type: Boolean, default: false },
    isApprovedByAdmin: { type: Boolean, default: false },
}, { timestamps: true });
exports.TeacherProfile = (0, mongoose_1.model)('TeacherProfile', teacherProfileSchema);
//# sourceMappingURL=teacherProfile.model.js.map