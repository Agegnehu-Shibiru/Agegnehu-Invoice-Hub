const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authLimiter, otpLimiter } = require('../middleware/rateLimiter');
const passport = require('../config/passport');
const { body } = require('express-validator');
const { protect } = require('../middleware/auth');

// Validation
const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters').matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase, lowercase, and number'),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
];

router.post('/register', authLimiter, registerValidation, authController.register);
router.post('/login', authLimiter, loginValidation, authController.login);
router.post('/logout', protect, authController.logout);
router.post('/refresh-token', authController.refreshToken);
router.post('/verify-email/:token', authController.verifyEmail);
router.post('/forgot-password', authLimiter, body('email').isEmail(), authController.forgotPassword);
router.post('/reset-password/:token', authLimiter, body('password').isLength({ min: 8 }), authController.resetPassword);

// OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: `${process.env.CLIENT_URL}/login?error=oauth` }), authController.oauthSuccess);
router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));
router.get('/facebook/callback', passport.authenticate('facebook', { session: false, failureRedirect: `${process.env.CLIENT_URL}/login?error=oauth` }), authController.oauthSuccess);
router.get('/twitter', passport.authenticate('twitter'));
router.get('/twitter/callback', passport.authenticate('twitter', { session: false, failureRedirect: `${process.env.CLIENT_URL}/login?error=oauth` }), authController.oauthSuccess);

// Phone OTP
router.post('/phone/send-otp', otpLimiter, body('phone').isMobilePhone(), authController.sendPhoneOtp);
router.post('/phone/verify-otp', authLimiter, authController.verifyPhoneOtp);

module.exports = router;
