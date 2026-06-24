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
        unique: true,
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
    }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
