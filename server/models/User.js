const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 100 },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    password: { type: String, minlength: 8, select: false },
    phone: { type: String, trim: true },
    avatar: { type: String, default: '' },
    role: { type: String, enum: ['user', 'client', 'admin', 'superadmin'], default: 'user' },

    // OAuth
    googleId: { type: String, select: false },
    facebookId: { type: String, select: false },
    twitterId: { type: String, select: false },
    authProviders: [{ type: String, enum: ['local', 'google', 'facebook', 'twitter', 'phone'] }],

    // Email verification
    isEmailVerified: { type: Boolean, default: false },
    emailVerifyToken: { type: String, select: false },
    emailVerifyExpires: { type: Date, select: false },

    // Password reset
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },

    // Phone OTP
    phoneOtp: { type: String, select: false },
    phoneOtpExpires: { type: Date, select: false },
    isPhoneVerified: { type: Boolean, default: false },

    // Security
    loginAttempts: { type: Number, default: 0, select: false },
    lockUntil: { type: Date, select: false },
    refreshTokenFamily: [{ token: String, createdAt: { type: Date, default: Date.now } }],

    // Subscription
    subscription: {
      plan: { type: String, enum: ['free', 'pro', 'business'], default: 'free' },
      status: { type: String, enum: ['active', 'inactive', 'cancelled', 'past_due', 'trialing'], default: 'active' },
      stripeCustomerId: String,
      stripeSubscriptionId: String,
      currentPeriodStart: Date,
      currentPeriodEnd: Date,
      cancelAtPeriodEnd: { type: Boolean, default: false },
      trialEnd: Date,




      
    },

    // Branding / Settings
    settings: {
      currency: { type: String, default: 'USD' },
      timezone: { type: String, default: 'UTC' },
      invoicePrefix: { type: String, default: 'INV' },
      nextInvoiceNumber: { type: Number, default: 1 },
      logo: String,
      brandColor: { type: String, default: '#4F46E5' },
      paymentTerms: { type: String, default: 'Net 30' },
      taxRate: { type: Number, default: 0 },
      notifications: {
        invoicePaid: { type: Boolean, default: true },
        invoiceOverdue: { type: Boolean, default: true },
        weeklyDigest: { type: Boolean, default: true },
      },
    },

    // Soft delete
    isDeleted: { type: Boolean, default: false, select: false },
    deletedAt: { type: Date, select: false },
    deleteRecoveryToken: { type: String, select: false },
    deleteRecoveryExpires: { type: Date, select: false },

    lastLogin: Date,
  },
  { timestamps: true }
);

// FIXED INDEXES - NO DUPLICATE EMAIL INDEX
// The 'unique: true' on email field already creates an index
userSchema.index({ googleId: 1 }, { sparse: true });
userSchema.index({ facebookId: 1 }, { sparse: true });
userSchema.index({ isDeleted: 1 });
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Check if account is locked
userSchema.methods.isLocked = function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Increment login attempts
userSchema.methods.incLoginAttempts = async function () {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    this.loginAttempts = 1;
    this.lockUntil = undefined;
  } else {
    this.loginAttempts += 1;
    if (this.loginAttempts >= 5) {
      this.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
    }
  }
  return this.save({ validateBeforeSave: false });
};

// Generate email verify token
userSchema.methods.createEmailVerifyToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.emailVerifyToken = crypto.createHash('sha256').update(token).digest('hex');
  this.emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return token;
};

// Generate password reset token
userSchema.methods.createPasswordResetToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
  this.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
  return token;
};

// Filter deleted users by default
userSchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: { $ne: true } });
  }
  next();
});

module.exports = mongoose.model('User', userSchema);