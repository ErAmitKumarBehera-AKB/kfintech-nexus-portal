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
        status: {
            type: String,
            enum: ['PENDING', 'VERIFIED', 'REJECTED'],
            default: 'PENDING'
        },
        uploadedAt: { type: Date, default: Date.now },
        ocrExtraction: {
            extractedText: String,
            matchVerified: Boolean,
            confidence: Number
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
    l1Notes: {
        type: String,
        default: null
    },
    revisionReason: {
        type: String,
        default: null
    },
    assignedL1: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    assignedL2: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    comments: [{
        authorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        authorRole: String,
        message: {
            type: String,
            required: true
        },
        visibility: {
            type: String,
            enum: ['INVESTOR_ADMIN', 'INTERNAL'],
            default: 'INVESTOR_ADMIN'
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    slaTimeline: {
        slaDays: { type: Number, default: 7 },
        deadline: { type: Date }
    },
    status: {
        type: String,
        enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'L1_REVIEW', 'L2_APPROVAL', 'REJECTED'],
        default: 'OPEN'
    },
    resolvedAt: {
        type: Date
    }
}, { timestamps: true });

// --- Indexes ---
// Investor dashboard: my tickets, ordered newest first
TicketSchema.index({ investorId: 1, createdAt: -1 });

// L1 queue: OPEN / IN_PROGRESS / L1_REVIEW tickets, newest first
TicketSchema.index({ status: 1, createdAt: -1 });

// L1 "assigned to me" filter
TicketSchema.index({ assignedL1: 1, status: 1 });

// Admin priority filter & fraud flag queries
TicketSchema.index({ assignedPriority: 1 });
TicketSchema.index({ isPotentialFraud: 1 });

// Admin service-type breakdown
TicketSchema.index({ serviceType: 1 });

// SLA deadline scanning (for future SLA-breach jobs)
TicketSchema.index({ 'slaTimeline.deadline': 1, status: 1 });

// AutoClose job: RESOLVED tickets ready to close
TicketSchema.index({ status: 1, resolvedAt: 1 });

module.exports = mongoose.model('Ticket', TicketSchema);
