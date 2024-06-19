const express = require('express');

const router = express.Router();
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');
const reviewRouter = require('./reviewRoutes');

// router.param("id", tourController.checkParam);

router.use('/:tourId/reviews', reviewRouter);

router
    .route('/stats')
    .get(
        authController.protect,
        authController.restrictTo('admin', 'lead-guide', 'guide'),
        tourController.getTourStats,
    );

router
    .route('/yearly-plan/:year')
    .get(authController.protect, authController.restrictTo('admin', 'lead-guide', 'guide'), tourController.getYearPlan);

router.route('/tours-around/:distance/center/:latlng/unit/:unit').get(tourController.getToursAround);
router.route('/tours-around/distances/:latlng/unit/:unit').get(tourController.getTourDistances);

router.route('/top-5-tours').get(tourController.getCheapTours, tourController.getAllTours);

router
    .route('/')
    .get(tourController.getAllTours)
    .post(authController.protect, authController.restrictTo('admin', 'lead-guide'), tourController.newTour);

router
    .route('/:id')
    .get(tourController.getSingleTour)
    .patch(
        authController.protect,
        authController.restrictTo('admin', 'lead-guide'),
        tourController.uploadTourImages,
        tourController.resizeTourImages,
        tourController.updateTour,
    )
    .delete(authController.protect, authController.restrictTo('admin', 'lead-guide'), tourController.deleteTour);

module.exports = router;
