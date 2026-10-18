"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const aiRateLimit_middleware_1 = require("../middlewares/aiRateLimit.middleware");
const vocabulary_controller_1 = require("../controllers/vocabulary.controller");
const aiVocab_controller_1 = require("../controllers/aiVocab.controller");
const cloudinary_config_1 = require("../config/cloudinary.config");
const tutor_controller_1 = require("../controllers/tutor.controller");
const ai_controller_1 = require("../controllers/ai.controller");
const ai_controller_2 = require("../controllers/ai.controller");
const ai_routes_1 = __importDefault(require("../features/ai/ai.routes")); // adjust relative path to your project
const router = (0, express_1.Router)();
// Optional Auth Middleware: Attaches req.user if JWT is valid, but allows execution if missing
const optionalAuth = (req, res, next) => {
    if (req.headers.authorization) {
        return (0, auth_middleware_1.authenticate)(req, res, next);
    }
    next();
};
// Apply student authentication and role check to all AI routes
router.use(auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)(['student']));
router.get('/categories', ai_controller_1.getCategories);
router.get('/conversations', ai_controller_1.getConversations);
router.post('/conversations', ai_controller_1.createConversation);
router.get('/conversations/:id/messages', ai_controller_1.getMessages);
router.post('/conversations/:id/messages', ai_controller_2.sendAiMessage);
router.use('/ai', ai_routes_1.default);
// ==========================================
// PROTECTED STUDENT FEATURES (Requires Authentication)
// ==========================================
router.post('/vocabulary/save', auth_middleware_1.authenticate, cloudinary_config_1.upload.single('image'), vocabulary_controller_1.saveVocabulary);
router.get('/vocabulary', auth_middleware_1.authenticate, vocabulary_controller_1.getSavedVocabulary);
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
// Secure routes so authenticated students can search and view tutors
router.get('/tutors', auth_middleware_1.authenticate, tutor_controller_1.getTutors);
router.get('/tutors/:id', auth_middleware_1.authenticate, tutor_controller_1.getTutorById);
exports.default = router;
//# sourceMappingURL=student.routes.js.map