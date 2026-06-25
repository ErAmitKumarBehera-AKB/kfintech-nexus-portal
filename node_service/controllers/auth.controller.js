const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendSMS } = require('../services/snsService');
const { sendEmail } = require('../services/sesService');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_dev_secret_kfintech_2026';
const JWT_EXPIRES_IN = '15m'; // Short-lived access token
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_kfintech_2026';
const JWT_REFRESH_EXPIRES_IN = '7d';

const generateTokens = (user) => {
    const payload = {
        userId: user._id.toString(),
        role: user.role,
        name: user.name,
        email: user.email
    };
    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    const refreshToken = jwt.sign({ userId: user._id.toString() }, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
    return { accessToken, refreshToken };
};

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

exports.register = async (req, res) => {
    try {
        const { name, email, password, phoneNumber } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email, and password are required.' });
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
            role: 'INVESTOR', // Default role for open registration
            isActive: true
        });

        await newUser.save();

        const { accessToken, refreshToken } = generateTokens(newUser);
        
        newUser.refreshTokens.push(refreshToken);
        await newUser.save();

        res.cookie('kfintech_refresh_token', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        return res.status(201).json({
            message: 'Registration successful.',
            accessToken,
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role
            }
        });
    } catch (error) {
        console.error('[Auth] Register error:', error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
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

        const { accessToken, refreshToken } = generateTokens(user);
        
        user.refreshTokens.push(refreshToken);
        await user.save();

        res.cookie('kfintech_refresh_token', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        return res.status(200).json({
            message: 'Login successful.',
            accessToken,
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
exports.refresh = async (req, res) => {
    try {
        const refreshToken = req.cookies.kfintech_refresh_token;
        if (!refreshToken) {
            return res.status(401).json({ message: 'Refresh token not found.' });
        }

        const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user || !user.isActive || !user.refreshTokens.includes(refreshToken)) {
            return res.status(403).json({ message: 'Invalid refresh token.' });
        }

        // Rotate tokens
        user.refreshTokens = user.refreshTokens.filter(rt => rt !== refreshToken);
        const tokens = generateTokens(user);
        
        user.refreshTokens.push(tokens.refreshToken);
        await user.save();

        res.cookie('kfintech_refresh_token', tokens.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.status(200).json({
            accessToken: tokens.accessToken
        });

    } catch (error) {
        return res.status(403).json({ message: 'Refresh token expired or invalid.' });
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
