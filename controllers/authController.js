const { promisify } = require('util');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const Email = require('../utils/email');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

const sendResToken = (res, user, statusCode) => {
    const token = signToken(user._id);
    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
        httpOnly: true,
    };
    if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
    res.cookie('jwt', token, cookieOptions);
    user.password = undefined;
    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user,
        },
    });
};

exports.signUp = catchAsync(async (req, res, next) => {
    const user = await User.create({
        name: req.body.name,
        email: req.body.email,
        photo: req.body.photo,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
    });
    const url = `${req.protocol}://${req.get('host')}:3000/me`;
    await new Email(user, url).sendWelcome();
    sendResToken(res, user, 201);
});

exports.login = catchAsync(async (req, res, next) => {
    // input check
    const { email, password } = req.body;
    if (!email || !password) {
        return next(new AppError(400, 'Please fill both fields out!'));
    }
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.passwordCheck(password, user.password)))
        return next(new AppError(401, 'Password or email are incorrect'));
    sendResToken(res, user, 200);
});

exports.logout = catchAsync(async (req, res, next) => {
    res.cookie('jwt', 'loggedout', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true,
    });
    res.status(200).json({
        status: 'success',
    });
});

exports.protect = catchAsync(async (req, res, next) => {
    // Check if token exists
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) token = req.cookies.jwt;
    if (!token) {
        return next(new AppError(401, 'You have to be logged in to access this page!'));
    }

    // Check token validation
    const decodedToken = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // Check if user exists
    const currentUser = await User.findById(decodedToken.id);
    if (!currentUser) return next(new AppError(401, 'The user for this token no longer exists!'));

    // Check if user's password changed since token's datestamp
    if (currentUser.passwordChanged(decodedToken.iat)) {
        return next(new AppError(401, 'Password has recently been changed. Please login again'));
    }

    // Grant access to the protected route
    req.user = currentUser;
    res.locals.user = currentUser;
    next();
});

exports.isLoggedIn = async (req, res, next) => {
    try {
        if (req.cookies.jwt) {
            const decryptedToken = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);
            if (!decryptedToken) return next();

            const currentUser = await User.findById(decryptedToken.id);
            if (!currentUser) return next();

            if (currentUser.passwordChanged(decryptedToken.iat)) return next();

            res.locals.user = currentUser;
            return next();
        }
    } catch (err) {
        return next();
    }
    next();
};

exports.restrictTo =
    (...roles) =>
    (req, res, next) => {
        if (!roles.includes(req.user.role))
            return next(new AppError(403, 'You do not have permission to perform this action!'));
        next();
    };

exports.forgotPassword = catchAsync(async (req, res, next) => {
    // Find user based on POSTed email

    const user = await User.findOne({ email: req.body.email });
    if (!user) return next(new AppError(404, 'There is no user by that email!'));

    // Generate a random string
    const resetToken = user.generatePasswordResetToken();
    await user.save({ validateBeforeSave: false });
    // Send the string to user's email
    const requestURL = `${req.protocol}://${req.hostname}:3000/api/v1/users/resetPassword/${resetToken}`;
    try {
        await new Email(user, requestURL).sendPasswordReset();
        res.status(201).json({
            status: 'success',
            message: 'Token was sent to email!',
        });
    } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetTokenExpires = undefined;
        return next(new AppError(500, 'There was an error sending the email! Please try again later.'));
    }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
    // Getting user based on provided token
    const encryptedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    // Checking if the token is expred
    const user = await User.findOne({
        passwordResetToken: encryptedToken,
        passwordResetTokenExpires: { $gte: Date.now() },
    });
    if (!user) return next(new AppError(404, 'Invalid token. Please try again later!'));
    // Updating the changedPasswordAt for the user
    // Logging the user and sending the JWT
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpires = undefined;
    await user.save({ verifyBeforeSave: true });
    sendResToken(res, user, 200);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
    const { id } = req.user;
    const { password, passwordConfirm, currentPassword } = req.body;
    const user = await User.findById(id).select('+password');

    if (!currentPassword || !(await user.passwordCheck(currentPassword, user.password))) {
        return next(new AppError(401, 'Please enter your current password correctly'));
    }
    user.password = password;
    user.passwordConfirm = passwordConfirm;
    await user.save();

    sendResToken(res, user, 200);
});
