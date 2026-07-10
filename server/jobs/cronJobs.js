const cron = require('node-cron');
const User = require('../models/User');
const Invoice = require('../models/Invoice');
const emailService = require('../services/emailService');
const logger = require('../utils/logger');

// ── Mark overdue invoices daily at 1am ─────────────────────────────────────────
cron.schedule('0 1 * * *', async () => {
  logger.info('[CRON] Checking for overdue invoices...');
  try {
    const result = await Invoice.updateMany(
      { status: { $in: ['sent', 'viewed'] }, dueDate: { $lt: new Date() } },
      { $set: { status: 'overdue' } }
    );
    logger.info(`[CRON] Marked ${result.modifiedCount} invoices as overdue.`);
  } catch (err) {
    logger.error('[CRON] Overdue check error:', err);
  }
});

// ── Send overdue reminders daily at 9am ────────────────────────────────────────
cron.schedule('0 9 * * *', async () => {
  logger.info('[CRON] Sending overdue reminders...');
  try {
    const overdueInvoices = await Invoice.find({ status: 'overdue', reminderSentAt: { $not: { $gte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) } } })
      .populate('client', 'name email')
      .populate('user', 'name email');

    for (const inv of overdueInvoices) {
      if (!inv.client?.email) continue;
      const daysOverdue = Math.floor((Date.now() - new Date(inv.dueDate)) / (1000 * 60 * 60 * 24));
      await emailService.sendInvoiceOverdue(inv.client.email, {
        clientName: inv.client.name,
        senderName: inv.user.name,
        invoiceNumber: inv.invoiceNumber,
        amount: inv.total.toFixed(2),
        currency: inv.currency,
        daysOverdue,
        payUrl: `${process.env.CLIENT_URL}/pay/${inv.shareToken}`,
      }, inv.user._id).catch(() => {});
      inv.reminderSentAt = new Date();
      await inv.save({ validateBeforeSave: false });
    }
    logger.info(`[CRON] Sent ${overdueInvoices.length} overdue reminders.`);
  } catch (err) {
    logger.error('[CRON] Overdue reminder error:', err);
  }
});

// ── Trial ending reminder (3 days before) — daily at 10am ─────────────────────
cron.schedule('0 10 * * *', async () => {
  logger.info('[CRON] Checking trial endings...');
  try {
    const in3Days = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const users = await User.find({ 'subscription.status': 'trialing', 'subscription.trialEnd': { $gte: tomorrow, $lte: in3Days } });
    for (const user of users) {
      const daysLeft = Math.ceil((new Date(user.subscription.trialEnd) - Date.now()) / (1000 * 60 * 60 * 24));
      await emailService.sendTrialEnding(user.email, {
        name: user.name,
        daysLeft,
        upgradeUrl: `${process.env.CLIENT_URL}/pricing`,
      }, user._id).catch(() => {});
    }
    logger.info(`[CRON] Sent ${users.length} trial ending reminders.`);
  } catch (err) {
    logger.error('[CRON] Trial ending check error:', err);
  }
});

// ── Monthly digest — 1st of month at 8am ──────────────────────────────────────
cron.schedule('0 8 1 * *', async () => {
  logger.info('[CRON] Sending monthly digest emails...');
  try {
    const startOfLastMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
    const endOfLastMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 0);
    const monthName = startOfLastMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const users = await User.find({ isEmailVerified: true, 'settings.notifications.weeklyDigest': true });

    for (const user of users) {
      try {
        const [invoicesSent, invoicesPaid, outstandingData, paidRevenue] = await Promise.all([
          Invoice.countDocuments({ user: user._id, createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),
          Invoice.countDocuments({ user: user._id, status: 'paid', paidAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),
          Invoice.aggregate([{ $match: { user: user._id, status: { $in: ['sent', 'viewed', 'overdue'] } } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
          Invoice.aggregate([{ $match: { user: user._id, status: 'paid', paidAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
        ]);

        await emailService.sendMonthlyDigest(user.email, {
          name: user.name,
          month: monthName,
          stats: {
            invoicesSent,
            invoicesPaid,
            outstanding: `${user.settings?.currency || 'USD'} ${(outstandingData[0]?.total || 0).toFixed(2)}`,
            totalRevenue: `${user.settings?.currency || 'USD'} ${(paidRevenue[0]?.total || 0).toFixed(2)}`,
          },
          dashboardUrl: `${process.env.CLIENT_URL}/dashboard`,
        }, user._id);
      } catch (err) {
        logger.error(`[CRON] Digest email error for user ${user._id}:`, err);
      }
    }
    logger.info(`[CRON] Monthly digest sent to ${users.length} users.`);
  } catch (err) {
    logger.error('[CRON] Monthly digest error:', err);
  }
});

// ── Reset monthly invoice usage counter — 1st of month ────────────────────────
cron.schedule('0 0 1 * *', async () => {
  try {
    const { modifiedCount } = await require('../models/Subscription').updateMany({}, { $set: { invoicesUsedThisMonth: 0, usageResetAt: new Date() } });
    logger.info(`[CRON] Reset invoice usage for ${modifiedCount} subscriptions.`);
  } catch (err) {
    logger.error('[CRON] Usage reset error:', err);
  }
});

logger.info('Cron jobs initialized.');
