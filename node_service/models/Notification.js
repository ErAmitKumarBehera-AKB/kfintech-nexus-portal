const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    ticketId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ticket',
        default: null,
        index: true
    },
    type: {
        type: String,
        enum: [
            'TICKET_CREATED',
            'STATUS_CHANGED',
            'DOCUMENT_REJECTED',
            'SLA_WARNING',
            'TICKET_RESOLVED',
            'TICKET_REJECTED',
            'RETURNED_TO_L1',
            'FRAUD_HOLD',
            'COMMENT_ADDED'
        ],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    channels: {
        inApp: { type: Boolean, default: true },
        email: { type: Boolean, default: false },
        sms: { type: Boolean, default: false }
    },
    readAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);
