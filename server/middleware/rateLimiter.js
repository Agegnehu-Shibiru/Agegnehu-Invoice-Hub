const rateLimit = require('express-rate-limit');
const { AppError } = require('../utils/appError');

const createLimiter = (windowMs, max, message) =>
  rateLimit({
    windowMs,
    max,
    message: { status: 'fail', message },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({ status: 'fail', message });
    },
  });

// Global: 100 req / 15 min
exports.globalLimiter = createLimiter(15 * 60 * 1000, 100, 'Too many requests from this IP, please try again in 15 minutes.');

// Auth: 5 req / 15 min
exports.authLimiter = createLimiter(15 * 60 * 1000, 5, 'Too many authentication attempts. Please try again in 15 minutes.');

// Contact form: 10 req / hour
exports.contactLimiter = createLimiter(60 * 60 * 1000, 10, 'Too many contact form submissions. Please try again in an hour.');

// OTP: 3 req / 10 min
exports.otpLimiter = createLimiter(10 * 60 * 1000, 3, 'Too many OTP requests. Please try again in 10 minutes.');

// API: 1000 req / hour per user
exports.apiLimiter = createLimiter(60 * 60 * 1000, 1000, 'API rate limit exceeded. Upgrade your plan for higher limits.');
