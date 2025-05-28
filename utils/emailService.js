//send email service
const { Resend } = require('resend');
const dotenv = require('dotenv');

dotenv.config(); 

const resend = new Resend(process.env.RESEND_API_KEY);
const SENDER_EMAIL = process.env.RESEND_SENDER_EMAIL;

if (!process.env.RESEND_API_KEY || !process.env.RESEND_SENDER_EMAIL) {
    console.error('RESEND_API_KEY or RESEND_SENDER_EMAIL is not set in environment variables.');

}

const sendEmail = async ({ to, subject, html, text }) => {
    if (!SENDER_EMAIL) {
        console.error('Email sending failed: SENDER_EMAIL is not configured.');
        return { success: false, message: 'Email sender not configured.' };
    }

    try {
        const { data, error } = await resend.emails.send({
            from: `Souk Couture <${SENDER_EMAIL}>`,
            to: to,
            subject: subject,
            html: html,
            text: text, 
        });

        if (error) {
            console.error('Error sending email:', error);
            return { success: false, message: error.message || 'Failed to send email' };
        }

        console.log('Email sent successfully:', data);
        return { success: true, data: data };

    } catch (err) {
        console.error('Caught exception sending email:', err);
        return { success: false, message: err.message || 'An unexpected error occurred during email sending.' };
    }
};

module.exports = sendEmail;
