import rateLimit from "express-rate-limit";

/**
 * Applies to /login and /register: caps repeated attempts per IP so
 * credential-stuffing / password-guessing scripts can't hammer the
 * endpoint. Successful requests don't need to be penalized as hard as
 * failed ones, but express-rate-limit counts all requests by default,
 * which is the safe, simple choice here.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts. Please try again in a few minutes." },
});

/**
 * Slightly looser limit for password-reset requests, which are also a
 * common abuse target (mail-bombing a victim's inbox with reset links).
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Please try again in a few minutes." },
});
