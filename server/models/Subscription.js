const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    plan: { type: String, enum: ['free', 'pro', 'business'], required: true },
    interval: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
    status: {
      type: String,
      enum: ['active', 'inactive', 'cancelled', 'past_due', 'trialing', 'unpaid'],
      default: 'active',
    },

    // Stripe
    stripeSubscriptionId: { type: String, index: true, sparse: true },
    stripeCustomerId: String,
    stripePriceId: String,
    stripeProductId: String,

    // Billing period
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    cancelAtPeriodEnd: { type: Boolean, default: false },
    cancelledAt: Date,
    trialStart: Date,
    trialEnd: Date,

    // Price
    amount: Number,
    currency: { type: String, default: 'USD' },

    // Usage
    invoicesUsedThisMonth: { type: Number, default: 0 },
    usageResetAt: Date,

    // History
    invoices: [
      {
        stripeInvoiceId: String,
        amount: Number,
        status: String,
        paidAt: Date,
        hostedInvoiceUrl: String,
        invoicePdf: String,
      },
    ],
  },
  { timestamps: true }
);

subscriptionSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('Subscription', subscriptionSchema);
