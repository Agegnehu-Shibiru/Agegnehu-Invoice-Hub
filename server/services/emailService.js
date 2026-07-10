const { Resend } = require('resend');
const templates = require('../templates/emails');
const { EmailLog } = require('../models/Logs');
const logger = require('../utils/logger');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = `${process.env.EMAIL_FROM_NAME || 'InvoiceHub Pro'} <${process.env.EMAIL_FROM || 'noreply@invoicehubpro.com'}>`;

const send = async ({ to, subject, html, template, userId, metadata }) => {
  try {
    const { data, error } = await resend.emails.send({ from: FROM, to, subject, html });
    await EmailLog.create({ user: userId, to, from: FROM, subject, template, status: error ? 'failed' : 'sent', resendId: data?.id, error: error?.message, metadata });
    if (error) throw new Error(error.message);
    logger.info(`Email sent [${template}] → ${to}`);
    return data;
  } catch (err) {
    logger.error(`Email error [${template}] → ${to}:`, err);
    throw err;
  }
};

exports.sendWelcome = (to, { name, loginUrl }, userId) =>
  send({ to, subject: '👋 Welcome to InvoiceHub Pro!', html: templates.welcome({ name, loginUrl }), template: 'welcome', userId });

exports.sendVerifyEmail = (to, { name, verifyUrl }, userId) =>
  send({ to, subject: 'Confirm your email — InvoiceHub Pro', html: templates.verifyEmail({ name, verifyUrl }), template: 'verify_email', userId });

exports.sendPasswordReset = (to, { name, resetUrl }, userId) =>
  send({ to, subject: 'Reset your InvoiceHub Pro password', html: templates.passwordReset({ name, resetUrl }), template: 'password_reset', userId });

exports.sendInvoice = (to, data, userId) =>
  send({ to, subject: `Invoice ${data.invoiceNumber} from ${data.senderName} — ${data.currency} ${data.amount}`, html: templates.invoiceSent(data), template: 'invoice_sent', userId });

exports.sendPaymentReceived = (to, data, userId) =>
  send({ to, subject: `✅ Payment received — ${data.currency} ${data.amount}`, html: templates.paymentReceived(data), template: 'payment_received', userId });

exports.sendSubscriptionActivated = (to, data, userId) =>
  send({ to, subject: `🚀 Your ${data.plan} plan is now active!`, html: templates.subscriptionActivated(data), template: 'subscription_activated', userId });

exports.sendSubscriptionCancelled = (to, data, userId) =>
  send({ to, subject: 'Your subscription has been cancelled', html: templates.subscriptionCancelled(data), template: 'subscription_cancelled', userId });

exports.sendTrialEnding = (to, data, userId) =>
  send({ to, subject: `⏳ Your trial ends in ${data.daysLeft} days`, html: templates.trialEnding(data), template: 'trial_ending', userId });

exports.sendInvoiceOverdue = (to, data, userId) =>
  send({ to, subject: `⚠️ Overdue Invoice ${data.invoiceNumber} — Action Required`, html: templates.invoiceOverdue(data), template: 'invoice_overdue', userId });

exports.sendMonthlyDigest = (to, data, userId) =>
  send({ to, subject: `📊 Your ${data.month} InvoiceHub Summary`, html: templates.monthlyDigest(data), template: 'monthly_digest', userId });
