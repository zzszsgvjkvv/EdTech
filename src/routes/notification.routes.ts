import { Router } from 'express';
import { registerFcmToken, sendNotification } from '../controllers/notification.controller';
import { authenticate, requireRole } from '../middlewares/auth.middleware';

const router = Router();

// Any authenticated user can register their token upon login
router.post('/register-token', authenticate, registerFcmToken);

// Teachers or admins can trigger notifications
router.post('/send', authenticate, requireRole(['teacher', 'admin']), sendNotification);

export default router;