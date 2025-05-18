const errorHandler = (err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    
    // Convert technical error messages to user-friendly ones
    let userMessage = 'An unexpected error occurred. Please try again.';
    
    if (err.name === 'ValidationError') {
        userMessage = Object.values(err.errors).map(e => e.message).join(', ');
    } else if (err.code === 11000) {
        userMessage = 'This information is already registered in our system.';
    } else if (err.name === 'JsonWebTokenError') {
        userMessage = 'Your session has expired. Please log in again.';
    } else if (statusCode === 404) {
        userMessage = 'The requested resource was not found.';
    } else if (statusCode === 401) {
        userMessage = 'Please log in to access this feature.';
    } else if (statusCode === 403) {
        userMessage = 'You do not have permission to perform this action.';
    }

    res.status(statusCode).json({
        message: userMessage,
        success: false,
        // Only include technical details in development
        ...(process.env.NODE_ENV !== 'production' && {
            technicalDetails: {
                error: err.message,
                stack: err.stack
            }
        })
    });
};

const notFound = (req, res, next) => {
    const error = new Error('The requested resource was not found');
    res.status(404);
    next(error);
};

module.exports = { errorHandler, notFound }; 