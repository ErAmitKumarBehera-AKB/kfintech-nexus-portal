const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, message }) => {
    try {
        // If credentials are provided, use them to send a REAL email via Nodemailer
        if (process.env.SMTP_USER && process.env.SMTP_PASS) {
            const transporter = nodemailer.createTransport({
                service: 'gmail', // You can change this to your email provider
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            });

            const info = await transporter.sendMail({
                from: `"FinnovaX" <${process.env.SMTP_USER}>`,
                to,
                subject,
                html: message
            });

            console.log(`[Nodemailer] 📧 Email sent to ${to}. MessageId: ${info.messageId}`);
            return info;
        } else {
            // Safe fallback if the user forgets to set SMTP_USER in .env
            console.log('\n=========================================');
            console.log('⚠️ [Nodemailer] SMTP Credentials not found in .env!');
            console.log(`⚠️ Would have sent email to: ${to}`);
            console.log(`⚠️ Subject: ${subject}`);
            console.log('=========================================\n');
            return null;
        }
    } catch (error) {
        console.error(`[Nodemailer Error] Failed to send email to ${to}:`, error);
        throw error;
    }
};

module.exports = {
    sendEmail,
};
