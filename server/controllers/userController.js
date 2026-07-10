const User = require('../models/User');
const Client = require('../models/Client');
const Invoice = require('../models/Invoice');
const cloudinary = require('cloudinary').v2;
const { AppError, catchAsync, sendResponse } = require('../utils/appError');

// ── User Controllers ────────────────────────────────────────────────────────────
exports.getMe = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id);
  sendResponse(res, 200, { user });
});

exports.updateMe = catchAsync(async (req, res) => {
  const allowed = ['name', 'phone', 'settings'];
  const updates = {};
  allowed.forEach((field) => { if (req.body[field] !== undefined) updates[field] = req.body[field]; });
  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
  sendResponse(res, 200, { user }, 'Profile updated.');
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');
  if (!await user.comparePassword(currentPassword)) return next(new AppError('Current password is incorrect.', 400));
  user.password = newPassword;
  await user.save();
  sendResponse(res, 200, null, 'Password updated successfully.');
});

exports.deleteMe = catchAsync(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { isDeleted: true, deletedAt: new Date() });
  sendResponse(res, 200, null, 'Account deleted. You have 30 days to recover it.');
});

exports.uploadAvatar = catchAsync(async (req, res, next) => {
  if (!req.file) return next(new AppError('Please upload an image.', 400));
  const b64 = Buffer.from(req.file.buffer).toString('base64');
  const dataURI = `data:${req.file.mimetype};base64,${b64}`;
  const result = await cloudinary.uploader.upload(dataURI, { folder: 'invoicehub/avatars', transformation: [{ width: 200, height: 200, crop: 'fill', gravity: 'face' }] });
  const user = await User.findByIdAndUpdate(req.user._id, { avatar: result.secure_url }, { new: true });
  sendResponse(res, 200, { avatar: result.secure_url, user }, 'Avatar uploaded.');
});

// ── Client Controllers ──────────────────────────────────────────────────────────
exports.getClients = catchAsync(async (req, res) => {
  const { page = 1, limit = 20, search } = req.query;
  const query = { user: req.user._id };
  if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }, { company: { $regex: search, $options: 'i' } }];
  const total = await Client.countDocuments(query);
  const clients = await Client.find(query).sort('name').skip((page - 1) * limit).limit(Number(limit));
  sendResponse(res, 200, { clients, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } });
});

exports.createClient = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  if (user.subscription?.plan === 'free') {
    const count = await Client.countDocuments({ user: req.user._id });
    if (count >= 2) return next(new AppError('Free plan limit: 2 clients. Upgrade to Pro for unlimited clients.', 403));
  }
  const client = await Client.create({ ...req.body, user: req.user._id });
  sendResponse(res, 201, { client }, 'Client created.');
});

exports.getClient = catchAsync(async (req, res, next) => {
  const client = await Client.findOne({ _id: req.params.id, user: req.user._id });
  if (!client) return next(new AppError('Client not found.', 404));
  const invoices = await Invoice.find({ client: client._id, user: req.user._id }).sort('-createdAt').limit(10);
  sendResponse(res, 200, { client, invoices });
});

exports.updateClient = catchAsync(async (req, res, next) => {
  const client = await Client.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, req.body, { new: true, runValidators: true });
  if (!client) return next(new AppError('Client not found.', 404));
  sendResponse(res, 200, { client }, 'Client updated.');
});

exports.deleteClient = catchAsync(async (req, res, next) => {
  const client = await Client.findOne({ _id: req.params.id, user: req.user._id });
  if (!client) return next(new AppError('Client not found.', 404));
  client.isDeleted = true;
  client.deletedAt = new Date();
  await client.save({ validateBeforeSave: false });
  sendResponse(res, 200, null, 'Client deleted.');
});
