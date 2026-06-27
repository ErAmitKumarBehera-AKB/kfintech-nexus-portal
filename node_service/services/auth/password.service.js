const bcrypt = require('bcrypt');
const crypto = require('crypto');
const User = require('../../models/User');
const { sendEmail } = require('../sesService');

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

exports.hashPassword = async (password) => {
    return await bcrypt.hash(password, 10);
};

exports.comparePassword = async (plainPassword, hashedPassword) => {
    return await bcrypt.compare(plainPassword, hashedPassword);
};

exports.generateResetToken = async (email) => {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !user.isActive) {
        return null; // Don't throw error to prevent email enumeration
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = hashToken(resetToken);
    user.resetPasswordExpires = Date.now() + 30 * 60 * 1000; // 30 minutes
    await user.save();

    return { user, resetToken };
};

exports.sendResetEmail = async (email, resetToken) => {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    
    await sendEmail({
        to: email,
        subject: 'KFintech Password Reset',
        message: `<h1>Password Reset Request</h1><p>Click <a href="${resetUrl}">here</a> to reset your password.</p><p>This link expires in 30 minutes.</p>`
    });
};

exports.resetPasswordWithToken = async (rawToken, newPassword) => {
    const hashedToken = hashToken(rawToken);
    const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
        throw new Error('Token is invalid or has expired.');
    }

    user.passwordHash = await this.hashPassword(newPassword);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    
    // Invalidate sessions via token service (will be called by controller)
    await user.save();
    return user;
};

exports.changePassword = async (userId, currentPassword, newPassword) => {
    const user = await User.findById(userId).select('+passwordHash');
    if (!user) throw new Error('User not found.');

    const isMatch = await this.comparePassword(currentPassword, user.passwordHash);
    if (!isMatch) throw new Error('Current password is incorrect.');

    user.passwordHash = await this.hashPassword(newPassword);
    await user.save();
    return user;
};
