import { sendUnauthorized, sendForbidden } from '../utils/response.js';

const ROLE_HIERARCHY = Object.freeze({
  intern:  1,
  mentor:  2,
  admin:   3,
});


export const restrictTo = (...roles) => {
  return (req, res, next) => {
    // Guard — protect middleware should always run first
    if (!req.user) {
      return sendUnauthorized(res, 'Authentication required.');
    }

    if (!roles.includes(req.user.role)) {
      return sendForbidden(
        res,
        `This action requires one of the following roles: ${roles.join(', ')}.`
      );
    }

    next();
  };
};


export const hasMinimumRole = (minimumRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendUnauthorized(res, 'Authentication required.');
    }

    const userLevel    = ROLE_HIERARCHY[req.user.role]    ?? 0;
    const minimumLevel = ROLE_HIERARCHY[minimumRole] ?? 0;

    if (userLevel < minimumLevel) {
      return sendForbidden(
        res,
        `This action requires at least the '${minimumRole}' role.`
      );
    }

    next();
  };
};


export const isSelfOrAdmin = (req, res, next) => {
  if (!req.user) {
    return sendUnauthorized(res, 'Authentication required.');
  }

  // Admins always pass
  if (req.user.role === 'admin') {
    return next();
  }

  const ownerId = res.locals.resourceOwnerId;

  if (!ownerId) {
    // Misconfiguration — resourceOwnerId was not set by the preceding middleware/controller
    console.error('[RBAC] isSelfOrAdmin: res.locals.resourceOwnerId is not set.');
    return sendForbidden(res, 'Access denied.');
  }

  if (req.user._id.toString() !== ownerId.toString()) {
    return sendForbidden(res, 'You can only modify your own resources.');
  }

  next();
};


export const isVerified = (req, res, next) => {
  if (!req.user) {
    return sendUnauthorized(res, 'Authentication required.');
  }

  if (!req.user.emailVerified) {
    return sendForbidden(
      res,
      'Please verify your email address before performing this action.'
    );
  }

  next();
};