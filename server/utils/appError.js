// ── AppError ───────────────────────────────────────────────────────────────────
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// ── catchAsync ─────────────────────────────────────────────────────────────────
const catchAsync = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ── sendResponse ───────────────────────────────────────────────────────────────
const sendResponse = (res, statusCode, data, message = 'Success') => {
  res.status(statusCode).json({ status: 'success', message, data });
};

module.exports = { AppError, catchAsync, sendResponse };
