const mongoose = require('mongoose');

// ── API Usage Log ──────────────────────────────────────────────────────────────
const apiLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    ip: { type: String, index: true },
    method: { type: String, enum: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'] },
    endpoint: { type: String, index: true },
    statusCode: { type: Number, index: true },
    responseTime: Number, // ms
    userAgent: String,
    rateLimitHit: { type: Boolean, default: false },
    errorMessage: String,
  },
  { timestamps: true, capped: { size: 100 * 1024 * 1024, max: 500000 } } // 100MB cap
);

apiLogSchema.index({ user: 1, createdAt: -1 });
apiLogSchema.index({ endpoint: 1, createdAt: -1 });
apiLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 }); // 90 day TTL

// ── Audit Log (Admin Actions) ─────────────────────────────────────────────────
const auditLogSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    actorName: String,
    actorRole: String,
    action: { type: String, required: true, index: true },
    resource: { type: String, required: true },
    resourceId: { type: mongoose.Schema.Types.ObjectId },
    changes: { type: Map, of: mongoose.Schema.Types.Mixed },
    ip: String,
    userAgent: String,
    result: { type: String, enum: ['success', 'failure'], default: 'success' },
  },
  { timestamps: true }
);

auditLogSchema.index({ actor: 1, createdAt: -1 });
auditLogSchema.index({ resource: 1, resourceId: 1 });

// ── Email Log ─────────────────────────────────────────────────────────────────
const emailLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    to: { type: String, required: true },
    from: String,
    subject: { type: String, required: true },
    template: { type: String, required: true },
    status: { type: String, enum: ['sent', 'failed', 'bounced'], default: 'sent' },
    resendId: String,
    error: String,
    metadata: { type: Map, of: String },
  },
  { timestamps: true }
);

emailLogSchema.index({ user: 1, createdAt: -1 });
emailLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

module.exports = {
  ApiLog: mongoose.model('ApiLog', apiLogSchema),
  AuditLog: mongoose.model('AuditLog', auditLogSchema),
  EmailLog: mongoose.model('EmailLog', emailLogSchema),
};
