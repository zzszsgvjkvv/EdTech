"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Vocabulary = void 0;
const mongoose_1 = require("mongoose");
const vocabularySchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    word: { type: String, required: true },
    translation: { type: String, required: true },
    language: { type: String, required: true },
    category: { type: String, default: 'General' },
    exampleSentence: { type: String },
    source: {
        type: String,
        enum: ['ai_chat', 'category_generator', 'teacher_lesson'],
        default: 'ai_chat'
    },
}, { timestamps: true });
exports.Vocabulary = (0, mongoose_1.model)('Vocabulary', vocabularySchema);
//# sourceMappingURL=vocabulary.model.js.map