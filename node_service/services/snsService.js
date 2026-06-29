const { PublishCommand } = require("@aws-sdk/client-sns");
const { sns } = require("../config/aws");

const twilio = require('twilio');

const sendSMS = async ({ phoneNumber, message }) => {
    // If Twilio credentials exist, use Twilio (Production Deployment)
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        try {
            const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
            const response = await client.messages.create({
                body: message,
                from: process.env.TWILIO_PHONE_NUMBER || '+1234567890',
                to: phoneNumber
            });
            console.log(`[Twilio Cloud] 📲 SMS sent to ${phoneNumber}. SID: ${response.sid}`);
            return response;
        } catch (error) {
            console.error(`[Twilio Cloud Error] Failed to send SMS to ${phoneNumber}:`, error);
            throw error;
        }
    }

    // Fallback to AWS LocalStack (Local Development)
    const params = {
        Message: message,
        PhoneNumber: phoneNumber,
    };

    try {
        const response = await sns.send(new PublishCommand(params));
        console.log(`[AWS LocalStack] 📲 SMS sent to ${phoneNumber}. MessageId: ${response.MessageId}`);
        return response;
    } catch (error) {
        console.error(`[AWS LocalStack Error] Failed to send SMS to ${phoneNumber}:`, error);
        throw error;
    }
};

module.exports = {
    sendSMS,
};
