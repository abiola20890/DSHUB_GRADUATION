import crypto from 'crypto';

const DEFAULT_LENGTH     = 6;
const DEFAULT_EXPIRY_MS  = 10 * 60 * 1000; // 10 minutes

export const generateOtp = (length = DEFAULT_LENGTH) => {
  const max = Math.pow(10, length);
  // crypto.randomInt(min, max) → integer in [min, max)
  const otp = crypto.randomInt(0, max);
  // Zero-pad to ensure consistent length (e.g. 482 → "000482" for 6-digit OTP)
  return String(otp).padStart(length, '0');
};

export const hashOtp = (otp) => {
  return crypto.createHash('sha256').update(otp).digest('hex');
};


export const verifyOtp = (submittedOtp, storedHash) => {
  try {
    const submittedHash = hashOtp(submittedOtp);
    const a = Buffer.from(submittedHash, 'hex');
    const b = Buffer.from(storedHash,   'hex');

    // Buffers must be the same length for timingSafeEqual
    if (a.length !== b.length) return false;

    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
};


export const generateOtpExpiry = (expiryMs = DEFAULT_EXPIRY_MS) => {
  return new Date(Date.now() + expiryMs);
};


export const isOtpExpired = (expiresAt) => {
  if (!expiresAt) return true;
  return new Date(expiresAt) < new Date();
};


export const generateOtpBundle = (length = DEFAULT_LENGTH, expiryMs = DEFAULT_EXPIRY_MS) => {
  const otp       = generateOtp(length);
  const hash      = hashOtp(otp);
  const expiresAt = generateOtpExpiry(expiryMs);
  return { otp, hash, expiresAt };
};