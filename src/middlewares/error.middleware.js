const errorHandler = (err, req, res, next) => {
    // Log the error for debugging
    console.error(`--- ERROR [${err.statusCode || 500}] ---`, err.message || err);
    if (err.stack) console.error(err.stack);

    // Default error status code and message
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    res.status(statusCode).json({
        success: false,
        message,
        // Only return stack traces in development
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};

module.exports = errorHandler;
