const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: [true, 'Client name is required'], trim: true, maxlength: 200 },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    company: { type: String, trim: true },
    website: { type: String, trim: true },
    taxId: { type: String, trim: true },

    address: {
      street: String,
      city: String,
      state: String,
      zip: String,
      country: { type: String, default: 'US' },
    },

    notes: { type: String, maxlength: 1000 },
    currency: { type: String, default: 'USD' },

    // Aggregated stats (updated via hooks)
    stats: {
      totalInvoices: { type: Number, default: 0 },
      totalPaid: { type: Number, default: 0 },
      totalOutstanding: { type: Number, default: 0 },
      lastInvoiceDate: Date,
    },

    isDeleted: { type: Boolean, default: false, select: false },
    deletedAt: { type: Date, select: false },
  },
  { timestamps: true }
);

clientSchema.index({ user: 1, name: 1 });
clientSchema.index({ user: 1, email: 1 });

clientSchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: { $ne: true } });
  }
  next();
});

module.exports = mongoose.model('Client', clientSchema);
