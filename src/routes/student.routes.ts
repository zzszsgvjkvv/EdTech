import { Router } from 'express';
import { authenticate,requireRole } from '../middlewares/auth.middleware';
import { enforceAiChatLimits } from '../middlewares/aiRateLimit.middleware';
import {
  generateCategoryVocabulary,
  saveVocabulary,
  getSavedVocabulary
} from '../controllers/vocabulary.controller';
import { generateStickFigureImage } from '../controllers/aiVocab.controller';
import { upload } from '../config/cloudinary.config';
import { getTutors, getTutorById } from '../controllers/tutor.controller';
import { 
  getCategories, 
  getConversations, 
  createConversation, 
  getMessages 
} from '../controllers/ai.controller';
import { sendAiMessage } from '../controllers/ai.controller';
import aiRoutes from '../features/ai/ai.routes'; // adjust relative path to your project

const router = Router();

// Optional Auth Middleware: Attaches req.user if JWT is valid, but allows execution if missing
const optionalAuth = (req: any, res: any, next: any) => {
  if (req.headers.authorization) {
    return authenticate(req, res, next);
  }
  next();
};









// Apply student authentication and role check to all AI routes
router.use(authenticate, requireRole(['student']));

router.get('/categories', getCategories);
router.get('/conversations', getConversations);
router.post('/conversations', createConversation);
router.get('/conversations/:id/messages', getMessages);
router.post('/conversations/:id/messages', sendAiMessage);

router.use('/ai', aiRoutes);
// ==========================================
// PROTECTED STUDENT FEATURES (Requires Authentication)
// ==========================================
router.post(
  '/vocabulary/save',
  authenticate,
  upload.single('image'), 
  saveVocabulary
);
router.get('/vocabulary', authenticate, getSavedVocabulary);





router.post('/vocabulary/generate-ai', generateStickFigureImage);

// ==========================================
// PUBLIC & GUEST FEATURES
// ==========================================

// AI Chat (Max 4 messages for Guests, Unlimited for Auth Students)
router.post('/ai-chat', optionalAuth, enforceAiChatLimits, (req, res) => {
  res.status(200).json({
    reply: "¡Hola! I am your AI tutor. What would you like to practice today?",
    isGuest: !req.user
  });
});
// AI Vocabulary Generator (Guests can generate and view lists, but CANNOT save)
router.post('/vocabulary/generate', generateCategoryVocabulary);


// Secure routes so authenticated students can search and view tutors
router.get('/tutors', authenticate, getTutors);
router.get('/tutors/:id', authenticate, getTutorById);


export default router;