import { Router } from 'express';
import {
  getAllInterns,
  getInternsByTrack,
  getInternById,
  createIntern,
  setOwner,
  updateIntern,
  deleteIntern,
} from '../controllers/intern.controller.js';
import { protect, optionalAuth } from '../middlewares/auth.middleware.js';
import { restrictTo, isSelfOrAdmin } from '../middlewares/rbac.middleware.js';

const router = Router();

// ── Public (with optional auth for visibility checks) ────────────────────────


router.get('/',              optionalAuth, getAllInterns);
router.get('/track/:track',  optionalAuth, getInternsByTrack);
router.get('/:id',           optionalAuth, getInternById);

// ── Admin only ────────────────────────────────────────────────────────────────
router.post('/',   protect, restrictTo('admin'), createIntern);
router.delete('/:id', protect, restrictTo('admin'), deleteIntern);

// ── Admin or self ─────────────────────────────────────────────────────────────

router.put('/:id', protect, setOwner, isSelfOrAdmin, updateIntern);

export default router;