import * as authService from '../services/auth.service.js';
import {
  sendOk,
  sendCreated,
} from '../utils/response.js';

export const register = async (req, res, next) => {
  try {
    const { payload } = await authService.registerUser(req.body);
    return sendCreated(res, 'Account created. Please verify your email.', payload);
  } catch (err) { next(err); }
};

export const login = async (req, res, next) => {
  try {
    const payload = await authService.loginUser(req.body);
    return sendOk(res, 'Login successful.', payload);
  } catch (err) { next(err); }
};

export const getMe = async (req, res, next) => {
  try {
    return sendOk(res, 'User profile retrieved.', { user: req.user.toJSON() });
  } catch (err) { next(err); }
};

export const refreshToken = async (req, res, next) => {
  try {
    const payload = await authService.refreshUserToken(req.body.refreshToken);
    return sendOk(res, 'Token refreshed successfully.', payload);
  } catch (err) { next(err); }
};

export const forgotPassword = async (req, res, next) => {
  try {
    await authService.requestPasswordReset(req.body.email);
    /**
     * Always return the same message whether the email exists or not.
     * Prevents user enumeration.
     */
    return sendOk(res, 'If an account exists for that email, a password reset link has been sent.');
  } catch (err) { next(err); }
};

export const resetPassword = async (req, res, next) => {
  try {
    const payload = await authService.resetUserPassword({
      token:    req.params.token,
      password: req.body.password,
    });
    return sendOk(res, 'Password reset successful. You are now logged in.', payload);
  } catch (err) { next(err); }
};

export const verifyEmail = async (req, res, next) => {
  try {
    await authService.verifyUserEmail(req.params.token);
    return sendOk(res, 'Email verified successfully.');
  } catch (err) { next(err); }
};

export const updatePassword = async (req, res, next) => {
  try {
    const payload = await authService.updateUserPassword({
      userId:          req.user._id,
      currentPassword: req.body.currentPassword,
      newPassword:     req.body.newPassword,
    });
    return sendOk(res, 'Password updated successfully.', payload);
  } catch (err) { next(err); }
};