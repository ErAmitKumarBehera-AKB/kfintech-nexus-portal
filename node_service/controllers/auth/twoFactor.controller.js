const { generateSecret, generateURI, verify } = require('otplib');
const User = require('../../models/User');

exports.generate2FA = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Generate a random secret
        const secret = generateSecret();
        
        // Save the secret in the database (temporary, until verified)
        await User.findByIdAndUpdate(req.user.id, {
            twoFactorSecret: secret,
            twoFactorEnabled: false // explicitly false until they verify it
        });

        // Create the otpauth URI
        const appName = process.env.APP_NAME || 'FinnovaX';
        const otpauthUrl = generateURI({ issuer: appName, label: user.email, secret });

        res.status(200).json({
            success: true,
            secret,
            otpauthUrl
        });
    } catch (error) {
        console.error('Error generating 2FA:', error);
        res.status(500).json({ success: false, message: 'Server error generating 2FA' });
    }
};

exports.verify2FA = async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ success: false, message: 'Token is required' });
        }

        // Fetch user with select('+twoFactorSecret') since it is hidden by default
        const user = await User.findById(req.user.id).select('+twoFactorSecret');
        if (!user || !user.twoFactorSecret) {
            return res.status(400).json({ success: false, message: '2FA not initialized. Please generate a QR code first.' });
        }

        const isValid = verify({ token, secret: user.twoFactorSecret });

        if (isValid) {
            // Enable 2FA and set type
            user.twoFactorEnabled = true;
            user.twoFactorType = 'GOOGLE';
            await user.save();

            return res.status(200).json({
                success: true,
                message: '2FA Google authenticated successfully. OTP 2FA coming soon.'
            });
        } else {
            return res.status(400).json({ success: false, message: 'Invalid 2FA token' });
        }
    } catch (error) {
        console.error('Error verifying 2FA:', error);
        res.status(500).json({ success: false, message: 'Server error verifying 2FA' });
    }
};

const otpService = require('../../services/auth/otp.service');
const passwordService = require('../../services/auth/password.service');
const { sendEmail } = require('../../services/sesService');

exports.generateEmail2FA = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        await otpService.generateAndSendOTP(user);
        
        return res.status(200).json({
            success: true,
            message: 'OTP sent to email successfully'
        });
    } catch (error) {
        console.error('Error generating email 2FA:', error);
        res.status(500).json({ success: false, message: 'Server error generating email 2FA' });
    }
};

exports.verifyEmail2FA = async (req, res) => {
    try {
        const { otp } = req.body;
        if (!otp) {
            return res.status(400).json({ success: false, message: 'OTP is required' });
        }

        const user = await User.findById(req.user.id);
        if (!user || !user.otpCode || user.otpExpires < Date.now()) {
            return res.status(400).json({ success: false, message: 'OTP expired or invalid' });
        }

        const isMatch = await passwordService.comparePassword(otp, user.otpCode);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Invalid OTP' });
        }

        // Clear OTP state
        user.otpCode = undefined;
        user.otpExpires = undefined;
        user.twoFactorType = 'EMAIL';
        await user.save();

        // Send confirmation email asynchronously
        try {
            await sendEmail({
                to: user.email,
                subject: 'FinnovaX — 2FA Preference Updated',
                message: `
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fbfbfb; padding: 40px 20px; color: #18181b; line-height: 1.6;">
                        <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; padding: 40px; border: 1px solid #e4e4e7; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
                            <h2 style="color: #18181b; font-size: 20px; font-weight: 600; margin-top: 0;">2FA Preference Updated</h2>
                            <p style="color: #52525b; font-size: 15px; margin-bottom: 24px;">Hello ${user.name || 'Valued Investor'},</p>
                            <p style="color: #52525b; font-size: 15px; margin-bottom: 24px;">This email is to confirm that your Two-Factor Authentication preference has been successfully changed to <strong>Email (OTP)</strong>.</p>
                            <p style="color: #52525b; font-size: 15px; margin-bottom: 0;">Moving forward, all login OTPs will be sent to this email address.</p>
                        </div>
                    </div>
                `
            });
        } catch (emailError) {
            console.error('Failed to send 2FA preference update email:', emailError);
        }

        const userService = require('../../services/auth/user.service');

        return res.status(200).json({
            success: true,
            message: 'Email 2FA authenticated successfully.',
            user: userService.getPublicProfile(user)
        });
    } catch (error) {
        console.error('Error verifying email 2FA:', error);
        res.status(500).json({ success: false, message: 'Server error verifying email 2FA' });
    }
};
