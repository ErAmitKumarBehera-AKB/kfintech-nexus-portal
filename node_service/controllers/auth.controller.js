const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const { sendSMS } = require('../services/snsService');
const { sendEmail } = require('../services/sesService');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_dev_secret_kfintech_2026';
const JWT_EXPIRES_IN = '15m';
const REFRESH_TOKEN_DAYS = 7;

const getCookieValue = (req, name) => {
    const rawCookie = req.headers.cookie || '';
    return rawCookie
        .split(';')
        .map(part => part.trim())
        .find(part => part.startsWith(`${name}=`))
        ?.split('=')
        .slice(1)
        .join('=');
};

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const publicUser = (user) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    phoneNumber: user.phoneNumber,
    role: user.role,
    kyc: user.kyc,
    bankAccount: user.bankAccount,
    nominee: user.nominee,
    address: user.address
});

const signAccessToken = (user) => jwt.sign({
    userId: user._id.toString(),
    role: user.role,
    name: user.name,
    email: user.email
}, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

const issueRefreshToken = async (res, user) => {
    const refreshToken = crypto.randomBytes(48).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_DAYS);

    await RefreshToken.create({
        userId: user._id,
        tokenHash: hashToken(refreshToken),
        expiresAt
    });

    res.cookie('kfintech_refresh_token', refreshToken, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000
    });
};

const generateAndSendOTP = async (phoneNumberOrEmail) => {
    const otp = Math.floor(100000 + Math.random() * 900000);
    console.log(`[AWS LocalStack] Sending 6-digit OTP ${otp} to ${phoneNumberOrEmail}`);

    try {
        if (phoneNumberOrEmail.includes('@')) {
            await sendEmail({
                to: phoneNumberOrEmail,
                subject: 'Your KFintech Login OTP',
                message: `<h1>Your OTP is: <strong>${otp}</strong></h1><p>Valid for 10 minutes. Do not share it.</p>`
            });
        } else {
            await sendSMS({
                phoneNumber: phoneNumberOrEmail,
                message: `Your KFintech login OTP is: ${otp}. Do not share it.`
            });
        }
    } catch (error) {
        console.error('[OTP] Failed to send OTP via AWS LocalStack:', error.message);
    }

    return otp;
};

exports.register = async (req, res) => {
    try {
        const { name, email, password, phoneNumber } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email, and password are required.' });
        }

        if (password.length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters.' });
        }

        const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered.' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const newUser = new User({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            passwordHash,
            phoneNumber: phoneNumber ? phoneNumber.trim() : undefined,
            role: 'INVESTOR',
            isActive: true
        });

        await newUser.save();
        await issueRefreshToken(res, newUser);

        return res.status(201).json({
            message: 'Registration successful.',
            accessToken: signAccessToken(newUser),
            user: publicUser(newUser)
        });
    } catch (error) {
        console.error('[Auth] Register error:', error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash');
        if (!user || !user.isActive) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        try {
            await generateAndSendOTP(user.email);
        } catch (otpErr) {
            console.warn('[OTP] Skipped OTP step:', otpErr.message);
        }

        await issueRefreshToken(res, user);

        return res.status(200).json({
            message: 'Login successful.',
            accessToken: signAccessToken(user),
            user: publicUser(user)
        });
    } catch (error) {
        console.error('[Auth] Login error:', error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
};

exports.me = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user || !user.isActive) {
            return res.status(401).json({ message: 'User not found or account disabled.' });
        }

        return res.status(200).json({ user: publicUser(user) });
    } catch (error) {
        console.error('[Auth] /me error:', error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
};

exports.refresh = async (req, res) => {
    try {
        const refreshToken = getCookieValue(req, 'kfintech_refresh_token');
        if (!refreshToken) {
            return res.status(401).json({ message: 'Refresh token missing.' });
        }

        const storedToken = await RefreshToken.findOne({
            tokenHash: hashToken(refreshToken),
            revokedAt: null,
            expiresAt: { $gt: new Date() }
        });
        if (!storedToken) {
            return res.status(401).json({ message: 'Refresh token expired or revoked.' });
        }

        const user = await User.findById(storedToken.userId);
        if (!user || !user.isActive) {
            return res.status(401).json({ message: 'User not found or disabled.' });
        }

        return res.status(200).json({
            accessToken: signAccessToken(user),
            user: publicUser(user)
        });
    } catch (error) {
        console.error('[Auth] refresh error:', error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const allowed = ['name', 'phoneNumber', 'bankAccount', 'nominee', 'address'];
        const updates = {};
        allowed.forEach(key => {
            if (req.body[key] !== undefined) updates[key] = req.body[key];
        });

        const user = await User.findByIdAndUpdate(req.user.id, updates, {
            new: true,
            runValidators: true
        });
        if (!user) return res.status(404).json({ message: 'User not found.' });

        return res.status(200).json({ message: 'Profile updated.', user: publicUser(user) });
    } catch (error) {
        console.error('[Auth] updateProfile error:', error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
};

exports.logout = async (req, res) => {
    try {
        const refreshToken = req.cookies.kfintech_refresh_token;
        if (refreshToken) {
            const decoded = jwt.decode(refreshToken);
            if (decoded && decoded.userId) {
                await User.findByIdAndUpdate(decoded.userId, {
                    $pull: { refreshTokens: refreshToken }
                });
            }
        }
        res.clearCookie('kfintech_refresh_token');
        return res.status(200).json({ message: 'Logged out successfully.' });
    } catch (error) {
        console.error('[Auth] Logout error:', error);
        res.clearCookie('kfintech_refresh_token');
        return res.status(500).json({ message: 'Error during logout.' });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword || newPassword.length < 8) {
            return res.status(400).json({ message: 'Current password and a new password of at least 8 characters are required.' });
        }

        const user = await User.findById(req.user.id).select('+passwordHash');
        if (!user) return res.status(404).json({ message: 'User not found.' });

        const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isMatch) return res.status(401).json({ message: 'Current password is incorrect.' });

        user.passwordHash = await bcrypt.hash(newPassword, 10);
        // Invalidate all sessions
        user.refreshTokens = [];
        await user.save();
        
        res.clearCookie('kfintech_refresh_token');

        return res.status(200).json({ message: 'Password changed. Please sign in again.' });
    } catch (error) {
        console.error('[Auth] changePassword error:', error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
};
