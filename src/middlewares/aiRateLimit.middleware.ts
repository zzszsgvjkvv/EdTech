import { Request, Response, NextFunction } from 'express';

// In-memory guest chat counter (Use Redis for multi-instance production)
const guestChatTracker = new Map<string, number>();

export const enforceAiChatLimits = (req: Request, res: Response, next: NextFunction): void => {
  // 1. Authenticated users get UNLIMITED chat access
  if (req.user) {
    return next();
  }

  // 2. Guest user identification via header or IP
  const guestSessionId = (req.headers['x-guest-session-id'] as string) || req.ip;

  if (!guestSessionId) {
    res.status(400).json({ message: 'Missing guest session identification' });
    return;
  }

  const currentCount = guestChatTracker.get(guestSessionId) || 0;

  if (currentCount >= 4) {
    res.status(403).json({
      message: 'Guest limit reached (4/4 messages). Please sign up or log in to continue chatting with AI.',
      code: 'GUEST_LIMIT_EXCEEDED',
      requiresAuth: true
    });
    return;
  }

  // Increment count for guest
  guestChatTracker.set(guestSessionId, currentCount + 1);
  next();
};