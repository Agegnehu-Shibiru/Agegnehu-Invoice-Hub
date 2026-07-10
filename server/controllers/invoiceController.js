const { v4: uuidv4 } = require('uuid');
const Invoice = require('../models/Invoice');
const Client = require('../models/Client');
const User = require('../models/User');
const { AppError, catchAsync, sendResponse } = require('../utils/appError');
const emailService = require('../services/emailService');

const PLAN_LIMITS = { free: 5, pro: Infinity, business: Infinity };

// ── List Invoices ───────────────────────────────────────────────────────────────
exports.getInvoices = catchAsync(async (req, res) => {
  const { status, client, startDate, endDate, page = 1, limit = 20, search } = req.query;
  const query = { user: req.user._id };
  if (status) query.status = status;
  if (client) query.client = client;
  if (startDate || endDate) query.createdAt = {};
  if (startDate) query.createdAt.$gte = new Date(startDate);
  if (endDate) query.createdAt.$lte = new Date(endDate);

  let invoicesQuery = Invoice.find(query).populate('client', 'name email company');

  if (search) {
    invoicesQuery = Invoice.find({ ...query, $or: [{ invoiceNumber: { $regex: search, $options: 'i' } }] }).populate('client', 'name email company');
  }

  const total = await Invoice.countDocuments(query);
  const invoices = await invoicesQuery.sort('-createdAt').skip((page - 1) * limit).limit(Number(limit));

  sendResponse(res, 200, { invoices, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } });
});

// ── Create Invoice ──────────────────────────────────────────────────────────────
exports.createInvoice = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  const plan = user.subscription?.plan || 'free';

  // Check plan limits
  if (plan === 'free') {
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const monthCount = await Invoice.countDocuments({ user: req.user._id, createdAt: { $gte: startOfMonth } });
    if (monthCount >= PLAN_LIMITS.free) return next(new AppError('Free plan limit: 5 invoices per month. Upgrade to Pro for unlimited invoices.', 403));
  }

  // Build invoice number
  const nextNum = user.settings.nextInvoiceNumber;
  const invoiceNumber = `${user.settings.invoicePrefix}-${String(nextNum).padStart(4, '0')}`;
  user.settings.nextInvoiceNumber = nextNum + 1;
  await user.save({ validateBeforeSave: false });

  // Calculate totals
  const { lineItems, taxRate = 0, discountType = 'fixed', discountValue = 0, currency = 'USD' } = req.body;
  const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.rate, 0);
  const lineItemsCalc = lineItems.map((item) => ({ ...item, amount: item.quantity * item.rate }));
  const discountAmount = discountType === 'percentage' ? (subtotal * discountValue) / 100 : discountValue;
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = (taxableAmount * taxRate) / 100;
  const total = taxableAmount + taxAmount;

  const invoice = await Invoice.create({
    ...req.body,
    user: req.user._id,
    invoiceNumber,
    lineItems: lineItemsCalc,
    subtotal,
    taxAmount,
    discountAmount,
    total,
    currency,
    shareToken: uuidv4(),
  });

  // Update client stats
  await Client.findByIdAndUpdate(req.body.client, { $inc: { 'stats.totalInvoices': 1 }, $set: { 'stats.lastInvoiceDate': new Date() } });

  sendResponse(res, 201, { invoice }, 'Invoice created successfully.');
});

// ── Get Invoice ─────────────────────────────────────────────────────────────────
exports.getInvoice = catchAsync(async (req, res, next) => {
  const invoice = await Invoice.findOne({ _id: req.params.id, user: req.user._id }).populate('client');
  if (!invoice) return next(new AppError('Invoice not found.', 404));
  sendResponse(res, 200, { invoice });
});

// ── Update Invoice ──────────────────────────────────────────────────────────────
exports.updateInvoice = catchAsync(async (req, res, next) => {
  let invoice = await Invoice.findOne({ _id: req.params.id, user: req.user._id });
  if (!invoice) return next(new AppError('Invoice not found.', 404));
  if (invoice.status === 'paid') return next(new AppError('Cannot edit a paid invoice.', 400));

  // Recalculate if line items changed
  if (req.body.lineItems) {
    const { lineItems, taxRate = invoice.taxRate, discountType = invoice.discountType, discountValue = invoice.discountValue } = req.body;
    const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.rate, 0);
    req.body.lineItems = lineItems.map((item) => ({ ...item, amount: item.quantity * item.rate }));
    req.body.subtotal = subtotal;
    req.body.discountAmount = discountType === 'percentage' ? (subtotal * discountValue) / 100 : discountValue;
    req.body.taxAmount = ((subtotal - req.body.discountAmount) * taxRate) / 100;
    req.body.total = subtotal - req.body.discountAmount + req.body.taxAmount;
  }

  invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate('client');
  sendResponse(res, 200, { invoice }, 'Invoice updated.');
});

