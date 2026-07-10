const { verifyAccessToken } = require('../utils/tokenUtils');
const { AppError, catchAsync } = require('../utils/appError');
const User = require('../models/User');

exports.protect = catchAsync(async (req, res, next) => {
  // Get token from cookie or Authorization header
  let token = req.cookies?.accessToken;
  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return next(new AppError('You are not logged in. Please log in to get access.', 401));

  // Verify token
  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch (err) {
    if (err.name === 'TokenExpiredError') return next(new AppError('Your session has expired. Please log in again.', 401));
    return next(new AppError('Invalid token. Please log in again.', 401));
  }

  // Check user still exists
  const user = await User.findById(decoded.id).select('+loginAttempts +lockUntil');
  if (!user) return next(new AppError('The user belonging to this token no longer exists.', 401));

  if (user.isLocked()) return next(new AppError('Account temporarily locked due to too many failed login attempts. Try again later.', 423));

  req.user = user;
  next();
});

exports.restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(new AppError('You do not have permission to perform this action.', 403));
  }
  next();
};

exports.optionalAuth = catchAsync(async (req, res, next) => {
  const token = req.cookies?.accessToken;
  if (!token) return next();
  try {
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.id);
    if (user) req.user = user;
  } catch (err) {
    // silently ignore
  }
  next();
});
