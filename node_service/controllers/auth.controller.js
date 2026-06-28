const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendSMS } = require('../services/snsService');
const { sendEmail } = require('../services/sesService');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_dev_secret_kfintech_2026';
const JWT_EXPIRES_IN = '8h';

const generateAndSendOTP = async (phoneNumberOrEmail) => {
    const otp = Math.floor(100000 + Math.random() * 900000);
    console.log(`[AWS LocalStack] 📲 Sending 6-digit OTP ${otp} to ${phoneNumberOrEmail}`);

    try {
        if (phoneNumberOrEmail.includes('@')) {
            await sendEmail({
                to: phoneNumberOrEmail,
                subject: 'Your KFintech Login OTP',
                message: `<h1>Your OTP is: <strong>${otp}</strong></h1><p>Valid for 10 minutes. Do not share this with anyone.</p>`
            });
        } else {
            await sendSMS({
                phoneNumber: phoneNumberOrEmail,
                message: `Your KFintech login OTP is: ${otp}. Do not share it.`
            });
        }
    } catch (error) {
        // Non-critical: OTP send failure should not block login in dev/test
        console.error('[OTP] Failed to send OTP via AWS LocalStack:', error.message);
    }

    return otp;
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Input validation
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }

        // 2. Locate user — explicitly select passwordHash (excluded by default via select:false)
        const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash');
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        // 3. Check if account is active
        if (!user.isActive) {
            return res.status(403).json({ message: 'Account is disabled. Contact your administrator.' });
        }

        // 4. Cryptographic password verification
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        // 5. MFA Notification
        try {
            await generateAndSendOTP(user.email);
        } catch (otpErr) {
            console.warn('[OTP] Skipped OTP step:', otpErr.message);
        }

        // 6. Issue RBAC JWT token
        const payload = {
            userId: user._id.toString(),
            role: user.role,
            name: user.name,
            email: user.email
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

        return res.status(200).json({
            message: 'Login successful.',
            accessToken: token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error('[Auth] Login error:', error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
};

exports.me = async (req, res) => {
    try {
        // req.user is populated by the authenticate middleware
        const user = await User.findById(req.user.userId);
        if (!user || !user.isActive) {
            return res.status(401).json({ message: 'User not found or account disabled.' });
        }

        return res.status(200).json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('[Auth] /me error:', error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
};
exports.logout = async (req, res) => {
    return res.status(200).json({ message: 'Logged out successfully.' });
};

exports.register = async (req, res) => {
    return res.status(501).json({ message: 'Not implemented' });
};
