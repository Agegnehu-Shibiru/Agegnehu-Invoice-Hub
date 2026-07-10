const base = require('./base');

// ── 1. Welcome ─────────────────────────────────────────────────────────────────
exports.welcome = ({ name, loginUrl }) =>
  base({
    preheader: `Welcome to InvoiceHub Pro, ${name}! Let's get you set up.`,
    content: `
    <div class="card">
      <p style="font-size:40px; margin-bottom:12px;">👋</p>
      <h1 class="title">Welcome to InvoiceHub Pro, ${name}!</h1>
      <p class="subtitle">Your invoicing command center is ready. Here's how to get started in minutes:</p>
      <div class="step">
        <div class="step-num">1</div>
        <div><strong>Add your first client</strong><br/><span style="font-size:13px;color:#64748b">Go to Clients → Add Client and fill in their details.</span></div>
      </div>
      <div class="step">
        <div class="step-num">2</div>
        <div><strong>Create an invoice</strong><br/><span style="font-size:13px;color:#64748b">Use the Invoice Builder to add line items, set due dates, and apply taxes.</span></div>
      </div>
      <div class="step">
        <div class="step-num">3</div>
        <div><strong>Get paid faster</strong><br/><span style="font-size:13px;color:#64748b">Send invoices with a payment link — clients can pay with card or PayPal.</span></div>
      </div>
      <div style="text-align:center;">
        <a href="${loginUrl}" class="btn">Go to Dashboard →</a>
      </div>
      <div class="divider"></div>
      <p class="body-text" style="text-align:center; font-size:13px; color:#64748b;">
        Questions? Reply to this email or visit our <a href="#" style="color:#4F46E5;">Help Center</a>.
      </p>
    </div>`,
  });

// ── 2. Email Verification ──────────────────────────────────────────────────────
exports.verifyEmail = ({ name, verifyUrl }) =>
  base({
    preheader: 'Verify your email to activate your InvoiceHub Pro account.',
    content: `
    <div class="card" style="text-align:center;">
      <div style="width:64px;height:64px;background:#EEF2FF;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;font-size:28px;">✉️</div>
      <h1 class="title">Confirm your email</h1>
      <p class="subtitle">Hi ${name}, click the button below to verify your email address. This link expires in <strong>24 hours</strong>.</p>
      <a href="${verifyUrl}" class="btn">Verify Email Address</a>
      <p class="body-text" style="font-size:12px;color:#94a3b8;margin-top:16px;">Or copy this link:<br/><span style="word-break:break-all;color:#4F46E5;">${verifyUrl}</span></p>
      <div class="divider"></div>
      <p class="body-text" style="font-size:13px;color:#64748b;">If you didn't create an account, you can safely ignore this email.</p>
    </div>`,
  });

// ── 3. Password Reset ──────────────────────────────────────────────────────────
exports.passwordReset = ({ name, resetUrl }) =>
  base({
    preheader: 'Reset your InvoiceHub Pro password — link expires in 1 hour.',
    content: `
    <div class="card" style="text-align:center;">
      <div style="font-size:40px;margin-bottom:12px;">🔐</div>
      <h1 class="title">Reset your password</h1>
      <p class="subtitle">Hi ${name}, we received a request to reset your password. Click below to create a new one:</p>
      <a href="${resetUrl}" class="btn">Reset Password</a>
      <div class="highlight-box" style="text-align:left;margin-top:24px;">
        <strong style="font-size:13px;color:#1e293b;">🛡️ Didn't request this?</strong>
        <p style="font-size:13px;color:#64748b;margin-top:4px;">Your password won't change unless you click the link above. If you didn't make this request, please secure your account immediately.</p>
      </div>
      <p class="body-text" style="font-size:12px;color:#94a3b8;margin-top:16px;">This link expires in <strong>1 hour</strong>.</p>
    </div>`,
  });

