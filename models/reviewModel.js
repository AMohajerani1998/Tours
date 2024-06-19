const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
    {
        review: {
            type: String,
            required: [true, 'The review cannot be empty'],
            minlength: [5, 'The review text must be at least 5 characters'],
            maxlength: [200, 'The review text cannot be more than 200 characters'],
        },
        rating: {
            type: Number,
            required: [true, 'The review must have a score'],
            min: [1, "Review's score cannot be lower than 1"],
            max: [5, "Review's score cannot be higher than 5"],
        },
        createdAt: {
            type: Date,
            default: Date.now(),
        },
        user: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: [true, 'The review must have an author'],
        },
        tour: {
            type: mongoose.Schema.ObjectId,
            ref: 'Tour',
            required: [true, 'The review must belong to a tour'],
        },
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    },
);

reviewSchema.statics.calcAverageRatings = async function (tourId) {
    const stats = await this.aggregate([
        {
            $match: { tour: tourId },
        },
        {
            $group: {
                _id: tourId,
                avgRating: { $avg: '$rating' },
                ratingCount: { $sum: 1 },
            },
        },
    ]);
    if (stats.length > 0)
        await Tour.findByIdAndUpdate(tourId, {
            ratingsAverage: stats[0].avgRating,
            ratingsQuantity: stats[0].ratingCount,
        });
    else
        await Tour.findByIdAndUpdate(tourId, {
            ratingsAverage: 4.5,
            ratingsQuantity: 0,
        });
};

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.post('save', async function () {
    await this.constructor.calcAverageRatings(this.tour);
});

reviewSchema.pre(/^findOneAnd/, async function (next) {
    this.result = await this.findOne();
    next();
});

reviewSchema.post(/^findOneAnd/, async function () {
    await this.result.constructor.calcAverageRatings(this.result.tour);
});

reviewSchema.pre(/^find/, function (next) {
    this.populate({
        path: 'user',
        select: { name: 1, photo: 1 },
    });
    next();
});

// reviewSchema.pre(/^find/, function (next) {
//     this.populate({
//         path: "tour",
//     });
//     next();
// });

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
