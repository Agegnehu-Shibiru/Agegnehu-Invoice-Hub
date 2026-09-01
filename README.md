# Agegnehu Invoice Hub

A production-ready, full-stack invoice generator and client portal built with React 18 + Vite, Express.js, MongoDB, Stripe, PayPal, and Resend.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TailwindCSS, React Query, React Hook Form + Zod, Framer Motion, Recharts |
| Backend | Express.js, Node.js, Mongoose, Passport.js, Winston, Swagger |
| Database | MongoDB (Mongoose) with full indexing |
| Auth | JWT (httpOnly cookies) + OAuth (Google, Facebook, X) + Phone OTP (Twilio) |
| Payments | Stripe (cards + subscriptions) + PayPal |
| Email | Resend API with 10 HTML email templates |
| Queue | Bull + Redis (background jobs) |
| Infra | Docker + Docker Compose, Nginx |

---

## Quick Start

### Prerequisites
- Node.js 20+
- MongoDB 7+
- Redis 7+

### 1. Clone and install

```bash
# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Fill in all required values in .env
```

### 3. Run in development

```bash
# Terminal 1: Start server
cd server && npm run dev

# Terminal 2: Start client
cd client && npm run dev
```

Server runs on `http://localhost:5000`  
Client runs on `http://localhost:5173`  
Swagger docs: `http://localhost:5000/api/docs`

---

## Docker

```bash
# Copy and configure env
cp .env.example .env

# Start all services (MongoDB, Redis, Server, Client)
docker-compose up --build
```

App available at `http://localhost:5173`

---

## Project Structure

```
invoicehub-pro/
├── client/                     # React + Vite frontend
│   ├── src/
│   │   ├── api/                # Axios + all API calls
│   │   ├── components/
│   │   │   ├── auth/           # ProtectedRoute, AdminRoute
│   │   │   └── layout/         # PublicLayout, DashboardLayout, AdminLayout
│   │   ├── pages/
│   │   │   ├── public/         # Landing, About, Contact, Pricing, Blog, Policy
│   │   │   ├── auth/           # Login, Register, ForgotPassword, Reset, Verify
│   │   │   ├── dashboard/      # All client dashboard pages + InvoiceBuilder
│   │   │   └── admin/          # All admin pages
│   │   └── store/              # Zustand (auth)
│
├── server/
│   ├── config/                 # db.js, passport.js
│   ├── controllers/            # auth, invoice, payment, user, admin
│   ├── middleware/             # auth, rateLimiter, errorHandler, apiTracker
│   ├── models/                 # User, Invoice, Client, Payment, Subscription, Logs
│   ├── routes/                 # auth.js + index.js (all routes)
│   ├── services/               # emailService.js
│   ├── templates/              # base.js + emails.js (10 templates)
│   ├── jobs/                   # cronJobs.js
│   ├── utils/                  # appError, logger, tokenUtils
│   ├── app.js
│   └── server.js
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Features

### Authentication & Security
- JWT access tokens (15 min) + refresh token rotation with family tracking
- httpOnly, Secure, SameSite=Strict cookies
- OAuth 2.0: Google, Facebook, X (Twitter)
- Phone OTP via Twilio
- Email verification required before login
- Account lockout after 5 failed attempts (15 min)
- bcrypt password hashing (rounds: 12)
- Helmet, CORS whitelist, mongo-sanitize, xss-clean, hpp
- Rate limiting: global (100/15min), auth (5/15min), contact (10/hr)

### Invoicing
- Invoice builder with line items, taxes, discounts, auto-numbering (INV-0001)
- Multiple currency support
- Live preview panel
- PDF generation
- Public payment link (no auth required)
- Invoice status lifecycle: draft → sent → viewed → paid | overdue
- Email invoice to client with line item table

### Payments
- Stripe Checkout (card payments on invoices)
- Stripe Subscriptions (Pro/Business plans)
- Stripe Webhooks (payment confirmation, subscription events)
- PayPal order create + capture
- Manual payment marking

### Subscriptions
- Free plan: 5 invoices/mo, 2 clients
- Pro ($19/mo or $190/yr): unlimited invoices + clients, branding, payment links
- Business ($49/mo or $490/yr): everything + team, API, white-label

### Emails (Resend)
10 beautiful HTML email templates: welcome, verify, password reset, invoice sent, payment received, subscription activated/cancelled, trial ending, overdue reminder, monthly digest

### Admin Panel
- Platform stats: MRR, users, invoices, churn
- User management: view, update role, ban
- API usage tracker with endpoint analytics
- Email log viewer

### Cron Jobs (node-cron)
- Daily: mark overdue invoices
- Daily: send overdue reminders (max once per 3 days per invoice)
- Daily: trial ending reminders (3 days before)
- Monthly: digest emails to all users
- Monthly: reset invoice usage counters

---

## API Documentation

Swagger UI available at `/api/docs` when the server is running.

---

## Environment Variables

See `.env.example` for all required variables with documentation.

Key services to configure:
- **MongoDB**: local or MongoDB Atlas
- **Redis**: local or Redis Cloud
- **Stripe**: test keys from dashboard.stripe.com
- **Resend**: API key from resend.com
- **Google OAuth**: from console.cloud.google.com
- **PayPal**: sandbox credentials from developer.paypal.com
- **Twilio** (optional): for phone OTP

---

## Deployment

### Production checklist
- Set `NODE_ENV=production`
- Use MongoDB Atlas for database
- Use Redis Cloud for queue
- Configure all OAuth callback URLs to production domain
- Set Stripe webhook URL to `https://yourdomain.com/api/v1/payments/stripe/webhook`
- Point Resend domain verification to your email domain

### Recommended platforms
- **Server**: Railway, Render, or AWS EC2
- **Client**: Vercel or Netlify
- **Database**: MongoDB Atlas
- **Redis**: Upstash

---

## License

MIT License — free to use for personal and commercial projects.
