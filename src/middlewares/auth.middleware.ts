import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, UserRole } from '../models/user.model';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key';

interface DecodedToken {
  id: string;
  role: UserRole;
}

// 1. AUTHENTICATION GUARD (Checks if token exists & is valid)
export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Unauthorized: Missing or invalid token format' });
      return;
    }

    const token = authHeader.split(' ')[1];
 const decoded = jwt.verify(token!, JWT_SECRET)  as DecodedToken;

    const user = await User.findById(decoded.id);
    if (!user) {
      res.status(401).json({ message: 'Unauthorized: User no longer exists' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }
};

// 2. AUTHORIZATION GUARD (Checks if user has required role)
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ message: 'Forbidden: Insufficient permissions for this action' });
      return;
    }

    next();
  };
};