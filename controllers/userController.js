const multer = require('multer');
const sharp = require('sharp');

const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./factoryHandlers');

// const multerStorage = multer.diskStorage({
//     destination: (req, file, cb) => cb(null, 'public/img/users'),
//     filename: (req, file, cb) => {
//         const ext = file.mimetype.split('/')[1];
//         cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//     },
// });

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(new AppError(400, 'Please upload only images.'), false);
    }
};

const resizePhoto = catchAsync(async (req, res, next) => {
    if (!req.file) return next();

    req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

    await sharp(req.file.buffer)
        .resize(500, 500)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/users/${req.file.filename}`);
    next();
});

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
});
const uploadUserPhoto = upload.single('photo');

const filterBody = (body, ...allowedFields) => {
    const filteredObj = {};
    Object.keys(body).forEach((el) => {
        if (allowedFields.includes(el)) {
            filteredObj[el] = body[el];
        }
    });
    return filteredObj;
};

const getMe = (req, res, next) => {
    req.params.id = req.user.id;
    next();
};

const updateMe = catchAsync(async (req, res, next) => {
    // Check for password in req.body
    if (req.body.password || req.body.passwordConfirm)
        return next(new AppError(400, 'This route is not for updating password. Please use /updateMyPassword'));
    // Filter the req.body fields
    const filteredBody = filterBody(req.body, 'name', 'email');
    if (req.file) {
        filteredBody.photo = req.file.filename;
    }
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
        new: true,
        runValidators: true,
    });
    res.status(200).json({
        status: 'success',
        data: { updatedUser },
    });
});

const deleteMe = catchAsync(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user.id, { isActive: false });

    res.status(204).json({
        status: 'success',
        data: null,
    });
});

const createUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message: "Route is not available. To create a user please use '/signUp'",
    });
};

const getAllUsers = factory.getAll(User);
const getUser = factory.getOne(User);
const updateUser = factory.updateOne(User);
const deleteUser = factory.deleteOne(User);

module.exports = {
    uploadUserPhoto: uploadUserPhoto,
    resizePhoto: resizePhoto,
    getAllUsers: getAllUsers,
    getMe: getMe,
    updateMe: updateMe,
    deleteMe: deleteMe,
    createUser: createUser,
    getUser: getUser,
    updateUser: updateUser,
    deleteUser: deleteUser,
};
