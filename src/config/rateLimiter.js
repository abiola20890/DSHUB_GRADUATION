import rateLimit from 'express-rate-limit';

const minutes = (n) => n * 60 * 1000;
const hours   = (n) => n * 60 * minutes(1);


const rateLimitHandler = (req, res) => {
  res.status(429).json({
    success: false,
    message: 'Too many requests. Please slow down and try again later.',
  });
};


export const globalLimiter = rateLimit({
  windowMs:         minutes(15),
  max:              parseInt(process.env.RATE_LIMIT_GLOBAL_MAX, 10) || 100,
  standardHeaders:  true,  // Return rate limit info in RateLimit-* headers
  legacyHeaders:    false,  // Disable X-RateLimit-* headers
  handler:          rateLimitHandler,
  message:          'Too many requests. Please try again later.',
});


export const authLimiter = rateLimit({
  windowMs:        minutes(15),
  max:             parseInt(process.env.RATE_LIMIT_AUTH_MAX, 10) || 10,
  standardHeaders: true,
  legacyHeaders:   false,
  handler:         rateLimitHandler,
  message:         'Too many login attempts. Please try again in 15 minutes.',
});


export const strictLimiter = rateLimit({
  windowMs:        hours(1),
  max:             parseInt(process.env.RATE_LIMIT_STRICT_MAX, 10) || 3,
  standardHeaders: true,
  legacyHeaders:   false,
  handler:         rateLimitHandler,
  message:         'Too many password reset requests. Please try again in 1 hour.',
});