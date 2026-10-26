import rateLimit from 'express-rate-limit';

const skip = () => process.env.NODE_ENV === 'test';

// A single page view makes 6-10 API calls, so the general limit must be generous
const API_LIMIT = Number(process.env.RATE_LIMIT_MAX) || (process.env.NODE_ENV === 'production' ? 1500 : 10000);

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: API_LIMIT,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: (req) => skip() || req.originalUrl.startsWith('/api/payments/webhook'),
  message: { success: false, message: 'Too many requests, please try again later' },
});

// Strict limiter for login / register / password endpoints
// Only failed attempts count, so many people logging in correctly from one shared IP
// (office / college Wi-Fi) are never locked out, while password guessing still is.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip,
  message: { success: false, message: 'Too many attempts, please try again after 15 minutes' },
});
