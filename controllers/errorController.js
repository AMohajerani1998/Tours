const AppError = require('../utils/appError');

const sendErroDev = (err, req, res) => {
    if (req.originalUrl.startsWith('/api')) {
        return res.status(err.statusCode).json({
            status: err.status,
            err: err,
            message: err.message,
            stack: err.stack,
        });
    }
    return res.status(err.statusCode).render('error', {
        title: 'Something went wrong!',
        message: err.message,
    });
};

const sendErrorProd = (error, req, res) => {
    // Operational, trusted error; send message to client
    if (req.originalUrl.startsWith('/api')) {
        if (error.isOperational) {
            res.status(error.statusCode).json({
                status: error.status,
                message: error.message,
            });
            // Programming or other unknown error. Don't leak error details
        } else {
            // 1) Log error
            console.error('Error!!!', error);

            // 2) Send generic message
            res.status(500).json({
                status: 'error',
                message: 'Something went very wrong!',
            });
        }
    }
    if (error.isOperational) {
        res.status(error.statusCode).render('error', {
            title: 'Something went wrong!',
            message: error.message,
        });
        // Programming or other unknown error. Don't leak error details
    } else {
        // 1) Log error
        console.error('Error!!!', error);

        // 2) Send generic message
        res.status(500).render('error', {
            title: 'Something went wrong!',
            message: 'Something went very wrong!',
        });
    }
};

const handleCastError = (err) => {
    const message = `Invalid input ${err.path}: ${err.value}`;
    return new AppError(400, message);
};

const handleDuplictionError = (err) => {
    const value = Object.values(err.keyValue);
    const message = `Duplicated field value: "${value}". Please use another one.`;
    return new AppError(400, message);
};

const handleValidatorError = (err) => {
    const values = Object.values(err.errors).map((el) => el.message);
    const message = `Invalid input data. ${values.join('. ')}`;
    return new AppError(400, message);
};

const handleJsonWebTokenError = () => new AppError(401, 'Invalid token! Please login again.');

const handleTokenExpiredError = () => new AppError(401, 'Your session has expired, Please login again to continue.');

module.exports = (err, req, res, next) => {
    // console.log(err.stack);
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        sendErroDev(err, req, res);
    } else if (process.env.NODE_ENV === 'production') {
        let error = err;

        if (err.name === 'CastError') error = handleCastError(error);
        if (err.code === 11000) error = handleDuplictionError(error);
        if (err.name === 'ValidationError') error = handleValidatorError(error);
        if (err.name === 'JsonWebTokenError') error = handleJsonWebTokenError();
        if (err.name === 'TokenExpiredError') error = handleTokenExpiredError();

        sendErrorProd(error, req, res);
    }
};
