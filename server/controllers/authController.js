const crypto = require('crypto');
const User = require('../models/User');
const { AppError, catchAsync, sendResponse } = require('../utils/appError');
const { sendTokens, clearTokens, verifyRefreshToken, signAccessToken, generateFamilyId, signRefreshToken } = require('../utils/tokenUtils');
const emailService = require('../services/emailService');
const logger = require('../utils/logger');
const twilio = require('twilio');

const twilioClient = process.env.TWILIO_ACCOUNT_SID?.startsWith('AC')
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

// ── Register ────────────────────────────────────────────────────────────────────
exports.register = catchAsync(async (req, res, next) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email }).setOptions({ includeDeleted: true });
  if (existing?.isDeleted) return next(new AppError('This account was deleted. Contact support to recover it.', 409));
  if (existing) return next(new AppError('Email already registered. Please log in or reset your password.', 409));

  const user = await User.create({ name, email, password, authProviders: ['local'] });

  const verifyToken = user.createEmailVerifyToken();
  await user.save({ validateBeforeSave: false });

  const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${verifyToken}`;
  await emailService.sendVerifyEmail(email, { name, verifyUrl }, user._id).catch((e) => logger.error('Verify email send failed:', e));
  await emailService.sendWelcome(email, { name, loginUrl: `${process.env.CLIENT_URL}/login` }, user._id).catch(() => {});

  sendResponse(res, 201, null, 'Registration successful! Please check your email to verify your account.');
});

// ── Login ───────────────────────────────────────────────────────────────────────
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) return next(new AppError('Please provide email and password.', 400));

  const user = await User.findOne({ email }).select('+password +loginAttempts +lockUntil +refreshTokenFamily');
  if (!user || !user.authProviders.includes('local')) return next(new AppError('Invalid email or password.', 401));

  if (user.isLocked()) return next(new AppError('Account temporarily locked due to too many failed attempts. Try again in 15 minutes.', 423));

  const isCorrect = await user.comparePassword(password);
  if (!isCorrect) {
    await user.incLoginAttempts();
    return next(new AppError('Invalid email or password.', 401));
  }

  if (!user.isEmailVerified) return next(new AppError('Please verify your email before logging in.', 403));

  // Reset login attempts
  user.loginAttempts = 0;
  user.lockUntil = undefined;
  user.lastLogin = new Date();
  const { familyId, refreshToken } = sendTokens(res, user);

  // Store refresh token family
  user.refreshTokenFamily = user.refreshTokenFamily.filter((t) => t.createdAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  user.refreshTokenFamily.push({ token: crypto.createHash('sha256').update(refreshToken).digest('hex'), createdAt: new Date() });
  await user.save({ validateBeforeSave: false });

  const userOut = { _id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, isEmailVerified: user.isEmailVerified, subscription: user.subscription, settings: user.settings };
  sendResponse(res, 200, { user: userOut }, 'Logged in successfully.');
});

// ── Logout ──────────────────────────────────────────────────────────────────────
exports.logout = catchAsync(async (req, res) => {
  clearTokens(res);
  sendResponse(res, 200, null, 'Logged out successfully.');
});

// ── Refresh Token ───────────────────────────────────────────────────────────────
exports.refreshToken = catchAsync(async (req, res, next) => {
  const token = req.cookies?.refreshToken;
  if (!token) return next(new AppError('No refresh token provided.', 401));

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    return next(new AppError('Invalid or expired refresh token.', 401));
  }

  const user = await User.findById(decoded.id).select('+refreshTokenFamily');
  if (!user) return next(new AppError('User not found.', 401));

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const tokenExists = user.refreshTokenFamily.some((t) => t.token === hashedToken);

  if (!tokenExists) {
    // Token reuse detected — invalidate all sessions
    user.refreshTokenFamily = [];
    await user.save({ validateBeforeSave: false });
    clearTokens(res);
    return next(new AppError('Token reuse detected. All sessions invalidated. Please log in again.', 401));
  }

  // Rotate token
  user.refreshTokenFamily = user.refreshTokenFamily.filter((t) => t.token !== hashedToken);
  const { refreshToken: newRefresh } = sendTokens(res, user);
  user.refreshTokenFamily.push({ token: crypto.createHash('sha256').update(newRefresh).digest('hex'), createdAt: new Date() });
  await user.save({ validateBeforeSave: false });

  sendResponse(res, 200, null, 'Token refreshed.');
});

// ── Verify Email ────────────────────────────────────────────────────────────────
exports.verifyEmail = catchAsync(async (req, res, next) => {
  const hashed = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({ emailVerifyToken: hashed, emailVerifyExpires: { $gt: Date.now() } }).select('+emailVerifyToken +emailVerifyExpires');
  if (!user) return next(new AppError('Invalid or expired verification link. Please request a new one.', 400));

  user.isEmailVerified = true;
  user.emailVerifyToken = undefined;
  user.emailVerifyExpires = undefined;
  await user.save({ validateBeforeSave: false });

  sendResponse(res, 200, null, 'Email verified successfully! You can now log in.');
});

// ── Forgot Password ─────────────────────────────────────────────────────────────
exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return sendResponse(res, 200, null, 'If an account exists, a reset link has been sent.');

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
  await emailService.sendPasswordReset(user.email, { name: user.name, resetUrl }, user._id);

  sendResponse(res, 200, null, 'Password reset link sent to your email.');
});

// ── Reset Password ──────────────────────────────────────────────────────────────
exports.resetPassword = catchAsync(async (req, res, next) => {
  const hashed = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({ passwordResetToken: hashed, passwordResetExpires: { $gt: Date.now() } }).select('+passwordResetToken +passwordResetExpires');
  if (!user) return next(new AppError('Invalid or expired reset token.', 400));

  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.loginAttempts = 0;
  user.lockUntil = undefined;
  await user.save();

  clearTokens(res);
  sendResponse(res, 200, null, 'Password reset successfully. Please log in with your new password.');
});

// ── OAuth Success Handler ───────────────────────────────────────────────────────
exports.oauthSuccess = catchAsync(async (req, res) => {
  const user = req.user;
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });
  sendTokens(res, user);
  res.redirect(`${process.env.CLIENT_URL}/dashboard`);
});

// ── Send Phone OTP ──────────────────────────────────────────────────────────────
exports.sendPhoneOtp = catchAsync(async (req, res, next) => {
  const { phone } = req.body;
  if (!twilioClient) return next(new AppError('Phone verification is not configured.', 503));

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const hashed = crypto.createHash('sha256').update(otp).digest('hex');

  let user = await User.findOne({ phone });
  if (!user) user = new User({ phone, authProviders: ['phone'] });

  user.phoneOtp = hashed;
  user.phoneOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min
  await user.save({ validateBeforeSave: false });

  await twilioClient.messages.create({ body: `Your InvoiceHub Pro verification code: ${otp}. Valid for 10 minutes.`, from: process.env.TWILIO_PHONE_NUMBER, to: phone });

  sendResponse(res, 200, null, 'OTP sent to your phone number.');
});

// ── Verify Phone OTP ────────────────────────────────────────────────────────────
exports.verifyPhoneOtp = catchAsync(async (req, res, next) => {
  const { phone, otp } = req.body;
  const hashed = crypto.createHash('sha256').update(otp).digest('hex');

  const user = await User.findOne({ phone, phoneOtp: hashed, phoneOtpExpires: { $gt: Date.now() } }).select('+phoneOtp +phoneOtpExpires');
  if (!user) return next(new AppError('Invalid or expired OTP.', 400));

  user.isPhoneVerified = true;
  user.isEmailVerified = true;
  user.phoneOtp = undefined;
  user.phoneOtpExpires = undefined;
  await user.save({ validateBeforeSave: false });

  sendTokens(res, user);
  const userOut = { _id: user._id, name: user.name, phone: user.phone, role: user.role };
  sendResponse(res, 200, { user: userOut }, 'Phone verified. Logged in successfully.');
});
