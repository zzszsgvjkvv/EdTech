import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { enforceAiChatLimits } from '../middlewares/aiRateLimit.middleware';
import { 
  generateCategoryVocabulary, 
  saveVocabulary, 
  getSavedVocabulary 
} from '../controllers/vocabulary.controller';
import { generateVocabWithStickFigures } from '../controllers/aiVocab.controller';

const router = Router();

// Optional Auth Middleware: Attaches req.user if JWT is valid, but allows execution if missing
const optionalAuth = (req: any, res: any, next: any) => {
  if (req.headers.authorization) {
    return authenticate(req, res, next);
  }
  next();
};




router.post('/vocabulary/generate-ai', generateVocabWithStickFigures);

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

// ==========================================
// PROTECTED STUDENT FEATURES (Requires Authentication)
// ==========================================

router.post('/vocabulary/save', authenticate, saveVocabulary);
router.get('/vocabulary', authenticate, getSavedVocabulary);

export default router;