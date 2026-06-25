const mongoose = require('mongoose');

const NomineeSchema = new mongoose.Schema({
    investorProfileId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InvestorProfile',
        required: true
    },
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    relationship: {
        type: String,
        required: true,
        trim: true
    },
    allocationPercentage: {
        type: Number,
        required: true,
        min: 1,
        max: 100
    },
    dateOfBirth: {
        type: Date
    },
    panNumber: {
        type: String,
        trim: true,
        uppercase: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Nominee', NomineeSchema);
