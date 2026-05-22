import { Router } from 'express';
import {
  getAllMedia,
  getMediaById,
  uploadMedia,
  updateMedia,
  deleteMedia,
} from '../controllers/media.controller.js';
import { protect, optionalAuth } from '../middlewares/auth.middleware.js';
import { restrictTo } from '../middlewares/rbac.middleware.js';
import upload from '../config/multer.js';

const router = Router();

// ── Public (optionalAuth so admin sees private media) ─────────────────────────
router.get('/',    optionalAuth, getAllMedia);
router.get('/:id', optionalAuth, getMediaById);

// ── Admin only ────────────────────────────────────────────────────────────────
router.post(
  '/',
  protect,
  restrictTo('admin'),
  upload.single('file'),
  uploadMedia
);

router.put   ('/:id', protect, restrictTo('admin'), updateMedia);
router.delete('/:id', protect, restrictTo('admin'), deleteMedia);

export default router;