const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const Subscription = require('../models/Subscription');
const User = require('../models/User');
const { AppError, catchAsync, sendResponse } = require('../utils/appError');
const emailService = require('../services/emailService');
const logger = require('../utils/logger');

// ── Stripe Checkout (Invoice Payment) ──────────────────────────────────────────
exports.stripeCheckout = catchAsync(async (req, res, next) => {
  const { shareToken } = req.body;
  const invoice = await Invoice.findOne({ shareToken }).populate('client').populate('user', 'name email settings');
  if (!invoice) return next(new AppError('Invoice not found.', 404));
  if (invoice.status === 'paid') return next(new AppError('Invoice already paid.', 400));

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    customer_email: invoice.client.email,
    line_items: invoice.lineItems.map((item) => ({
      price_data: { currency: invoice.currency.toLowerCase(), product_data: { name: item.description }, unit_amount: Math.round(item.rate * 100) },
      quantity: item.quantity,
    })),
    metadata: { invoiceId: invoice._id.toString(), shareToken, userId: invoice.user._id.toString() },
    success_url: `${process.env.CLIENT_URL}/pay/${shareToken}?success=1`,
    cancel_url: `${process.env.CLIENT_URL}/pay/${shareToken}?cancelled=1`,
  });

  sendResponse(res, 200, { url: session.url });
});

// ── Stripe Subscription Checkout ────────────────────────────────────────────────
exports.stripeSubscriptionCheckout = catchAsync(async (req, res, next) => {
  const { plan, interval } = req.body;
  const user = req.user;

  const priceMap = {
    pro: { monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID, yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID },
    business: { monthly: process.env.STRIPE_BUSINESS_MONTHLY_PRICE_ID, yearly: process.env.STRIPE_BUSINESS_YEARLY_PRICE_ID },
  };

  const priceId = priceMap[plan]?.[interval];
  if (!priceId) return next(new AppError('Invalid plan or interval.', 400));

  // Get or create Stripe customer
  let customerId = user.subscription?.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({ email: user.email, name: user.name, metadata: { userId: user._id.toString() } });
    customerId = customer.id;
    user.subscription.stripeCustomerId = customerId;
    await user.save({ validateBeforeSave: false });
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { userId: user._id.toString(), plan, interval },
    success_url: `${process.env.CLIENT_URL}/dashboard/subscription?success=1`,
    cancel_url: `${process.env.CLIENT_URL}/pricing?cancelled=1`,
    allow_promotion_codes: true,
  });

  sendResponse(res, 200, { url: session.url });
});

// ── Stripe Webhook ──────────────────────────────────────────────────────────────
exports.stripeWebhook = catchAsync(async (req, res, next) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    logger.error('Stripe webhook signature error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      if (session.mode === 'payment') await handleInvoicePayment(session);
      if (session.mode === 'subscription') await handleSubscriptionCreated(session);
      break;
    }
    case 'invoice.payment_succeeded': await handleSubscriptionRenewal(event.data.object); break;
    case 'invoice.payment_failed': await handlePaymentFailed(event.data.object); break;
    case 'customer.subscription.updated': await handleSubscriptionUpdated(event.data.object); break;
    case 'customer.subscription.deleted': await handleSubscriptionDeleted(event.data.object); break;
    default: logger.info(`Unhandled Stripe event: ${event.type}`);
  }

  res.json({ received: true });
});

async function handleInvoicePayment(session) {
  const invoice = await Invoice.findById(session.metadata.invoiceId).populate('client').populate('user');
  if (!invoice || invoice.status === 'paid') return;

  invoice.status = 'paid';
  invoice.paidAt = new Date();
  invoice.paidAmount = session.amount_total / 100;
  invoice.paymentMethod = 'stripe';
  invoice.stripePaymentIntentId = session.payment_intent;
  await invoice.save({ validateBeforeSave: false });

  const payment = await Payment.create({
    user: invoice.user._id,
    invoice: invoice._id,
    client: invoice.client._id,
    amount: invoice.paidAmount,
    currency: invoice.currency,
    status: 'succeeded',
    provider: 'stripe',
    stripePaymentIntentId: session.payment_intent,
    description: `Payment for invoice ${invoice.invoiceNumber}`,
  });

  await emailService.sendPaymentReceived(invoice.user.email, {
    name: invoice.user.name,
    invoiceNumber: invoice.invoiceNumber,
    amount: invoice.paidAmount.toFixed(2),
    currency: invoice.currency,
    transactionId: payment._id.toString(),
    paidAt: new Date().toLocaleDateString(),
    receiptUrl: `${process.env.CLIENT_URL}/dashboard/payments/${payment._id}`,
  }, invoice.user._id);
}

