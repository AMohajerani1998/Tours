const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', (err) => {
    console.log('UNCAUGHT EXCEPTION! Shutting down...');
    console.log(err.name, err.message);
    process.exit(1);
});

dotenv.config({ path: './config.env' });
const app = require('./app');

const DB = process.env.DATABASE.replace(`<PASSWORD>`, process.env.DATABASE_PASSWORD);

mongoose
    .connect(DB, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false,
    })
    .then((/*connection*/) => {
        // console.log(connection.connections);
        console.log('DB connection was successful');
    });

// console.log(process.env);

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
    console.log('Running on port 3000');
});

process.on('unhandledRejection', (err) => {
    console.log('Unhandled rejection! Shutting down...');
    console.log(err);
    server.close(() => {
        process.exit(1);
    });
});
