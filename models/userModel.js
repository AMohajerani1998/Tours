const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter your name'],
        minlength: [10, 'Your name should be at least 10 characters'],
        maxlength: [40, 'Your name can not be more than 40 characters'],
    },
    email: {
        type: String,
        required: [true, 'Please enter your email'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please enter a valid email'],
        minlength: [15, 'Your email address should be at least 15 characters'],
        maxlength: [50, 'Your email address can not be more than 50 characters'],
    },
    photo: {
        type: String,
        default: 'default.jpg',
    },
    role: {
        type: String,
        enum: ['user', 'guide', 'lead-guide', 'admin'],
        default: 'user',
    },
    isActive: {
        type: Boolean,
        default: true,
        select: false,
    },
    password: {
        type: String,
        required: [true, 'Please enter a password'],
        minlength: [6, 'Password should be atleast 6 characters'],
        select: false,
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Please confirm your password'],
        validate: {
            validator: function (val) {
                return val === this.password;
            },
            message: 'Password and Password Confirm are not equal!',
        },
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetTokenExpires: Date,
});
userSchema.pre('save', async function (next) {
    //passowrd modification check
    if (!this.isModified('password')) return next();
    //password hashing
    this.password = await bcrypt.hash(this.password, 12);
    this.passwordConfirm = undefined;
    next();
});

userSchema.pre('save', async function (next) {
    if (!this.isModified('password') || this.isNew) return next();

    this.passwordChangedAt = Date.now() - 1000;

    next();
});

userSchema.pre(/^find/, function (next) {
    this.find({ isActive: { $ne: false } });
    next();
});

userSchema.methods.passwordCheck = async function (enteredPassword, hashedPassword) {
    return await bcrypt.compare(enteredPassword, hashedPassword);
};

userSchema.methods.passwordChanged = function (JWTiat) {
    if (this.passwordChangedAt) {
        return parseInt(this.passwordChangedAt.getTime() / 1000, 10) > JWTiat;
    }
    return false;
};

userSchema.methods.generatePasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.passwordResetTokenExpires = Date.now() + 10 * 60 * 1000;

    return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
