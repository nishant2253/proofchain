const rateLimit = require("express-rate-limit");

/**
 * API rate limiter middleware
 * Limits requests based on IP address
 */
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes by default
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    status: 429,
    error: "Too many requests, please try again later.",
  },
});

/**
 * Stricter rate limiter for auth-related endpoints
 */
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 auth requests per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    error: "Too many authentication attempts, please try again later.",
  },
});

/**
 * Rate limiter for content submission
 */
const contentSubmissionLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 10, // Limit each IP to 10 content submissions per day
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    error: "Too many content submissions, please try again later.",
  },
});

/**
 * Rate limiter for voting operations
 */
const votingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each IP to 20 voting operations per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    error: "Too many voting operations, please try again later.",
  },
});

module.exports = {
  apiLimiter,
  authLimiter,
  contentSubmissionLimiter,
  votingLimiter,
};
