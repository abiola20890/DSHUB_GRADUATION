
import jwt from 'jsonwebtoken';


const ACCESS_SECRET  = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_EXPIRY  = process.env.JWT_EXPIRES_IN         || '15m';
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

if (!ACCESS_SECRET || !REFRESH_SECRET) {
  throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be set in environment variables');
}


export const signAccessToken = (payload) => {
  return jwt.sign(
    { id: payload.id, role: payload.role },
    ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRY, algorithm: 'HS256' }
  );
};


export const signRefreshToken = (payload) => {
  return jwt.sign(
    { id: payload.id },
    REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRY, algorithm: 'HS256' }
  );
};


export const signTokenPair = (payload) => ({
  accessToken:  signAccessToken(payload),
  refreshToken: signRefreshToken(payload),
});


export const verifyAccessToken = (token) => {
  return jwt.verify(token, ACCESS_SECRET);
};


export const verifyRefreshToken = (token) => {
  return jwt.verify(token, REFRESH_SECRET);
};


export const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch {
    return null;
  }
};


export const extractBearerToken = (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  return token?.trim() || null;
};


export const isTokenExpiredError = (err) => err?.name === 'TokenExpiredError';