// ── Delete Invoice ──────────────────────────────────────────────────────────────
exports.deleteInvoice = catchAsync(async (req, res, next) => {
  const invoice = await Invoice.findOne({ _id: req.params.id, user: req.user._id });
  if (!invoice) return next(new AppError('Invoice not found.', 404));
  invoice.isDeleted = true;
  invoice.deletedAt = new Date();
  await invoice.save({ validateBeforeSave: false });
  sendResponse(res, 200, null, 'Invoice deleted.');
});

// ── Send Invoice ────────────────────────────────────────────────────────────────
exports.sendInvoice = catchAsync(async (req, res, next) => {
  const invoice = await Invoice.findOne({ _id: req.params.id, user: req.user._id }).populate('client');
  if (!invoice) return next(new AppError('Invoice not found.', 404));
  if (!invoice.client?.email) return next(new AppError('Client does not have an email address.', 400));

  const payUrl = `${process.env.CLIENT_URL}/pay/${invoice.shareToken}`;
  await emailService.sendInvoice(invoice.client.email, {
    clientName: invoice.client.name,
    senderName: req.user.name,
    invoiceNumber: invoice.invoiceNumber,
    amount: invoice.total.toFixed(2),
    currency: invoice.currency,
    dueDate: invoice.dueDate.toLocaleDateString(),
    payUrl,
    lineItems: invoice.lineItems,
  }, req.user._id);

  invoice.status = 'sent';
  invoice.sentAt = new Date();
  await invoice.save({ validateBeforeSave: false });

  sendResponse(res, 200, { invoice }, 'Invoice sent to client.');
});

// ── Mark as Paid ────────────────────────────────────────────────────────────────
exports.markPaid = catchAsync(async (req, res, next) => {
  const invoice = await Invoice.findOne({ _id: req.params.id, user: req.user._id }).populate('client');
  if (!invoice) return next(new AppError('Invoice not found.', 404));

  invoice.status = 'paid';
  invoice.paidAt = new Date();
  invoice.paidAmount = invoice.total;
  invoice.paymentMethod = req.body.paymentMethod || 'manual';
  await invoice.save({ validateBeforeSave: false });

  // Update client stats
  await Client.findByIdAndUpdate(invoice.client._id, { $inc: { 'stats.totalPaid': invoice.total, 'stats.totalOutstanding': -invoice.total } });

  sendResponse(res, 200, { invoice }, 'Invoice marked as paid.');
});

// ── Public Invoice View ─────────────────────────────────────────────────────────
exports.getPublicInvoice = catchAsync(async (req, res, next) => {
  const invoice = await Invoice.findOne({ shareToken: req.params.shareToken }).populate('client', 'name email company').populate('user', 'name email settings');
  if (!invoice) return next(new AppError('Invoice not found.', 404));

  invoice.viewCount += 1;
  invoice.lastViewedAt = new Date();
  if (invoice.status === 'sent') invoice.status = 'viewed';
  await invoice.save({ validateBeforeSave: false });

  sendResponse(res, 200, { invoice });
});

// ── Stats ────────────────────────────────────────────────────────────────────────
exports.getStats = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const [total, paid, outstanding, overdue, revenueData] = await Promise.all([
    Invoice.countDocuments({ user: userId }),
    Invoice.countDocuments({ user: userId, status: 'paid' }),
    Invoice.aggregate([{ $match: { user: userId, status: { $in: ['sent', 'viewed', 'overdue'] } } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
    Invoice.countDocuments({ user: userId, status: 'overdue' }),
    Invoice.aggregate([
      { $match: { user: userId, status: 'paid', paidAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) } } },
      { $group: { _id: { year: { $year: '$paidAt' }, month: { $month: '$paidAt' } }, revenue: { $sum: '$total' } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
  ]);

  sendResponse(res, 200, { stats: { total, paid, outstanding: outstanding[0]?.total || 0, overdue, revenueData } });
});
