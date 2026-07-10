const logger = require('../utils/logger');

const handleCastErrorDB = (err) => ({
  statusCode: 400,
  message: `Invalid ${err.path}: ${err.value}`,
});

const handleDuplicateKeyDB = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  return { statusCode: 400, message: `${field} '${value}' already exists. Please use a different value.` };
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  return { statusCode: 400, message: `Validation error: ${errors.join('. ')}` };
};

const handleJWTError = () => ({ statusCode: 401, message: 'Invalid token. Please log in again.' });
const handleJWTExpired = () => ({ statusCode: 401, message: 'Your session has expired. Please log in again.' });

const sendErrorDev = (err, res) => {
  res.status(err.statusCode || 500).json({
    status: err.status || 'error',
    message: err.message,
    stack: err.stack,
    error: err,
  });
};

const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({ status: err.status, message: err.message });
  } else {
    logger.error('UNEXPECTED ERROR:', err);
    res.status(500).json({ status: 'error', message: 'Something went wrong. Please try again later.' });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  logger.error(`${err.statusCode} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);

  if (process.env.NODE_ENV === 'development') {
    return sendErrorDev(err, res);
  }

  let error = { ...err, message: err.message };
  if (err.name === 'CastError') error = { ...error, ...handleCastErrorDB(err) };
  if (err.code === 11000) error = { ...error, ...handleDuplicateKeyDB(err) };
  if (err.name === 'ValidationError') error = { ...error, ...handleValidationErrorDB(err) };
  if (err.name === 'JsonWebTokenError') error = { ...error, ...handleJWTError() };
  if (err.name === 'TokenExpiredError') error = { ...error, ...handleJWTExpired() };

  sendErrorProd(error, res);
};
