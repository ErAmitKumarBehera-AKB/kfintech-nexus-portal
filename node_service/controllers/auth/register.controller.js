const userService = require('../../services/auth/user.service');
const passwordService = require('../../services/auth/password.service');
const tokenService = require('../../services/auth/token.service');
const cookieService = require('../../services/auth/cookie.service');
const User = require('../../models/User'); // Keep for creation until authService is built, or just use User directly here

exports.register = async (req, res) => {
    try {
        const { name, email, password, phoneNumber } = req.body;

        if (!name || !email || !password) return res.status(400).json({ message: 'Missing required fields.' });
        if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters.' });

        const existingUser = await userService.getUserByEmail(email);
        if (existingUser) return res.status(400).json({ message: 'Email already registered.' });

        const passwordHash = await passwordService.hashPassword(password);
        const newUser = await User.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            passwordHash,
            phoneNumber: phoneNumber?.trim(),
            role: 'INVESTOR'
        });

        const accessToken = tokenService.generateAccessToken(newUser);
        const refreshToken = await tokenService.generateRefreshToken(newUser._id);

        cookieService.setAuthCookies(res, accessToken, refreshToken);

        return res.status(201).json({ 
            message: 'Registration successful.', 
            user: userService.getPublicProfile(newUser) 
        });
    } catch (error) {
        console.error('[Auth] Register error:', error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
};