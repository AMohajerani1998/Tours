const mongoose = require('mongoose');
const slugify = require('slugify');
// const User = require("./userModel");

const tourSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            require: [true, 'Tour must have a name'],
            unique: true,
            trim: true,
            minlength: [10, 'Tour name must have at least 10 characters'],
            maxlength: [40, 'Tour name must have lesst than 40 characters'],
            // validate: [validator.isAlpha, "The name should only contain alphabets"],
            //doesn't accept spaces
        },
        slug: String,
        duration: {
            type: Number,
            required: [true, 'Tour must have a duration'],
        },
        maxGroupSize: {
            type: Number,
            require: [true, 'Tour must have a group size'],
        },
        difficulty: {
            type: String,
            required: [true, 'Tour must have a difficulty'],
            enum: {
                values: ['easy', 'medium', 'difficult'],
                message: 'Difficulty must be either easy, medium or difficult',
            },
        },
        ratingsAverage: {
            type: Number,
            default: 4.5,
            min: [1, 'Tour rating must be above 1.0'],
            max: [5, 'Tour rating must not exceed 5.0'],
            set: (val) => Math.round(val * 10) / 10,
        },
        ratingsQuantity: {
            type: Number,
            default: 0,
        },
        price: {
            type: Number,
            require: [true, 'Tour must have a price'],
        },
        priceDiscount: {
            type: Number,
            validate: {
                validator: function (val) {
                    return val < this.price;
                },
                message: 'Discount price ({VALUE}) cannot be more than regular price',
            },
        },
        summary: {
            type: String,
            trim: true,
            required: [true, 'Tour must have a summary'],
        },
        description: {
            type: String,
            required: [true, 'Tour must have a description'],
        },
        imageCover: {
            type: String,
            require: [true, 'Tour must have a cover image'],
        },
        images: [String],
        addedAt: {
            type: Date,
            default: Date.now(),
        },
        startDates: [Date],
        isSecret: {
            type: Boolean,
            default: false,
        },
        createdAt: {
            type: Date,
            default: Date.now(),
        },
        startLocation: {
            type: {
                type: String,
                default: 'Point',
                enum: ['Point'],
            },
            coordinates: [Number],
            address: String,
            description: String,
        },
        locations: [
            {
                type: {
                    type: String,
                    default: 'Point',
                    enum: ['Point'],
                },
                coordinates: [Number],
                address: String,
                description: String,
                day: Number,
            },
        ],
        guides: [
            {
                type: mongoose.Schema.ObjectId,
                ref: 'User',
            },
        ],
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    },
);

tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

tourSchema.virtual('durationWeeks').get(function () {
    return this.duration / 7;
});

tourSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'tour',
    localField: '_id',
});

// tourSchema.pre("save", async function (next) {
//     const guides = this.guides.map(async (id) => await User.findById(id));
//     this.guides = await Promise.all(guides);
//     next();
// });

tourSchema.pre('save', function (next) {
    this.slug = slugify(this.name, { lower: true });
    next();
});

// tourSchema.pre("find", function (next) {
tourSchema.pre(/^find/, function (next) {
    this.find({ isSecret: { $ne: true } });

    this.start = Date.now();
    next();
});

tourSchema.pre(/^find/, function (next) {
    this.populate({
        path: 'guides',
        select: '-__v -passwordChangedAt',
    });
    next();
});

// tourSchema.pre("aggregate", function (next) {
//     this.pipeline().unshift({
//         $match: { isSecret: { $ne: true } },
//     });
//     next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
