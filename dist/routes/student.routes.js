"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const aiRateLimit_middleware_1 = require("../middlewares/aiRateLimit.middleware");
const vocabulary_controller_1 = require("../controllers/vocabulary.controller");
const aiVocab_controller_1 = require("../controllers/aiVocab.controller");
const router = (0, express_1.Router)();
// Optional Auth Middleware: Attaches req.user if JWT is valid, but allows execution if missing
const optionalAuth = (req, res, next) => {
    if (req.headers.authorization) {
        return (0, auth_middleware_1.authenticate)(req, res, next);
    }
    next();
};
router.post('/vocabulary/generate-ai', aiVocab_controller_1.generateStickFigureImage);
// ==========================================
// PUBLIC & GUEST FEATURES
// ==========================================
// AI Chat (Max 4 messages for Guests, Unlimited for Auth Students)
router.post('/ai-chat', optionalAuth, aiRateLimit_middleware_1.enforceAiChatLimits, (req, res) => {
    res.status(200).json({
        reply: "¡Hola! I am your AI tutor. What would you like to practice today?",
        isGuest: !req.user
    });
});
// AI Vocabulary Generator (Guests can generate and view lists, but CANNOT save)
router.post('/vocabulary/generate', vocabulary_controller_1.generateCategoryVocabulary);
// ==========================================
// PROTECTED STUDENT FEATURES (Requires Authentication)
// ==========================================
router.post('/vocabulary/save', auth_middleware_1.authenticate, vocabulary_controller_1.saveVocabulary);
router.get('/vocabulary', auth_middleware_1.authenticate, vocabulary_controller_1.getSavedVocabulary);
exports.default = router;
//# sourceMappingURL=student.routes.js.map