// ── 4. Invoice Sent ────────────────────────────────────────────────────────────
exports.invoiceSent = ({ clientName, senderName, invoiceNumber, amount, currency, dueDate, payUrl, lineItems = [] }) => {
  const rows = lineItems.map(
    (item) => `<tr><td>${item.description}</td><td style="text-align:center;">${item.quantity}</td><td style="text-align:right;">$${item.rate.toFixed(2)}</td><td style="text-align:right;font-weight:600;">$${item.amount.toFixed(2)}</td></tr>`
  ).join('');
  return base({
    preheader: `Invoice ${invoiceNumber} from ${senderName} — ${currency} ${amount} due ${dueDate}`,
    content: `
    <div class="card">
      <h1 class="title">You have a new invoice</h1>
      <p class="subtitle">Hi ${clientName}, <strong>${senderName}</strong> has sent you an invoice.</p>
      <div style="display:flex;justify-content:space-between;align-items:center;background:#F8FAFC;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
        <div><p style="font-size:12px;color:#64748b;margin-bottom:2px;">Invoice</p><p style="font-weight:700;font-size:18px;color:#0f172a;">${invoiceNumber}</p></div>
        <div style="text-align:right;"><p style="font-size:12px;color:#64748b;margin-bottom:2px;">Amount Due</p><p class="amount-big">${currency} ${amount}</p></div>
      </div>
      ${rows ? `<table class="invoice-table"><thead><tr><th>Description</th><th style="text-align:center;">Qty</th><th style="text-align:right;">Rate</th><th style="text-align:right;">Amount</th></tr></thead><tbody>${rows}</tbody></table>` : ''}
      <div class="divider"></div>
      <div class="info-row"><span class="info-label">Due Date</span><span class="info-value">${dueDate}</span></div>
      <div style="text-align:center;margin-top:28px;">
        <a href="${payUrl}" class="btn">Pay Now — ${currency} ${amount}</a>
        <p style="font-size:12px;color:#94a3b8;margin-top:8px;">Secure payment powered by Stripe &amp; PayPal</p>
      </div>
    </div>`,
  });
};

// ── 5. Payment Received ────────────────────────────────────────────────────────
exports.paymentReceived = ({ name, invoiceNumber, amount, currency, transactionId, paidAt, receiptUrl }) =>
  base({
    preheader: `Payment received for invoice ${invoiceNumber} — ${currency} ${amount}`,
    content: `
    <div class="card" style="text-align:center;">
      <div style="width:64px;height:64px;background:#DCFCE7;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:28px;">✅</div>
      <h1 class="title">Payment Received!</h1>
      <p class="subtitle">Hi ${name}, we've received your payment. Here's your receipt:</p>
      <div style="background:#F8FAFC;border-radius:12px;padding:24px;margin:20px 0;text-align:left;">
        <div class="info-row"><span class="info-label">Invoice</span><span class="info-value">${invoiceNumber}</span></div>
        <div class="info-row"><span class="info-label">Amount Paid</span><span class="info-value" style="color:#16a34a;">${currency} ${amount}</span></div>
        <div class="info-row"><span class="info-label">Transaction ID</span><span class="info-value" style="font-size:12px;font-family:monospace;">${transactionId}</span></div>
        <div class="info-row" style="border:none;"><span class="info-label">Date</span><span class="info-value">${paidAt}</span></div>
      </div>
      <a href="${receiptUrl}" class="btn">Download Receipt</a>
    </div>`,
  });

// ── 6. Subscription Activated ──────────────────────────────────────────────────
exports.subscriptionActivated = ({ name, plan, amount, interval, nextBillingDate, features = [] }) =>
  base({
    preheader: `Your ${plan} plan is now active — welcome to the full InvoiceHub Pro experience!`,
    content: `
    <div class="card">
      <div style="text-align:center;"><span style="font-size:40px;">🚀</span>
      <h1 class="title" style="margin-top:12px;">Your ${plan} Plan is Active!</h1>
      <p class="subtitle">Hi ${name}, your subscription is confirmed. Here's what's included:</p></div>
      <div style="background:#EEF2FF;border-radius:12px;padding:20px 24px;margin:20px 0;">
        ${features.map((f) => `<div style="display:flex;align-items:center;gap:10px;padding:6px 0;font-size:14px;color:#1e293b;"><span style="color:#4F46E5;font-weight:700;">✓</span> ${f}</div>`).join('')}
      </div>
      <div class="divider"></div>
      <div class="info-row"><span class="info-label">Plan</span><span class="info-value">${plan} (${interval})</span></div>
      <div class="info-row"><span class="info-label">Amount</span><span class="info-value">${amount}</span></div>
      <div class="info-row" style="border:none;"><span class="info-label">Next Billing</span><span class="info-value">${nextBillingDate}</span></div>
    </div>`,
  });

// ── 7. Subscription Cancelled ──────────────────────────────────────────────────
exports.subscriptionCancelled = ({ name, plan, accessUntil, reactivateUrl }) =>
  base({
    preheader: `Your ${plan} subscription has been cancelled.`,
    content: `
    <div class="card" style="text-align:center;">
      <span style="font-size:40px;">😔</span>
      <h1 class="title" style="margin-top:12px;">Subscription Cancelled</h1>
      <p class="subtitle">Hi ${name}, your <strong>${plan}</strong> subscription has been cancelled. You'll retain access until <strong>${accessUntil}</strong>.</p>
      <div class="highlight-box" style="text-align:left;">
        <strong style="font-size:14px;">Changed your mind?</strong>
        <p style="font-size:13px;color:#64748b;margin-top:4px;">Reactivate your plan anytime before ${accessUntil} to keep all your data and settings.</p>
      </div>
      <a href="${reactivateUrl}" class="btn-outline">Reactivate Subscription</a>
      <p style="font-size:13px;color:#64748b;margin-top:20px;">We'd love to hear your feedback. What could we have done better?<br/><a href="mailto:support@invoicehubpro.com" style="color:#4F46E5;">Reply to this email</a></p>
    </div>`,
  });

