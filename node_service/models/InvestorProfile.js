const mongoose = require('mongoose');

const InvestorProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    fullName: {
        type: String,
        trim: true
    },
    dateOfBirth: {
        type: Date
    },
    panNumber: {
        type: String,
        trim: true,
        uppercase: true
    },
    aadharNumber: {
        type: String,
        trim: true
    },
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: { type: String, default: 'India' }
    },
    bankDetails: {
        accountNumber: String,
        ifscCode: String,
        bankName: String
    }
}, { timestamps: true });

module.exports = mongoose.model('InvestorProfile', InvestorProfileSchema);
