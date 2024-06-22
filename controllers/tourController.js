const multer = require('multer');
const sharp = require('sharp');

const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./factoryHandlers');

const getCheapTours = async (req, res, next) => {
    req.query.limit = 5;
    req.query.sort = '-ratingsAverage,price';
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
    next();
};

const getTourStats = catchAsync(async (req, res, next) => {
    const stats = await Tour.aggregate([
        {
            $match: { ratingsAverage: { $gte: 4.5 } },
        },
        {
            $group: {
                _id: { $toUpper: '$difficulty' },
                // _id: "$ratingsAverage",
                tourCount: { $sum: 1 },
                ratingsQuantity: { $sum: '$ratingsQuantity' },
                avgRating: { $avg: '$ratingsAverage' },
                avgPrice: { $avg: '$price' },
                minPrice: { $min: '$price' },
                maxPrice: { $max: '$price' },
            },
        },
        {
            $sort: { avgPrice: 1 /* ascending */ },
        },
        {
            $match: { _id: { $ne: 'EASY' } },
        },
    ]);
    res.status(200).json({
        status: 'success',
        data: {
            stats,
        },
    });
});

const getYearPlan = catchAsync(async (req, res, next) => {
    const year = req.params.year * 1;

    const plan = await Tour.aggregate([
        {
            $unwind: '$startDates',
        },
        {
            $match: {
                startDates: {
                    $gte: new Date(`${year}-1-1`),
                    $lte: new Date(`${year}-12-31`),
                },
            },
        },
        {
            $group: {
                _id: { $month: '$startDates' },
                tourCount: { $sum: 1 },
                tours: { $push: '$name' },
            },
        },
        {
            $addFields: {
                month: '$_id',
            },
        },
        {
            $project: {
                _id: 0,
            },
        },
        {
            $sort: {
                tourCount: -1,
            },
        },
        {
            $limit: 12,
        },
    ]);
    res.status(200).json({
        status: 200,
        data: {
            plan,
        },
    });
});

const multerStorage = multer.memoryStorage();
const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(new AppError(400, 'Please upload only Images'), false);
    }
};
const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
});
const uploadTourImages = upload.fields([
    { name: 'imageCover', maxCount: 1 },
    { name: 'images', maxCount: 3 },
]);
// upload.array('images', 3)

const resizeTourImages = catchAsync(async (req, res, next) => {
    // console.log(req.files);
    if (!req.files.imageCover || !req.files.images) return next();
    // resize imageCover
    req.body.imageCover = `tour-${req.params.id}-${Date.now()}.jpeg`;
    await sharp(req.files.imageCover[0].buffer)
        .resize(500, 500)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${req.body.imageCover}`);

    // resize images
    req.body.images = [];
    await Promise.all(
        req.files.images.map(async (file, i) => {
            const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
            await sharp(file.buffer)
                .resize(500, 500)
                .toFormat('jpeg')
                .jpeg({ quality: 90 })
                .toFile(`public/img/tours/${filename}`);
            req.body.images.push(filename);
        }),
    );
    next();
});

const getToursAround = catchAsync(async (req, res, next) => {
    const { distance, latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');
    if (!lat || !lng)
        return next(new AppError(400, 'Bad input! Please provide latitute and logitute in formt lat,lng.'));
    const radius = unit === 'ml' ? distance / 3963.2 : distance / 6378.1;
    const tours = await Tour.find({ startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } } });
    res.status(200).json({
        status: 'success',
        results: tours.length,
        data: {
            data: tours,
        },
    });
});

const getTourDistances = catchAsync(async (req, res, next) => {
    const { latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');
    if (!lat || !lng)
        return next(new AppError(400, 'Invalid input! Please provide latitute and longitute in format lat,lng'));
    const multiplier = unit === 'ml' ? 0.000621371 : 0.001;
    const distances = await Tour.aggregate([
        {
            $geoNear: {
                near: {
                    type: 'Point',
                    coordinates: [lng * 1, lat * 1],
                },
                distanceField: 'distance',
                distanceMultiplier: multiplier,
            },
        },
        {
            $project: {
                distance: 1,
                name: 1,
            },
        },
    ]);
    res.status(200).json({
        status: 'success',
        data: {
            data: distances,
        },
    });
});

const getAllTours = factory.getAll(Tour);
const newTour = factory.createOne(Tour);
const getSingleTour = factory.getOne(Tour, { path: 'reviews' }, { path: 'bookings' });
const updateTour = factory.updateOne(Tour);
const deleteTour = factory.deleteOne(Tour);

module.exports = {
    getCheapTours: getCheapTours,
    getTourStats: getTourStats,
    getYearPlan: getYearPlan,
    uploadTourImages: uploadTourImages,
    resizeTourImages: resizeTourImages,
    getToursAround: getToursAround,
    getTourDistances: getTourDistances,
    getAllTours: getAllTours,
    newTour: newTour,
    getSingleTour: getSingleTour,
    updateTour: updateTour,
    deleteTour: deleteTour,
};