// ── 8. Trial Ending Soon ───────────────────────────────────────────────────────
exports.trialEnding = ({ name, daysLeft, upgradeUrl }) =>
  base({
    preheader: `Your free trial ends in ${daysLeft} days — upgrade to keep access.`,
    content: `
    <div class="card" style="text-align:center;">
      <div style="width:64px;height:64px;background:#FEF3C7;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:28px;">⏳</div>
      <h1 class="title">Your trial ends in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}!</h1>
      <p class="subtitle">Hi ${name}, don't lose access to InvoiceHub Pro's powerful features. Upgrade now to keep sending unlimited invoices and getting paid faster.</p>
      <a href="${upgradeUrl}" class="btn">Upgrade Now — From $19/mo</a>
      <p style="font-size:13px;color:#64748b;margin-top:16px;">Cancel anytime. No hidden fees.</p>
    </div>`,
  });

// ── 9. Invoice Overdue ─────────────────────────────────────────────────────────
exports.invoiceOverdue = ({ clientName, senderName, invoiceNumber, amount, currency, daysOverdue, payUrl }) =>
  base({
    preheader: `OVERDUE: Invoice ${invoiceNumber} from ${senderName} is ${daysOverdue} days past due.`,
    content: `
    <div class="card">
      <div style="background:#FEE2E2;border-radius:10px;padding:12px 16px;margin-bottom:20px;display:flex;align-items:center;gap:10px;">
        <span style="font-size:20px;">⚠️</span>
        <strong style="color:#991B1B;font-size:14px;">Payment is ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue</strong>
      </div>
      <h1 class="title">Invoice Overdue</h1>
      <p class="subtitle">Hi ${clientName}, this is a reminder that invoice <strong>${invoiceNumber}</strong> from <strong>${senderName}</strong> is past due.</p>
      <div style="background:#F8FAFC;border-radius:12px;padding:20px 24px;margin:20px 0;">
        <div class="info-row"><span class="info-label">Invoice</span><span class="info-value">${invoiceNumber}</span></div>
        <div class="info-row"><span class="info-label">Amount Due</span><span class="info-value" style="color:#DC2626;font-size:20px;">${currency} ${amount}</span></div>
        <div class="info-row" style="border:none;"><span class="info-label">Status</span><span class="badge badge-danger">Overdue ${daysOverdue}d</span></div>
      </div>
      <div style="text-align:center;">
        <a href="${payUrl}" class="btn">Pay Now</a>
        <p style="font-size:12px;color:#94a3b8;margin-top:8px;">If you've already made payment, please disregard this notice.</p>
      </div>
    </div>`,
  });

// ── 10. Monthly Digest ─────────────────────────────────────────────────────────
exports.monthlyDigest = ({ name, month, stats, dashboardUrl }) =>
  base({
    preheader: `Your ${month} summary: ${stats.totalRevenue} collected from ${stats.invoicesPaid} invoices.`,
    content: `
    <div class="card">
      <h1 class="title">Your ${month} Summary</h1>
      <p class="subtitle">Hi ${name}, here's a snapshot of your invoicing activity this month:</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:20px 0;">
        <div style="background:#EEF2FF;border-radius:12px;padding:16px;text-align:center;">
          <p style="font-size:11px;color:#6366f1;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Revenue Collected</p>
          <p style="font-size:24px;font-weight:700;color:#4F46E5;">${stats.totalRevenue}</p>
        </div>
        <div style="background:#DCFCE7;border-radius:12px;padding:16px;text-align:center;">
          <p style="font-size:11px;color:#16a34a;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Invoices Paid</p>
          <p style="font-size:24px;font-weight:700;color:#16a34a;">${stats.invoicesPaid}</p>
        </div>
        <div style="background:#FEF3C7;border-radius:12px;padding:16px;text-align:center;">
          <p style="font-size:11px;color:#d97706;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Outstanding</p>
          <p style="font-size:24px;font-weight:700;color:#d97706;">${stats.outstanding}</p>
        </div>
        <div style="background:#F1F5F9;border-radius:12px;padding:16px;text-align:center;">
          <p style="font-size:11px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Invoices Sent</p>
          <p style="font-size:24px;font-weight:700;color:#374151;">${stats.invoicesSent}</p>
        </div>
      </div>
      <div style="text-align:center;margin-top:8px;">
        <a href="${dashboardUrl}" class="btn">View Full Report →</a>
      </div>
    </div>`,
  });
