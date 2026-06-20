const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    passwordHash: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String,
        required: false,
        trim: true
    },
    role: {
        type: String,
        enum: ['INVESTOR', 'ADMIN_L1', 'ADMIN_L2'],
        default: 'INVESTOR'
    }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
