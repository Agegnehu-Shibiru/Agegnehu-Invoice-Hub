const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const app = require('./app');
const connectDB = require('./config/db');
const logger = require('./utils/logger');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

// Connect DB then start server
connectDB().then(() => {
  const PORT = process.env.PORT || 5000;
  const server = app.listen(PORT, () => {
    logger.info(`🚀 InvoiceHub Pro server running on port ${PORT} [${process.env.NODE_ENV}]`);
    logger.info(`📚 API Docs: http://localhost:${PORT}/api/docs`);
  });

  // Start cron jobs
  require('./jobs/cronJobs');

  // Graceful shutdown
  const gracefulShutdown = (signal) => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    server.close(() => {
      logger.info('HTTP server closed.');
      require('mongoose').connection.close(false, () => {
        logger.info('MongoDB connection closed.');
        process.exit(0);
      });
    });
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  process.on('unhandledRejection', (err) => {
    logger.error('UNHANDLED REJECTION:', err);
    gracefulShutdown('unhandledRejection');
  });

  process.on('uncaughtException', (err) => {
    logger.error('UNCAUGHT EXCEPTION:', err);
    process.exit(1);
  });
});
