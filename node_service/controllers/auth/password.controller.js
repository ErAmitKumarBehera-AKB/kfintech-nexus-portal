const userService = require('../../services/auth/user.service');
const passwordService = require('../../services/auth/password.service');
const tokenService = require('../../services/auth/token.service');
const cookieService = require('../../services/auth/cookie.service');
const otpService = require('../../services/auth/otp.service');

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Email is required.' });

        const user = await userService.getUserByEmail(email);
        
        // Always return success to prevent email enumeration, but only send if exists
        if (user && user.isActive) {
            await otpService.generateAndSendOTP(user);
        }

        return res.status(200).json({ message: 'If that email exists, an OTP has been sent.' });
    } catch (error) {
        console.error('[Auth] Forgot Password error:', error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        if (!email || !otp || !newPassword || newPassword.length < 8) {
            return res.status(400).json({ message: 'Email, OTP, and a new password of at least 8 characters are required.' });
        }

        const user = await userService.getUserByEmail(email);
        if (!user || !user.otpCode || user.otpExpires < Date.now()) {
            return res.status(401).json({ message: 'OTP expired or invalid.' });
        }

        const isMatch = await passwordService.comparePassword(otp, user.otpCode);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid OTP.' });
        }

        // Change password directly
        const passwordHash = await passwordService.hashPassword(newPassword);
        user.passwordHash = passwordHash;
        
        // Clear OTP
        user.otpCode = undefined;
        user.otpExpires = undefined;
        await user.save();
        
        // Revoke all sessions for security
        await tokenService.revokeAllUserTokens(user._id);

        return res.status(200).json({ message: 'Password reset successful. You can now log in.' });
    } catch (error) {
        console.error('[Auth] Reset Password error:', error);
        if (error.message.includes('invalid or has expired')) {
            return res.status(400).json({ message: error.message });
        }
        return res.status(500).json({ message: 'Internal server error.' });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword || newPassword.length < 8) {
            return res.status(400).json({ message: 'Current password and a new password of at least 8 characters are required.' });
        }

        const user = await passwordService.changePassword(req.user.id, currentPassword, newPassword);
        
        // Revoke all sessions
        await tokenService.revokeAllUserTokens(user._id);
        
        // Clear cookies for the current session
        cookieService.clearAuthCookies(res);

        return res.status(200).json({ message: 'Password changed. Please sign in again.' });
    } catch (error) {
        console.error('[Auth] Change Password error:', error);
        if (error.message.includes('incorrect') || error.message.includes('not found')) {
            return res.status(401).json({ message: error.message });
        }
        return res.status(500).json({ message: 'Internal server error.' });
    }
};
