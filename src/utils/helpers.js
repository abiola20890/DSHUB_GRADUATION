import crypto from 'crypto';
import { signTokenPair } from './jwt.js';

export const buildAuthPayload = (user) => {
  const { accessToken, refreshToken } = signTokenPair({
    id:   user._id.toString(),
    role: user.role,
  });

  return {
    accessToken,
    refreshToken,
    user: user.toJSON(), // toJSON transform strips password, __v, and reset tokens
  };
};

export const hashToken = (rawToken) => {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
};


const DEFAULT_PAGE  = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT     = 50;

export const parsePagination = (query, maxLimit = MAX_LIMIT) => {
  const page  = Math.max(1, parseInt(query.page,  10) || DEFAULT_PAGE);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit, 10) || DEFAULT_LIMIT));
  const skip  = (page - 1) * limit;
  return { page, limit, skip };
};


export const parseSort = (sortParam, allowedFields, defaultSort = '-createdAt') => {
  if (!sortParam) return defaultSort;
  return allowedFields.includes(sortParam) ? sortParam : defaultSort;
};

export const buildFilter = (query, allowedKeys) => {
  const filter = {};

  allowedKeys.forEach((key) => {
    if (query[key] === undefined || query[key] === '') return;

    // Coerce boolean strings
    if (query[key] === 'true')  { filter[key] = true;  return; }
    if (query[key] === 'false') { filter[key] = false; return; }

    filter[key] = query[key];
  });

  return filter;
};


export const stripAdminFields = (body, role, adminOnlyFields) => {
  const updates = { ...body };

  if (role !== 'admin') {
    adminOnlyFields.forEach((field) => delete updates[field]);
  }

  return updates;
};


export const pickFields = (obj, fields) => {
  return fields.reduce((acc, field) => {
    if (obj[field] !== undefined) acc[field] = obj[field];
    return acc;
  }, {});
};