"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Vocabulary = void 0;
const mongoose_1 = require("mongoose");
const vocabularySchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    word: { type: String, required: true, trim: true },
    targetLanguage: { type: String, },
    category: { type: String, },
    translation: { type: String, required: true, trim: true },
    exampleSentence: { type: String, trim: true },
    imageUrl: { type: String, trim: true }, // Handles Cloudinary, Unsplash, or AI image URLs
    source: {
        type: String,
        enum: ['ai_chat', 'ai_generator', 'teacher', 'me'],
        required: true,
        default: 'me'
    },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
exports.Vocabulary = (0, mongoose_1.model)('Vocabulary', vocabularySchema);
//# sourceMappingURL=vocabulary.model.js.map