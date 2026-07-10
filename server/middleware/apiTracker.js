const { ApiLog } = require('../models/Logs');
const logger = require('../utils/logger');

module.exports = (req, res, next) => {
  const start = Date.now();

  res.on('finish', async () => {
    try {
      const responseTime = Date.now() - start;
      await ApiLog.create({
        user: req.user?._id,
        ip: req.ip,
        method: req.method,
        endpoint: req.originalUrl,
        statusCode: res.statusCode,
        responseTime,
        userAgent: req.get('user-agent'),
        rateLimitHit: res.statusCode === 429,
        errorMessage: res.statusCode >= 400 ? res.locals?.errorMessage : undefined,
      });
    } catch (err) {
      logger.error('API tracker error:', err);
    }
  });

  next();
};
