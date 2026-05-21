import { Router } from 'express';
import {
  getDashboard,
  getCohortOverview,
  getTrackBreakdown,
  getSubmissionMetrics,
  regenerateAnalytics,
} from '../controllers/analytics.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { restrictTo } from '../middlewares/rbac.middleware.js';

const router = Router();

// ── Public ────────────────────────────────────────────────────────────────────
router.get('/cohort', getCohortOverview);
router.get('/tracks', getTrackBreakdown);

// ── Admin only ────────────────────────────────────────────────────────────────
router.get ('/dashboard',   protect, restrictTo('admin'), getDashboard);
router.get ('/submissions', protect, restrictTo('admin'), getSubmissionMetrics);
router.post('/regenerate',  protect, restrictTo('admin'), regenerateAnalytics);

export default router;