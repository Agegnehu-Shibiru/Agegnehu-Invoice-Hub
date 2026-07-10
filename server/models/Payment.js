const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', index: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },

    amount: { type: Number, required: true },
    currency: { type: String, default: 'USD', uppercase: true },
    status: {
      type: String,
      enum: ['pending', 'succeeded', 'failed', 'refunded', 'partially_refunded'],
      default: 'pending',
      index: true,
    },

    provider: { type: String, enum: ['stripe', 'paypal', 'manual'], required: true },
    providerPaymentId: { type: String, index: true },
    providerCustomerId: String,

    // Stripe specific
    stripePaymentIntentId: String,
    stripeChargeId: String,
    stripeReceiptUrl: String,

    // PayPal specific
    paypalOrderId: String,
    paypalCaptureId: String,

    // Refund
    refundAmount: { type: Number, default: 0 },
    refundedAt: Date,
    refundReason: String,

    metadata: { type: Map, of: String },
    description: String,
    receiptSentAt: Date,
  },
  { timestamps: true }
);

paymentSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
