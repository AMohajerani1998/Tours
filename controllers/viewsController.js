const catchAsync = require('../utils/catchAsync');
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const AppError = require('../utils/appError');

exports.getOverview = catchAsync(async (req, res, next) => {
    const tours = await Tour.find();
    res.render('overview', {
        title: 'All tours',
        tours,
    });
});

exports.getTour = catchAsync(async (req, res, next) => {
    const { slug } = req.params;
    const tour = await Tour.findOne({ slug }).populate({ path: 'reviews', select: 'review rating user' });
    if (!tour) return next(new AppError(404, 'Tour not found!'));
    res.render('tour', {
        tour,
        title: tour.name,
    });
});

exports.getLoginForm = catchAsync(async (req, res, next) => {
    res.render('login', {
        title: 'Login',
    });
});

exports.getAccount = (req, res) => {
    res.status(200).render('account', {
        title: 'My account',
        user: req.user,
    });
};

exports.getMyTours = catchAsync(async (req, res, next) => {
    const bookings = await Booking.find({ user: req.user.id });
    const tourIds = bookings.map((booking) => booking.tour);
    const tours = await Tour.find({ _id: { $in: tourIds } });

    res.status(200).render('overview', {
        title: 'My Tours',
        tours,
    });
});
