const mongoose = require('mongoose');
const fs = require('fs');
const dotenv = require('dotenv');
const Tour = require('../../models/tourModel');
const Review = require('../../models/reviewModel');
const User = require('../../models/userModel');

dotenv.config({ path: './config.env' });

const db = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);
mongoose
    .connect(db, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false,
    })
    .then(() => {
        console.log('connected to database');
    })
    .catch((err) => {
        console.log(err);
    });

const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));

const importData = async () => {
    try {
        await Tour.create(tours);
        await Review.create(reviews);
        await User.create(users, { validateBeforeSave: false });
        await console.log('Data imported successfully');
        process.exit();
    } catch (err) {
        console.log(err);
    }
};

const deleteExistingData = async () => {
    try {
        await Tour.deleteMany();
        await User.deleteMany();
        await Review.deleteMany();
        console.log('data purged seccessfuly!');
        process.exit();
    } catch (err) {
        console.log(err);
    }
};

if (process.argv[2] === '--import') {
    importData();
} else if (process.argv[2] === '--delete') {
    deleteExistingData();
}