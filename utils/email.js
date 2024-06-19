// eslint-disable-next-line max-classes-per-file
const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

module.exports = class Email {
    constructor(user, url) {
        this.from = `Ashkan Mohajerani <${process.env.EMAIL_FROM}>`;
        this.to = user.email;
        this.url = url;
        this.firstName = user.name.split(' ')[0];
    }

    newTransporter() {
        if (process.env.NODE_ENV === 'production') {
            return nodemailer.createTransport({
                service: 'SendGrid',
                host: 'smtp.sendgrid.net',
                port: 25,
                auth: {
                    user: process.env.SENDGRID_USERNAME,
                    pass: process.env.SENDGRID_PASSWORD,
                },
            });
        }
        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD,
            },
        });
    }

    async send(template, subject) {
        // Render template
        const html = pug.renderFile(`${__dirname}/../views/emails/${template}.pug`, {
            firstName: this.firstName,
            url: this.url,
            subject,
        });
        // Set email options
        const emailOptions = {
            from: this.from,
            to: this.to,
            subject,
            html,
            text: htmlToText.convert(html),
        };
        // Create transport and send email
        await this.newTransporter().sendMail(emailOptions);
    }

    async sendWelcome() {
        await this.send('welcome', 'Welcome to the natours family!');
    }

    async sendPasswordReset() {
        await this.send('passwordReset', 'Reset your password. (Valid for only 10 minutes)');
    }
};

// const sendEmail = async (options) => {
//     const transporter = nodemailer.createTransport({
//         host: process.env.EMAIL_HOST,
//         port: process.env.EMAIL_PORT,
//         auth: {
//             user: process.env.EMAIL_USERNAME,
//             pass: process.env.EMAIL_PASSWORD,
//         },
//     });
//     const mailOptions = {
//         from: 'Ash Mohajer <ashkan.mohajerani1998@gmail.com>',
//         to: options.email,
//         subject: options.subject,
//         text: options.message,
//     };
//     await transporter.sendMail(mailOptions);
// };

// module.exports = sendEmail;
