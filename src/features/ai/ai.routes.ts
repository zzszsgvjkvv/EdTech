import { Router } from 'express';
import { requireAIAuth, requireStudentRole } from '../../middleware/require-ai-auth';
import { aiUserRateLimit } from '../../middleware/ai-user-rate-limit';
import {
  createCategory,
  createConversation,
  createIllustration,
  deleteCategory,
  deleteConversation,
  getCategories,
  listConversations,
  listMessages,
  sendChatMessage,
  updateCategory,
  updateConversation,
} from './ai.controller';
import { aiErrorHandler, asyncHandler } from './ai.utils';

const router = Router();

const chatRateLimit = aiUserRateLimit({
  windowMs: 60_000,
  max: 20,
  message: 'Too many chat messages. Please wait a moment and try again.',
});
const illustrationRateLimit = aiUserRateLimit({
  windowMs: 60 * 60_000,
  max: 10,
  message: 'You have reached the illustration limit for this hour. Please try again later.',
});

// All AI endpoints are authenticated and student-only.
router.use(requireAIAuth, requireStudentRole);

// Learning groups/categories.
router.get('/categories', asyncHandler(getCategories));
router.post('/categories', asyncHandler(createCategory));
router.patch('/categories/:categoryId', asyncHandler(updateCategory));
router.delete('/categories/:categoryId', asyncHandler(deleteCategory));

// Conversation management.
router.get('/conversations', asyncHandler(listConversations));
router.post('/conversations', asyncHandler(createConversation));
router.patch('/conversations/:conversationId', asyncHandler(updateConversation));
router.delete('/conversations/:conversationId', asyncHandler(deleteConversation));

// Conversation message history and AI tutor replies.
router.get('/conversations/:conversationId/messages', asyncHandler(listMessages));
router.post('/conversations/:conversationId/messages', chatRateLimit, asyncHandler(sendChatMessage));

// On-demand word illustrations.
router.post('/illustrations', illustrationRateLimit, asyncHandler(createIllustration));

// Keep this router-level error handler last so controller exceptions become JSON responses.
router.use(aiErrorHandler);

export default router;
