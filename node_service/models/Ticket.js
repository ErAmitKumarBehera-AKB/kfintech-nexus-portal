const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema({
    investorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    complaintText: {
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
    documentName: {
        type: String,
        default: null
    },
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
    ocrExtractedText: {
        type: String,
        default: null
    },
    ocrMatchVerified: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'L1_REVIEW', 'L2_APPROVAL', 'APPROVED', 'REJECTED'],
        default: 'OPEN'
    }
}, { timestamps: true });

module.exports = mongoose.model('Ticket', TicketSchema);
