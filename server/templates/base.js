// Base HTML wrapper for all emails
const baseTemplate = ({ preheader = '', content }) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>InvoiceHub Pro</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background-color: #F0F4FF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; -webkit-text-size-adjust: 100%; color: #1e293b; }
    .preheader { display: none !important; visibility: hidden; opacity: 0; font-size: 1px; height: 0; max-height: 0; max-width: 0; overflow: hidden; mso-hide: all; }
    .wrapper { width: 100%; background-color: #F0F4FF; padding: 32px 16px; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { text-align: center; padding: 24px 0 20px; }
    .logo-text { font-size: 22px; font-weight: 700; color: #4F46E5; letter-spacing: -0.5px; }
    .logo-dot { color: #06B6D4; }
    .card { background: #ffffff; border-radius: 16px; padding: 40px; margin-bottom: 24px; border: 1px solid #e2e8f0; }
    .title { font-size: 24px; font-weight: 700; color: #0f172a; margin-bottom: 12px; line-height: 1.3; }
    .subtitle { font-size: 16px; color: #64748b; margin-bottom: 24px; line-height: 1.6; }
    .body-text { font-size: 15px; color: #374151; line-height: 1.7; margin-bottom: 16px; }
    .btn { display: inline-block; background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color: #ffffff !important; text-decoration: none; font-size: 15px; font-weight: 600; padding: 14px 32px; border-radius: 10px; margin: 20px 0; letter-spacing: 0.2px; }
    .btn-outline { display: inline-block; background: transparent; color: #4F46E5 !important; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 28px; border-radius: 10px; border: 2px solid #4F46E5; margin: 8px 0; }
    .divider { height: 1px; background: #f1f5f9; margin: 28px 0; }
    .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
    .info-label { color: #64748b; font-weight: 500; }
    .info-value { color: #1e293b; font-weight: 600; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 600; }
    .badge-success { background: #DCFCE7; color: #166534; }
    .badge-warning { background: #FEF3C7; color: #92400E; }
    .badge-danger { background: #FEE2E2; color: #991B1B; }
    .badge-info { background: #DBEAFE; color: #1E40AF; }
    .highlight-box { background: #F8FAFC; border-left: 4px solid #4F46E5; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 20px 0; }
    .amount-big { font-size: 36px; font-weight: 700; color: #4F46E5; }
    .step { display: flex; gap: 16px; margin-bottom: 20px; align-items: flex-start; }
    .step-num { width: 32px; height: 32px; border-radius: 50%; background: #EEF2FF; color: #4F46E5; font-weight: 700; font-size: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .footer { text-align: center; padding: 8px 0 24px; }
    .footer-text { font-size: 12px; color: #94a3b8; line-height: 1.8; }
    .footer-link { color: #4F46E5; text-decoration: none; font-weight: 500; }
    table.invoice-table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px; }
    table.invoice-table th { background: #F8FAFC; color: #64748b; font-weight: 600; padding: 10px 12px; text-align: left; border-bottom: 2px solid #e2e8f0; }
    table.invoice-table td { padding: 12px; border-bottom: 1px solid #f1f5f9; color: #374151; }
    table.invoice-table .total-row td { font-weight: 700; color: #0f172a; font-size: 16px; background: #F8FAFC; }
    @media (max-width: 600px) { .card { padding: 24px 20px; } .amount-big { font-size: 28px; } }
  </style>
</head>
<body>
  <div class="preheader">${preheader}</div>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <span class="logo-text">Invoice<span class="logo-dot">Hub</span> Pro</span>
      </div>
      ${content}
      <div class="footer">
        <p class="footer-text">
          © ${new Date().getFullYear()} InvoiceHub Pro. All rights reserved.<br/>
          <a href="#" class="footer-link">Unsubscribe</a> &nbsp;·&nbsp;
          <a href="#" class="footer-link">Privacy Policy</a> &nbsp;·&nbsp;
          <a href="#" class="footer-link">Terms of Service</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>
`;

module.exports = baseTemplate;
