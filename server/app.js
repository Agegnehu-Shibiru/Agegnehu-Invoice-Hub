const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const passport = require('./config/passport');
const { globalLimiter } = require('./middleware/rateLimiter');
const apiTracker = require('./middleware/apiTracker');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const { invoiceRouter, userRouter, clientRouter, paymentRouter, adminRouter } = require('./routes/index');
const authRouter = require('./routes/auth');

const app = express();

// ── Trust proxy (for rate limiting behind nginx) ────────────────────────────────
app.set('trust proxy', 1);

// ── Security headers ────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: process.env.NODE_ENV === 'production' }));

// ── CORS ────────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: [process.env.CLIENT_URL || 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Body parsing (except Stripe webhook which needs raw body) ───────────────────
app.use('/api/v1/payments/stripe/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());
app.use(compression());

// ── Session (for Passport OAuth) ───────────────────────────────────────────────
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
  cookie: { secure: process.env.NODE_ENV === 'production', httpOnly: true, maxAge: 10 * 60 * 1000 },
}));

// ── Passport ────────────────────────────────────────────────────────────────────
app.use(passport.initialize());
app.use(passport.session());

// ── Security middleware ─────────────────────────────────────────────────────────
app.use(mongoSanitize());
app.use(xss());
app.use(hpp({ whitelist: ['status', 'sort', 'fields', 'page', 'limit'] }));

// ── Logging ─────────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ── Global rate limiter ─────────────────────────────────────────────────────────
app.use('/api', globalLimiter);

// ── API usage tracker ───────────────────────────────────────────────────────────
app.use('/api', apiTracker);

// ── Swagger docs ────────────────────────────────────────────────────────────────
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: { title: 'InvoiceHub Pro API', version: '1.0.0', description: 'Full-featured invoice and client management API' },
    servers: [{ url: '/api/v1' }],
    components: {
      securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./routes/*.js', './controllers/*.js'],
});
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customCss: '.swagger-ui .topbar { display: none }' }));

// ── Routes ──────────────────────────────────────────────────────────────────────
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/invoices', invoiceRouter);
app.use('/api/v1/clients', clientRouter);
app.use('/api/v1/payments', paymentRouter);
app.use('/api/v1/admin', adminRouter);

// ── Health check ────────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() }));

// ── 404 handler ─────────────────────────────────────────────────────────────────
app.all('*', (req, res) => res.status(404).json({ status: 'fail', message: `Route ${req.originalUrl} not found.` }));

// ── Global error handler ────────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
