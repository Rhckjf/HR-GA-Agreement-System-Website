const nodemailer = require('nodemailer');

// Create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_USER, // your email address
        pass: process.env.SMTP_PASS, // your email password or app password
    },
});

/**
 * Send an email
 * @param {string} to - Recipient email address(es)
 * @param {string} subject - Email subject
 * @param {string} html - HTML email body
 */
const sendEmail = async (to, subject, html) => {
    try {
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.log(`[MAILER] Skipping email to ${to}. SMTP credentials not configured.`);
            return false;
        }

        const info = await transporter.sendMail({
            from: `"HR-GA Agreement System" <${process.env.SMTP_USER}>`,
            to,
            subject,
            html,
        });

        console.log(`[MAILER] Message sent to ${to}: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error(`[MAILER] Error sending email to ${to}:`, error);
        return false;
    }
};

module.exports = {
    sendEmail
};
