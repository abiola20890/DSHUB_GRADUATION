import { Router } from 'express';
import {
  getAllMilestones,
  getMilestoneById,
  createMilestone,
  updateMilestone,
  deleteMilestone,
} from '../controllers/milestone.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { restrictTo } from '../middlewares/rbac.middleware.js';

const router = Router();

// ── Public ────────────────────────────────────────────────────────────────────
router.get('/',    getAllMilestones);
router.get('/:id', getMilestoneById);

// ── Admin only ────────────────────────────────────────────────────────────────
router.post  ('/',    protect, restrictTo('admin'), createMilestone);
router.put   ('/:id', protect, restrictTo('admin'), updateMilestone);
router.delete('/:id', protect, restrictTo('admin'), deleteMilestone);

export default router;