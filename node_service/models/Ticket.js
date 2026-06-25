const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema({
    investorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    investorName: {
        type: String,
        default: 'Unknown Investor'
    },
    accountNumber: {
        type: String,
        default: 'Not Provided'
    },
    documents: [{
        name: String,
        fileType: String,
        size: Number,
        s3Key: String,
        uploadedAt: { type: Date, default: Date.now },
        ocrExtraction: {
            extractedText: String,
            matchVerified: Boolean
        }
    }],
    aiSentimentScore: {
        type: Number,
        default: 0
    },
    assignedPriority: {
        type: String,
        enum: ['NORMAL', 'CRITICAL'],
        default: 'NORMAL'
    },
    aiSummary: {
        type: [String],
        default: []
    },

    isPotentialFraud: {
        type: Boolean,
        default: false
    },
    serviceType: {
        type: String,
        enum: ['COMPLAINT', 'BANK_UPDATE', 'NOMINEE_UPDATE', 'ADDRESS_UPDATE', 'EMAIL_UPDATE', 'MOBILE_UPDATE', 'KYC_UPDATE'],
        default: 'COMPLAINT'
    },
    serviceMetadata: {
        type: Object,
        default: {}
    },
    l2ReturnNote: {
        type: String,
        default: null
    },
    slaTimeline: {
        slaDays: { type: Number, default: 7 },
        deadline: { type: Date }
    },
    status: {
        type: String,
        enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'L1_REVIEW', 'L2_APPROVAL', 'APPROVED', 'REJECTED'],
        default: 'OPEN'
    }
}, { timestamps: true });

module.exports = mongoose.model('Ticket', TicketSchema);
