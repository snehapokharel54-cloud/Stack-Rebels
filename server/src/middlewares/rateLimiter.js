import rateLimit from "express-rate-limit";

/**
 * Standard rate limiter for user/host auth routes.
 * Max 10 requests per 15 minutes per IP.
 */
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
    errors: [],
  },
});

/**
 * Strict rate limiter for admin auth routes.
 * Max 5 requests per 15 minutes per IP.
 */
const strictRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
    errors: [],
  },
});

/**
 * OTP rate limiter for signup verification.
 * Max 3 requests per 15 minutes per IP.
 */
const otpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many attempts. Please try again later.",
    errors: [],
  },
});

export { rateLimiter, strictRateLimiter, otpRateLimiter };
