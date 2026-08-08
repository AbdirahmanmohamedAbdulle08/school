const errorHandler = (err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? (err.statusCode || 500) : res.statusCode;

    // Log error for debugging
    console.error('Error:', {
        message: err.message,
        statusCode,
        path: req.path,
        method: req.method,
        stack: err.stack
    });

    res.status(statusCode);
    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};

module.exports = { errorHandler };
