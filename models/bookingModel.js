const mongoose = require('mongoose');

const bookingSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Booking must have a user'],
    },
    tour: {
        type: mongoose.Schema.ObjectId,
        ref: 'Tour',
        required: [true, 'Booking must have a tour'],
    },
    price: {
        type: Number,
        required: [true, 'Booking must have a price'],
    },
    createdAt: {
        type: Date,
        default: Date.now(),
    },
    isPaid: {
        type: Boolean,
        default: true,
    },
});

bookingSchema.pre(/^find/, function (next) {
    this.populate('user').populate({ path: 'tour', select: 'name' });
    next();
});

bookingSchema.index({ tour: 1, user: 1 }, { isUnique: true });

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
