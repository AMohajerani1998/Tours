const Review = require('../models/reviewModel');
const Tour = require('../models/tourModel');
const factory = require('./factoryHandlers');

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.setTourId = catchAsync(async (req, res, next) => {
    if (!req.body.user) req.body.user = req.user.id;
    if (!req.body.tour) req.body.tour = req.params.tourId;
    if (!req.body.tour || !(await Tour.findById(req.body.tour)))
        return next(new AppError(404, 'There is no tour by that id. Please try again.'));
    next();
});

exports.newReview = factory.createOne(Review);

exports.getReviews = factory.getAll(Review);

exports.getSingleReview = factory.getOne(Review);

exports.updateReview = factory.updateOne(Review);

exports.deleteReview = factory.deleteOne(Review);
