// ── invoices.js ──────────────────────────────────────────────────────────────
const express = require('express');
const invoiceRouter = express.Router();
const ctrl = require('../controllers/invoiceController');
const { protect } = require('../middleware/auth');

invoiceRouter.get('/public/:shareToken', ctrl.getPublicInvoice);
invoiceRouter.use(protect);
invoiceRouter.get('/stats', ctrl.getStats);
invoiceRouter.route('/').get(ctrl.getInvoices).post(ctrl.createInvoice);
invoiceRouter.route('/:id').get(ctrl.getInvoice).patch(ctrl.updateInvoice).delete(ctrl.deleteInvoice);
invoiceRouter.post('/:id/send', ctrl.sendInvoice);
invoiceRouter.post('/:id/mark-paid', ctrl.markPaid);

// ── users.js ──────────────────────────────────────────────────────────────────
const userRouter = express.Router();
const userCtrl = require('../controllers/userController');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (req, file, cb) => { if (!file.mimetype.startsWith('image/')) return cb(new Error('Only images allowed'), false); cb(null, true); } });

userRouter.use(protect);
userRouter.get('/me', userCtrl.getMe);
userRouter.patch('/me', userCtrl.updateMe);
userRouter.patch('/me/password', userCtrl.updatePassword);
userRouter.delete('/me', userCtrl.deleteMe);
userRouter.post('/me/avatar', upload.single('avatar'), userCtrl.uploadAvatar);

// ── clients.js ────────────────────────────────────────────────────────────────
const clientRouter = express.Router();
clientRouter.use(protect);
clientRouter.route('/').get(userCtrl.getClients).post(userCtrl.createClient);
clientRouter.route('/:id').get(userCtrl.getClient).patch(userCtrl.updateClient).delete(userCtrl.deleteClient);

// ── payments.js ───────────────────────────────────────────────────────────────
const paymentRouter = express.Router();
const payCtrl = require('../controllers/paymentController');
paymentRouter.post('/stripe/webhook', express.raw({ type: 'application/json' }), payCtrl.stripeWebhook);
paymentRouter.use(protect);
paymentRouter.post('/stripe/checkout', payCtrl.stripeCheckout);
paymentRouter.post('/stripe/subscription', payCtrl.stripeSubscriptionCheckout);
paymentRouter.post('/paypal/create-order', payCtrl.paypalCreateOrder);
paymentRouter.post('/paypal/capture-order', payCtrl.paypalCaptureOrder);
paymentRouter.get('/history', payCtrl.getPaymentHistory);

// ── admin.js ──────────────────────────────────────────────────────────────────
const adminRouter = express.Router();
const adminCtrl = require('../controllers/adminController');
const { restrictTo } = require('../middleware/auth');
adminRouter.use(protect, restrictTo('admin', 'superadmin'));
adminRouter.get('/stats', adminCtrl.getStats);
adminRouter.get('/users', adminCtrl.getUsers);
adminRouter.get('/users/:id', adminCtrl.getUser);
adminRouter.patch('/users/:id', adminCtrl.updateUser);
adminRouter.post('/users/:id/ban', adminCtrl.banUser);
adminRouter.get('/api-tracker', adminCtrl.getApiTracker);
adminRouter.get('/email-logs', adminCtrl.getEmailLogs);

module.exports = { invoiceRouter, userRouter, clientRouter, paymentRouter, adminRouter };
