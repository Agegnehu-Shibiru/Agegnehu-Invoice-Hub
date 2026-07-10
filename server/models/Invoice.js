const mongoose = require('mongoose');

const lineItemSchema = new mongoose.Schema({
  description: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, min: 0 },
  rate: { type: Number, required: true, min: 0 },
  amount: { type: Number, required: true },
}, { _id: true });

const invoiceSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true, index: true },

    invoiceNumber: { type: String, required: true },
    status: {
      type: String,
      enum: ['draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled'],
      default: 'draft',
      index: true,
    },

    lineItems: [lineItemSchema],
    subtotal: { type: Number, required: true, default: 0 },
    taxRate: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    discountType: { type: String, enum: ['fixed', 'percentage'], default: 'fixed' },
    discountValue: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    total: { type: Number, required: true, default: 0 },

    currency: { type: String, default: 'USD', uppercase: true },
    issueDate: { type: Date, default: Date.now },
    dueDate: { type: Date, required: true },
    paidAt: Date,
    paidAmount: { type: Number, default: 0 },

    notes: { type: String, maxlength: 1000 },
    paymentTerms: { type: String, default: 'Net 30' },
    logo: String,
    brandColor: { type: String, default: '#4F46E5' },

    // Payment
    shareToken: { type: String, unique: true, sparse: true },
    stripePaymentIntentId: String,
    paypalOrderId: String,
    paymentMethod: { type: String, enum: ['stripe', 'paypal', 'manual', null], default: null },

    // Tracking
    viewCount: { type: Number, default: 0 },
    lastViewedAt: Date,
    sentAt: Date,
    reminderSentAt: Date,

    // Soft delete
    isDeleted: { type: Boolean, default: false, select: false },
    deletedAt: { type: Date, select: false },
  },
  { timestamps: true }
);

invoiceSchema.index({ user: 1, status: 1 });
invoiceSchema.index({ user: 1, createdAt: -1 });
invoiceSchema.index({ invoiceNumber: 1, user: 1 }, { unique: true });
invoiceSchema.index({ dueDate: 1, status: 1 });

invoiceSchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: { $ne: true } });
  }
  next();
});

// Auto-mark overdue
invoiceSchema.methods.checkOverdue = function () {
  if (this.status === 'sent' && new Date() > this.dueDate) {
    this.status = 'overdue';
  }
};

module.exports = mongoose.model('Invoice', invoiceSchema);
