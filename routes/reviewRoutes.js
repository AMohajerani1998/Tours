const express = require('express');

const router = express.Router({ mergeParams: true });
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

router.use(authController.protect);

router
    .route('/') // tours/tourId/reviews | reviews
    .get(reviewController.getReviews)
    .post(authController.restrictTo('user'), reviewController.setTourId, reviewController.newReview);

router
    .route('/:id')
    .get(reviewController.getSingleReview)
    .patch(authController.restrictTo('admin', 'user'), reviewController.updateReview)
    .delete(authController.restrictTo('admin', 'user'), reviewController.deleteReview);

module.exports = router;
