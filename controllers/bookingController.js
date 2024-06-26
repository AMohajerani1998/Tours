const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const Factory = require('./factoryHandlers');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
    // Get the tour
    const tour = await Tour.findById(req.params.tourId);

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`,
        cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
        customer_email: req.user.email,
        client_reference_id: req.params.tourId,
        mode: 'payment',
        line_items: [
            {
                price_data: {
                    product_data: {
                        name: tour.name,
                        description: tour.description,
                        images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
                    },
                    currency: 'usd',
                    unit_amount: tour.price * 100,
                },
                quantity: 1,
            },
        ],
    });

    // Send session in response
    res.status(200).json({
        status: 'success',
        session,
    });
});

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
    const { user, tour, price } = req.query;
    if (!user && !tour && !price) return next();
    await Booking.create({ user, tour, price });

    res.redirect(req.originalUrl.split('?')[0]);
});

exports.createBooking = Factory.createOne(Booking);
exports.getBookings = Factory.getAll(Booking);
exports.getSingleBooking = Factory.getOne(Booking);
exports.updateBooking = Factory.updateOne(Booking);
exports.deleteBooking = Factory.deleteOne(Booking);
