"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const teacherProfile_controller_1 = require("../controllers/teacherProfile.controller");
const teacher_controller_1 = require("../controllers/teacher.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const profileGuard_middleware_1 = require("../middlewares/profileGuard.middleware");
const router = (0, express_1.Router)();
// Base Guard: All endpoints below require a valid token and 'teacher' role
router.use(auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('teacher'));
// Check current onboarding progress (helps frontend route the user)
router.get('/onboarding-status', teacherProfile_controller_1.getOnboardingStatus);
// STEP 2: Fill profile details (headline, rate, bio)
router.put('/profile', teacherProfile_controller_1.updateTeacherProfile);
// STEP 3: Set availability (Guarded by requireCompletedProfile)
router.post('/availability', profileGuard_middleware_1.requireCompletedProfile, teacher_controller_1.updateAvailability);
exports.default = router;
//# sourceMappingURL=teacher.routes.js.map