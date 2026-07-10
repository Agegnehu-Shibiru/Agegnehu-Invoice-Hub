const User = require('../models/User');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const Subscription = require('../models/Subscription');
const { ApiLog, AuditLog, EmailLog } = require('../models/Logs');
const { AppError, catchAsync, sendResponse } = require('../utils/appError');

// ── Platform Stats ──────────────────────────────────────────────────────────────
exports.getStats = catchAsync(async (req, res) => {
  const [totalUsers, totalInvoices, mrrData, churnData, newUsersThisMonth, activeSubscriptions] = await Promise.all([
    User.countDocuments(),
    Invoice.countDocuments(),
    Subscription.aggregate([{ $match: { status: 'active' } }, { $group: { _id: null, mrr: { $sum: { $cond: [{ $eq: ['$interval', 'monthly'] }, '$amount', { $divide: ['$amount', 12] }] } } } }]),
    Subscription.countDocuments({ status: 'cancelled', updatedAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } }),
    User.countDocuments({ createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } }),
    Subscription.countDocuments({ status: 'active' }),
  ]);

  sendResponse(res, 200, {
    stats: {
      totalUsers,
      totalInvoices,
      mrr: mrrData[0]?.mrr || 0,
      churnThisMonth: churnData,
      newUsersThisMonth,
      activeSubscriptions,
    },
  });
});

// ── User Management ─────────────────────────────────────────────────────────────
exports.getUsers = catchAsync(async (req, res) => {
  const { page = 1, limit = 20, search, role, plan } = req.query;
  const query = {};
  if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
  if (role) query.role = role;
  if (plan) query['subscription.plan'] = plan;

  const total = await User.countDocuments(query);
  const users = await User.find(query).select('-password -googleId -facebookId -twitterId').sort('-createdAt').skip((page - 1) * limit).limit(Number(limit));

  sendResponse(res, 200, { users, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } });
});

exports.getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id).setOptions({ includeDeleted: true });
  if (!user) return next(new AppError('User not found.', 404));
  sendResponse(res, 200, { user });
});

exports.updateUser = catchAsync(async (req, res, next) => {
  const { role, subscription } = req.body;
  const user = await User.findByIdAndUpdate(req.params.id, { role, 'subscription.plan': subscription?.plan }, { new: true, runValidators: true });
  if (!user) return next(new AppError('User not found.', 404));

  await AuditLog.create({ actor: req.user._id, actorName: req.user.name, actorRole: req.user.role, action: 'UPDATE_USER', resource: 'User', resourceId: user._id, changes: req.body });
  sendResponse(res, 200, { user }, 'User updated.');
});

exports.banUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError('User not found.', 404));
  user.lockUntil = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000); // 100 years
  await user.save({ validateBeforeSave: false });
  await AuditLog.create({ actor: req.user._id, actorName: req.user.name, actorRole: req.user.role, action: 'BAN_USER', resource: 'User', resourceId: user._id });
  sendResponse(res, 200, null, 'User banned.');
});

// ── API Tracker ─────────────────────────────────────────────────────────────────
exports.getApiTracker = catchAsync(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const total = await ApiLog.countDocuments();
  const logs = await ApiLog.find().populate('user', 'name email').sort('-createdAt').skip((page - 1) * limit).limit(Number(limit));

  const [endpointStats, topUsers, errorRate] = await Promise.all([
    ApiLog.aggregate([{ $group: { _id: { endpoint: '$endpoint', method: '$method' }, count: { $sum: 1 }, avgResponseTime: { $avg: '$responseTime' } } }, { $sort: { count: -1 } }, { $limit: 20 }]),
    ApiLog.aggregate([{ $match: { user: { $ne: null } } }, { $group: { _id: '$user', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 10 }]),
    ApiLog.aggregate([{ $group: { _id: null, total: { $sum: 1 }, errors: { $sum: { $cond: [{ $gte: ['$statusCode', 400] }, 1, 0] } } } }]),
  ]);

  sendResponse(res, 200, { logs, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) }, endpointStats, topUsers, errorRate: errorRate[0] });
});

// ── Email Logs ──────────────────────────────────────────────────────────────────
exports.getEmailLogs = catchAsync(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const total = await EmailLog.countDocuments();
  const emails = await EmailLog.find().populate('user', 'name email').sort('-createdAt').skip((page - 1) * limit).limit(Number(limit));
  sendResponse(res, 200, { emails, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } });
});
