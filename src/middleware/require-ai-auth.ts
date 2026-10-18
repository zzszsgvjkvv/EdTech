import type { NextFunction, Request, Response } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { Types } from 'mongoose';

export interface AuthenticatedAIUser {
  userId: string;
  role: string;
  email?: string;
}

/**
 * Verifies the same bearer token created by your existing login controller.
 * IMPORTANT: if your project exports JWT_SECRET from a config module, import
 * that exact value here instead of using process.env.JWT_SECRET directly.
 */
export function requireAIAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.header('authorization');
  const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : '';

  if (!token) {
    res.status(401).json({ success: false, message: 'Bearer token is required.' });
    return;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    res.status(500).json({ success: false, message: 'JWT_SECRET is not configured on the server.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, secret);
    if (typeof decoded === 'string') {
      res.status(401).json({ success: false, message: 'Invalid authentication token.' });
      return;
    }

    const payload = decoded as JwtPayload & { _id?: string; id?: string; role?: string; email?: string };
    const rawId = payload._id ?? payload.id ?? payload.sub;

    if (!rawId || !Types.ObjectId.isValid(rawId) || !payload.role) {
      res.status(401).json({ success: false, message: 'Invalid authentication token payload.' });
      return;
    }

    req.authUser = {
      userId: String(rawId),
      role: String(payload.role),
      ...(payload.email ? { email: String(payload.email) } : {}),
    };
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Token is invalid or expired.' });
  }
}

export function requireStudentRole(req: Request, res: Response, next: NextFunction): void {
  if (!req.authUser) {
    res.status(401).json({ success: false, message: 'Authentication is required.' });
    return;
  }

  if (req.authUser.role !== 'student') {
    res.status(403).json({ success: false, message: 'This endpoint is available to student accounts only.' });
    return;
  }

  next();
}
