import { Router } from 'express';
import { updateTeacherProfile, getOnboardingStatus } from '../controllers/teacherProfile.controller';
import { updateAvailability } from '../controllers/teacher.controller';
import { authenticate, authorize, requireRole  } from '../middlewares/auth.middleware';
import { requireCompletedProfile } from '../middlewares/profileGuard.middleware';
import { saveVocabulary } from '../controllers/vocabulary.controller';
import { upload } from '../config/cloudinary.config';



// import { authenticate, authorizeRole } from '../middlewares/auth.middleware'; // Assuming standard auth middleware
import {
  upsertTutorProfile,
  createAvailabilitySlot,
  getTeacherAppointments,
  updateAppointmentStatus,
  getTeacherAppointmentChat,
} from '../controllers/tutor-tutoring.controller';


const router = Router();
 

router.use(authenticate, authorize('teacher'));
router.use(requireRole(['teacher', 'admin']));

// Vocabulary routes
router.post('/vocabulary', upload.single('image'), saveVocabulary);

// 🆕 Teacher Profile & Availability route


// Base Guard: All endpoints below require a valid token and 'teacher' role
router.use(authenticate, requireRole(['teacher']));

router.put('/tutoring/profile', upsertTutorProfile);
router.post('/tutoring/availability', createAvailabilitySlot);
router.get('/tutoring/appointments', getTeacherAppointments);
router.patch('/tutoring/appointments/:id/status', updateAppointmentStatus);
router.get('/tutoring/appointments/:id/chat', getTeacherAppointmentChat);
// Check current onboarding progress (helps frontend route the user)
router.get('/onboarding-status', getOnboardingStatus);

// STEP 2: Fill profile details (headline, rate, bio)
router.put('/profile', updateTeacherProfile);

// STEP 3: Set availability (Guarded by requireCompletedProfile)
router.post('/availability', requireCompletedProfile, updateAvailability);

export default router;













