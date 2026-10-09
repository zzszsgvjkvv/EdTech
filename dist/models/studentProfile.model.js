"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentProfile = void 0;
const mongoose_1 = require("mongoose");
const studentProfileSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    targetLanguage: { type: String, required: true },
    nativeLanguage: { type: String, required: true },
    learningReason: { type: String, required: true },
    currentLevel: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'beginner'
    },
    dailyGoalMinutes: { type: Number, default: 15 },
}, { timestamps: true });
exports.StudentProfile = (0, mongoose_1.model)('StudentProfile', studentProfileSchema);
//# sourceMappingURL=studentProfile.model.js.map