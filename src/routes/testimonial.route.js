import { Router } from 'express';
import {
  getAllTestimonials,
  submitTestimonial,
  approveTestimonial,
  featureTestimonial,
  deleteTestimonial,
} from '../controllers/testimonial.controller.js';
import { protect, optionalAuth } from '../middlewares/auth.middleware.js';
import { restrictTo, isVerified } from '../middlewares/rbac.middleware.js';

const router = Router();

// ── Public (optionalAuth so admins see unapproved testimonials too) ───────────
router.get('/', optionalAuth, getAllTestimonials);

// ── Authenticated — any verified user can submit one testimonial ──────────────
router.post('/', protect, isVerified, submitTestimonial);

// ── Admin only ────────────────────────────────────────────────────────────────
router.put   ('/:id/approve', protect, restrictTo('admin'), approveTestimonial);
router.put   ('/:id/feature', protect, restrictTo('admin'), featureTestimonial);
router.delete('/:id',         protect, restrictTo('admin'), deleteTestimonial);

export default router;