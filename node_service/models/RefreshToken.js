const mongoose = require('mongoose');

const RefreshTokenSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    tokenHash: {
        type: String,
        required: true,
        unique: true
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 }
    },
    revokedAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });

module.exports = mongoose.model('RefreshToken', RefreshTokenSchema);
