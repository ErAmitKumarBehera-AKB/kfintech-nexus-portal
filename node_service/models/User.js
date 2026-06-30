const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,   // implicitly creates an index
        trim: true,
        lowercase: true
    },
    passwordHash: {
        type: String,
        required: true,
        select: false  // Never returned in queries by default
    },
    phoneNumber: {
        type: String,
        required: false,
        trim: true
    },
    role: {
        type: String,
        enum: ['INVESTOR', 'ADMIN_L1', 'ADMIN_L2', 'ADMIN_SUPER'],
        default: 'INVESTOR'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    kyc: {
        status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
        aadhaar: String,
        pan: String,
        dl: String,
        gstNumber: String
    },
    bankAccount: {
        accountNumber: String,
        ifsc: String,
        bankName: String
    },
    nominee: {
        name: String,
        relation: String,
        aadhaar: String
    },
    address: {
        street: String,
        city: String,
        state: String,
    },
       refreshTokens: {
        type: [String],
        default: []
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    otpCode: String,
    otpExpires: Date,
    dob: {
        type: String,
        trim: true
    },
    profileCompleted: {
        type: Boolean,
        default: false
    },
    twoFactorSecret: {
        type: String,
        select: false
    },
    twoFactorEnabled: {
        type: Boolean,
        default: false
    },
    twoFactorType: {
        type: String,
        enum: ['GOOGLE', 'EMAIL', 'PHONE'],
        default: 'EMAIL'
    }
}, { timestamps: true });

// --- Indexes ---
// email unique index is created by the schema field above.
// Additional indexes for frequent query patterns:
UserSchema.index({ role: 1 });                    // getAllUsers filtering by role
UserSchema.index({ role: 1, isActive: 1 });       // getAgentActivities filtering

module.exports = mongoose.model('User', UserSchema);
