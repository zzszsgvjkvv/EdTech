import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { getPosts, createPost } from '../controllers/post.controller';

const router = Router();

// Both students and teachers can view and create posts in the class feed
router.use(authenticate);

router.get('/', getPosts);
router.post('/', createPost);

export default router;