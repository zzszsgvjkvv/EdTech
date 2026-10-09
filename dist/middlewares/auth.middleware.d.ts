import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../models/user.model';
export declare const authenticate: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const authorize: (...allowedRoles: UserRole[]) => (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.middleware.d.ts.map