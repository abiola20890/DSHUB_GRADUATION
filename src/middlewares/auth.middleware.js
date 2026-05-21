import User from '../models/user.model.js';
import {
  extractBearerToken,
  verifyAccessToken,
  isTokenExpiredError,
} from '../utils/jwt.js';
import {
  sendUnauthorized,
  sendServerError,
} from '../utils/response.js';


export const protect = async (req, res, next) => {
  try {
    // 1. Extract token from Authorization header
    const token = extractBearerToken(req.headers.authorization);

    if (!token) {
      return sendUnauthorized(res, 'No token provided. Please log in.');
    }

    // 2. Verify token — throws TokenExpiredError or JsonWebTokenError on failure
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      if (isTokenExpiredError(err)) {
        return sendUnauthorized(res, 'Your session has expired. Please log in again.');
      }
      return sendUnauthorized(res, 'Invalid token. Please log in again.');
    }

    // 3. Fetch user from DB
    const user = await User.findById(decoded.id).select('+passwordChangedAt');

    if (!user) {
      return sendUnauthorized(res, 'The account belonging to this token no longer exists.');
    }

    // 4. Check account is active
    if (!user.isActive) {
      return sendUnauthorized(res, 'Your account has been deactivated. Please contact support.');
    }

    // 5. Check password has not changed since token was issued.
    if (user.changedPasswordAfter(decoded.iat)) {
      return sendUnauthorized(res, 'Your password was recently changed. Please log in again.');
    }

    // 6. Attach user to request — available in all downstream middleware and controllers
    req.user = user;

    next();
  } catch (err) {
    return sendServerError(res, err);
  }
};


export const optionalAuth = async (req, res, next) => {
  try {
    const token = extractBearerToken(req.headers.authorization);

    if (!token) {
      req.user = null;
      return next();
    }

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch {
      req.user = null;
      return next();
    }

    const user = await User.findById(decoded.id).select('+passwordChangedAt');

    if (!user || !user.isActive || user.changedPasswordAfter(decoded.iat)) {
      req.user = null;
      return next();
    }

    req.user = user;
    next();
  } catch {
    // Never block the request on optional auth failure
    req.user = null;
    next();
  }
};