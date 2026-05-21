import { Router } from 'express';
import {
  register,
  login,
  getMe,
  refreshToken,
  forgotPassword,
  resetPassword,
  verifyEmail,
  updatePassword,
} from '../controllers/auth.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { authLimiter, strictLimiter } from '../config/rateLimiter.js';

const router = Router();

// ── Public ────────────────────────────────────────────────────────────────────
router.post('/register',          authLimiter,   register);
router.post('/login',             authLimiter,   login);
router.post('/refresh-token',                    refreshToken);
router.post('/forgot-password',   strictLimiter, forgotPassword);
router.post('/reset-password/:token',            resetPassword);
router.post('/verify-email/:token',              verifyEmail);

// ── Protected ─────────────────────────────────────────────────────────────────
router.get  ('/me',               protect,       getMe);
router.patch('/update-password',  protect,       updatePassword);

export default router;