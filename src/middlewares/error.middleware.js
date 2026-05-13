const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    // Log the error using Winston
    logger.error(`${req.method} ${req.originalUrl} - [${statusCode}] - ${message}`, {
        stack: err.stack,
        body: req.body,
        params: req.params,
        query: req.query,
        user: req.user ? req.user.id : 'Guest'
    });

    res.status(statusCode).json({
        success: false,
        message,
        // Only return stack traces in development
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};

module.exports = errorHandler;
