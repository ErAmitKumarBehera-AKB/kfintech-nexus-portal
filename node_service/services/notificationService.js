const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendEmail } = require('./sesService');
const { sendSMS } = require('./snsService');

const createNotification = async ({
    userId,
    ticketId = null,
    type,
    title,
    message,
    channels = { inApp: true, email: false, sms: false }
}, options = {}) => {
    if (!userId || !type || !title || !message) return null;

    const notification = new Notification({
        userId,
        ticketId,
        type,
        title,
        message,
        channels: {
            inApp: channels.inApp !== false,
            email: !!channels.email,
            sms: !!channels.sms
        }
    });

    await notification.save(options);

    if (channels.email || channels.sms) {
        try {
            const user = await User.findById(userId).select('email phoneNumber name').lean();
            if (channels.email && user?.email) {
                await sendEmail({
                    to: user.email,
                    subject: title,
                    message: `<p>Hello ${user.name || 'Investor'},</p><p>${message}</p>`
                });
            }
            if (channels.sms && user?.phoneNumber) {
                await sendSMS({ phoneNumber: user.phoneNumber, message });
            }
        } catch (err) {
            console.error('[Notifications] Delivery failed:', err.message);
        }
    }

    return notification;
};

module.exports = { createNotification };
