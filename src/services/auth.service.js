import User from '../models/user.model.js';
import { verifyRefreshToken, isTokenExpiredError } from '../utils/jwt.js';
import { buildAuthPayload, hashToken } from '../utils/helpers.js';
import { AppError } from '../middlewares/errorHandler.js';


export const registerUser = async ({ fullName, email, password, role, track }) => {
  const existing = await User.findOne({ email: email?.toLowerCase().trim() });
  if (existing) {
    throw new AppError('An account with this email already exists.', 409);
  }

  const user = await User.create({
    fullName,
    email,
    password,
    role: ['intern', 'mentor'].includes(role) ? role : 'intern',
    track,
  });

  const rawVerificationToken = user.createEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  return {
    user,
    rawVerificationToken,
    payload: buildAuthPayload(user),
  };
};


export const loginUser = async ({ email, password }) => {
  if (!email || !password) {
    throw new AppError('Email and password are required.', 400);
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

  // Same message for wrong email and wrong password — prevents user enumeration
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password.', 401);
  }

  if (!user.isActive) {
    throw new AppError('Your account has been deactivated. Please contact support.', 401);
  }

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  return buildAuthPayload(user);
};


export const refreshUserToken = async (token) => {
  if (!token) {
    throw new AppError('Refresh token is required.', 400);
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch (err) {
    if (isTokenExpiredError(err)) {
      throw new AppError('Refresh token has expired. Please log in again.', 401);
    }
    throw new AppError('Invalid refresh token. Please log in again.', 401);
  }

  const user = await User.findById(decoded.id).select('+passwordChangedAt');

  if (!user || !user.isActive) {
    throw new AppError('Account no longer valid. Please log in again.', 401);
  }

  return buildAuthPayload(user);
};


export const requestPasswordReset = async (email) => {
  if (!email) {
    throw new AppError('Email address is required.', 400);
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });

  if (!user) return null; // caller sends generic response

  const rawToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  return { user, rawToken };
};


export const resetUserPassword = async ({ token, password }) => {
  if (!password) {
    throw new AppError('New password is required.', 400);
  }

  const user = await User.findOne({
    passwordResetToken:   hashToken(token),
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw new AppError('Password reset token is invalid or has expired.', 400);
  }

  user.password             = password;
  user.passwordResetToken   = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  return buildAuthPayload(user);
};


export const verifyUserEmail = async (token) => {
  const user = await User.findOne({
    emailVerificationToken:   hashToken(token),
    emailVerificationExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw new AppError('Email verification token is invalid or has expired.', 400);
  }

  user.emailVerified            = true;
  user.emailVerificationToken   = undefined;
  user.emailVerificationExpires = undefined;
  await user.save({ validateBeforeSave: false });
};


export const updateUserPassword = async ({ userId, currentPassword, newPassword }) => {
  if (!currentPassword || !newPassword) {
    throw new AppError('Current password and new password are required.', 400);
  }

  const user = await User.findById(userId).select('+password');

  if (!(await user.comparePassword(currentPassword))) {
    throw new AppError('Current password is incorrect.', 401);
  }

  user.password = newPassword;
  await user.save(); // triggers pre-save hash + sets passwordChangedAt

  return buildAuthPayload(user);
};