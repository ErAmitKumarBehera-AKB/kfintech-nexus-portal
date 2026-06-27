const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const RefreshToken = require('../../models/RefreshToken');

if (!process.env.JWT_SECRET) throw new Error("FATAL: JWT_SECRET is not defined.");

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

exports.generateAccessToken = (user) => {
    return jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
    );
};

exports.generateRefreshToken = async (userId, familyId = crypto.randomUUID()) => {
    const rawToken = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await RefreshToken.create({
        userId,
        tokenHash: hashToken(rawToken),
        familyId,
        expiresAt
    });

    return rawToken;
};

exports.rotateRefreshToken = async (rawOldToken) => {
    const hashedOldToken = hashToken(rawOldToken);
    const storedToken = await RefreshToken.findOne({ tokenHash: hashedOldToken });

    if (!storedToken) throw new Error('Invalid refresh token.');

    // REPLAY ATTACK DETECTION
    if (storedToken.isRevoked) {
        // A revoked token was used again. Compromised family. Revoke ALL tokens for this user.
        await RefreshToken.updateMany({ userId: storedToken.userId }, { $set: { isRevoked: true } });
        throw new Error('Security alert: Token reuse detected. All sessions revoked.');
    }

    if (storedToken.expiresAt < new Date()) throw new Error('Refresh token expired.');

    // Valid rotation: revoke the old one, generate a new one in the same family
    storedToken.isRevoked = true;
    await storedToken.save();

    const newRefreshToken = await this.generateRefreshToken(storedToken.userId, storedToken.familyId);
    const newAccessToken = this.generateAccessToken({ _id: storedToken.userId, role: 'RESTORED' }); // Requires full user fetch ideally

    return { newAccessToken, newRefreshToken, userId: storedToken.userId };
};

exports.revokeAllUserTokens = async (userId) => {
    await RefreshToken.updateMany({ userId }, { $set: { isRevoked: true } });
};