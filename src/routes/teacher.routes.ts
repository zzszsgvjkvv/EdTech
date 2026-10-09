import { Router } from 'express';
import { updateTeacherProfile, getOnboardingStatus } from '../controllers/teacherProfile.controller';
import { updateAvailability } from '../controllers/teacher.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { requireCompletedProfile } from '../middlewares/profileGuard.middleware';

const router = Router();

// Base Guard: All endpoints below require a valid token and 'teacher' role
router.use(authenticate, authorize('teacher'));

// Check current onboarding progress (helps frontend route the user)
router.get('/onboarding-status', getOnboardingStatus);

// STEP 2: Fill profile details (headline, rate, bio)
router.put('/profile', updateTeacherProfile);

// STEP 3: Set availability (Guarded by requireCompletedProfile)
router.post('/availability', requireCompletedProfile, updateAvailability);

export default router;