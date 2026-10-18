import { IUser } from '../models/user.model';
import type { AuthenticatedAIUser } from '../middleware/require-ai-auth';


declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthenticatedAIUser;
    }
  }
}

export {};