async function handleSubscriptionCreated(session) {
  const { userId, plan, interval } = session.metadata;
  const user = await User.findById(userId);
  if (!user) return;

  const stripeSubscription = await stripe.subscriptions.retrieve(session.subscription);
  const planFeatures = {
    pro: ['Unlimited invoices', 'Unlimited clients', 'Custom branding', 'PDF export', 'Payment links', 'Email reminders'],
    business: ['Everything in Pro', 'Team members (5)', 'API access', 'Priority support', 'Advanced analytics', 'White-label'],
  };

  user.subscription.plan = plan;
  user.subscription.status = 'active';
  user.subscription.stripeSubscriptionId = stripeSubscription.id;
  user.subscription.currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);
  await user.save({ validateBeforeSave: false });

  await Subscription.findOneAndUpdate({ user: userId }, { user: userId, plan, interval, status: 'active', stripeSubscriptionId: stripeSubscription.id, stripeCustomerId: session.customer, currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000), currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000) }, { upsert: true, new: true });

  await emailService.sendSubscriptionActivated(user.email, {
    name: user.name,
    plan: plan.charAt(0).toUpperCase() + plan.slice(1),
    amount: `$${(stripeSubscription.items.data[0].price.unit_amount / 100).toFixed(2)}/${interval === 'monthly' ? 'mo' : 'yr'}`,
    interval,
    nextBillingDate: new Date(stripeSubscription.current_period_end * 1000).toLocaleDateString(),
    features: planFeatures[plan] || [],
  }, user._id);
}

async function handleSubscriptionRenewal(stripeInvoice) {
  const subscription = await Subscription.findOne({ stripeSubscriptionId: stripeInvoice.subscription });
  if (!subscription) return;
  subscription.invoices.push({ stripeInvoiceId: stripeInvoice.id, amount: stripeInvoice.amount_paid / 100, status: 'paid', paidAt: new Date(), hostedInvoiceUrl: stripeInvoice.hosted_invoice_url, invoicePdf: stripeInvoice.invoice_pdf });
  await subscription.save();
}

async function handlePaymentFailed(stripeInvoice) {
  const user = await User.findOne({ 'subscription.stripeSubscriptionId': stripeInvoice.subscription });
  if (!user) return;
  user.subscription.status = 'past_due';
  await user.save({ validateBeforeSave: false });
}

async function handleSubscriptionUpdated(stripeSubscription) {
  const user = await User.findOne({ 'subscription.stripeSubscriptionId': stripeSubscription.id });
  if (!user) return;
  user.subscription.status = stripeSubscription.status;
  user.subscription.cancelAtPeriodEnd = stripeSubscription.cancel_at_period_end;
  user.subscription.currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);
  await user.save({ validateBeforeSave: false });
}

async function handleSubscriptionDeleted(stripeSubscription) {
  const user = await User.findOne({ 'subscription.stripeSubscriptionId': stripeSubscription.id });
  if (!user) return;
  user.subscription.plan = 'free';
  user.subscription.status = 'cancelled';
  await user.save({ validateBeforeSave: false });
  await emailService.sendSubscriptionCancelled(user.email, {
    name: user.name,
    plan: 'Pro/Business',
    accessUntil: new Date(stripeSubscription.current_period_end * 1000).toLocaleDateString(),
    reactivateUrl: `${process.env.CLIENT_URL}/pricing`,
  }, user._id);
}

// ── PayPal ──────────────────────────────────────────────────────────────────────
exports.paypalCreateOrder = catchAsync(async (req, res, next) => {
  const { shareToken } = req.body;
  const invoice = await Invoice.findOne({ shareToken });
  if (!invoice) return next(new AppError('Invoice not found.', 404));

  const accessToken = await getPayPalAccessToken();
  const response = await fetch(`${getPayPalBaseUrl()}/v2/checkout/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{ amount: { currency_code: invoice.currency, value: invoice.total.toFixed(2) }, description: `Invoice ${invoice.invoiceNumber}` }],
    }),
  });
  const order = await response.json();
  sendResponse(res, 200, { orderId: order.id });
});

exports.paypalCaptureOrder = catchAsync(async (req, res, next) => {
  const { orderId, shareToken } = req.body;
  const accessToken = await getPayPalAccessToken();
  const response = await fetch(`${getPayPalBaseUrl()}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
  });
  const capture = await response.json();

  if (capture.status === 'COMPLETED') {
    const invoice = await Invoice.findOne({ shareToken }).populate('user');
    if (invoice && invoice.status !== 'paid') {
      invoice.status = 'paid';
      invoice.paidAt = new Date();
      invoice.paymentMethod = 'paypal';
      invoice.paypalOrderId = orderId;
      await invoice.save({ validateBeforeSave: false });

      await Payment.create({ user: invoice.user._id, invoice: invoice._id, amount: invoice.total, currency: invoice.currency, status: 'succeeded', provider: 'paypal', paypalOrderId: orderId, description: `PayPal payment for ${invoice.invoiceNumber}` });
    }
  }
  sendResponse(res, 200, { capture });
});

async function getPayPalAccessToken() {
  const response = await fetch(`${getPayPalBaseUrl()}/v1/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: `Basic ${Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64')}` },
    body: 'grant_type=client_credentials',
  });
  const data = await response.json();
  return data.access_token;
}

function getPayPalBaseUrl() {
  return process.env.PAYPAL_MODE === 'live' ? 'https://api.paypal.com' : 'https://api.sandbox.paypal.com';
}

// ── Payment History ─────────────────────────────────────────────────────────────
exports.getPaymentHistory = catchAsync(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const total = await Payment.countDocuments({ user: req.user._id });
  const payments = await Payment.find({ user: req.user._id }).populate('invoice', 'invoiceNumber').populate('client', 'name').sort('-createdAt').skip((page - 1) * limit).limit(Number(limit));
  sendResponse(res, 200, { payments, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } });
});
