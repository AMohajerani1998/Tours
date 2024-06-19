const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');
const Tour = require('../models/tourModel');

exports.getAll = (Model) =>
    catchAsync(async (req, res, next) => {
        let filter = {};
        if (req.params.tourId) {
            if (!(await Tour.findById(req.params.tourId)))
                return next(new AppError(404, 'There is no tour by that id. Please try again.'));
            filter = { tour: req.params.tourId };
        }
        const apiFeatures = new APIFeatures(Model.find(filter), req.query);
        apiFeatures.filter().sort().select().paginate();
        const documents = await apiFeatures.query;
        res.status(200).json({
            status: 'success',
            results: documents.length,
            data: {
                documents,
            },
        });
    });

exports.createOne = (Model) =>
    catchAsync(async (req, res) => {
        const document = await Model.create(req.body);
        res.status(201).json({
            status: 'success',
            data: {
                data: document,
            },
        });
    });

exports.getOne = (Model, populateOptions) =>
    catchAsync(async (req, res, next) => {
        let query = Model.findById(req.params.id);
        if (populateOptions) query = query.populate(populateOptions);
        const document = await query;
        if (!document) {
            return next(new AppError(404, 'Could not find the document!'));
        }
        res.status(200).json({
            status: 'success',
            data: {
                data: document,
            },
        });
    });

exports.updateOne = (Model) =>
    catchAsync(async (req, res, next) => {
        const document = await Model.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!document) {
            return next(new AppError(404, 'Could not find the document!'));
        }
        res.status(200).json({
            status: 'success',
            data: {
                data: document,
            },
        });
    });

exports.deleteOne = (Model) =>
    catchAsync(async (req, res, next) => {
        const docucment = await Model.findByIdAndDelete(req.params.id);
        if (!docucment) {
            return next(new AppError(404, 'Could not find any document by that ID!'));
        }
        res.status(204).json({
            status: 'success',
            data: null,
        });
    });
