// requires
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const app = express();

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewsRouter = require('./routes/viewsRoutes');
const bookingRouter = require('./routes/bookingRoutes');

// Global middlewares
// Serving static files
app.use(express.static(path.join(__dirname, 'public')));

// Serving templates for render
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Set cors policy
const corsOptions = {
    origin: ['*', 'http://localhost:3000'], // You can specify the allowed origin here or use a specific domain
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Allowed methods
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept'], // Allowed headers
    credentials: true, // remove later ??
};
app.use(cors(corsOptions));

// Set security http headers
const scriptSrcUrls = [
    'https://api.tiles.mapbox.com/',
    'https://api.mapbox.com/',
    'https://unpkg.com/axios/dist/axios.min.js',
    'https://js.stripe.com/v3/',
];
const styleSrcUrls = ['https://api.mapbox.com/', 'https://api.tiles.mapbox.com/', 'https://fonts.googleapis.com/'];
const connectSrcUrls = [
    'https://api.mapbox.com/',
    'https://a.tiles.mapbox.com/',
    'https://b.tiles.mapbox.com/',
    'https://events.mapbox.com/',
    'http://127.0.0.1:*',
    'ws://127.0.0.1:*',
    'ws://localhost:53509/',
];
const fontSrcUrls = ['fonts.googleapis.com', 'fonts.gstatic.com'];
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ['self', 'https://js.stripe.com/'],
                connectSrc: ["'self'", ...connectSrcUrls],
                scriptSrc: ["'self'", ...scriptSrcUrls],
                styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
                workerSrc: ["'self'", 'blob:'],
                objectSrc: [],
                imgSrc: ["'self'", 'blob:', 'data:'],
                fontSrc: ["'self'", ...fontSrcUrls],
            },
        },
    }),
);

// Development logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Limit requests from same API
const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: 'Too many requests from this IP. Please try again in an hour',
});
app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(cookieParser());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Mongo sanitizer
app.use(mongoSanitize());

// Xss sanitizer
app.use(xss());

// Prevent parameter pollution
app.use(hpp({ whitelist: ['sort', 'ratingsQuantity', 'ratingsAverage', 'maxGroupSize', 'difficulty', 'price'] }));

// Test middleware
app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    next();
});

// Routes
app.use('/', viewsRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

app.all('*', (req, res, next) => {
    next(new AppError(404, `Could not find ${req.originalUrl} on the server!`));
});

app.use(globalErrorHandler);

module.exports = app;
