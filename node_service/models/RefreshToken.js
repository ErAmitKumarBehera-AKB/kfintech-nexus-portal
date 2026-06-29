const mongoose = require('mongoose');

const RefreshTokenSchema = new mongoose.Schema({
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tokenHash: { type: String, required: true },
    familyId:  { type: String, required: true }, // Tracks rotation families for replay-attack detection
    isRevoked: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true }
}, { timestamps: true });

// --- Indexes ---
// TTL: MongoDB automatically deletes expired tokens (no manual cleanup needed)
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Primary lookup path: rotateRefreshToken() fetches by tokenHash on every request
RefreshTokenSchema.index({ tokenHash: 1 }, { unique: true });

// Bulk revocation: revokeAllUserTokens() and replay-attack family invalidation
RefreshTokenSchema.index({ userId: 1, isRevoked: 1 });

module.exports = mongoose.model('RefreshToken', RefreshTokenSchema);