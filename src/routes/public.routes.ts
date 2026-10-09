import { Router } from 'express';
import { getPublicInfo } from '../controllers/public.controller';

const router = Router();
router.get('/info', getPublicInfo); // Unprotected Public API

export default router;