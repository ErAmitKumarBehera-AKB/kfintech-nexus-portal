const { SendEmailCommand } = require("@aws-sdk/client-ses");
const { ses } = require("../config/aws");

const { Resend } = require('resend');

const sendEmail = async ({ to, subject, message }) => {
    // If Resend credentials exist, use Resend (Production Deployment)
    if (process.env.RESEND_API_KEY) {
        try {
            const resend = new Resend(process.env.RESEND_API_KEY);
            const response = await resend.emails.send({
                from: process.env.RESEND_FROM_EMAIL || 'FinnovaX <onboarding@resend.dev>',
                to: [to],
                subject: subject,
                html: message
            });
            console.log(`[Resend Cloud] 📧 Email sent to ${to}. ID: ${response.data?.id}`);
            return response;
        } catch (error) {
            console.error(`[Resend Cloud Error] Failed to send email to ${to}:`, error);
            throw error;
        }
    }

    // Fallback to AWS LocalStack (Local Development)
    const params = {
        Source: process.env.SES_FROM_EMAIL || "test@example.com",
        Destination: {
            ToAddresses: [to],
        },
        Message: {
            Subject: {
                Data: subject,
            },
            Body: {
                Html: {
                    Charset: "UTF-8",
                    Data: message,
                },
            },
        },
    };

    try {
        const response = await ses.send(new SendEmailCommand(params));
        console.log(`[AWS LocalStack] 📧 Email sent to ${to}. MessageId: ${response.MessageId}`);
        return response;
    } catch (error) {
        console.error(`[AWS LocalStack Error] Failed to send email to ${to}:`, error);
        throw error;
    }
};

module.exports = {
    sendEmail,
};
