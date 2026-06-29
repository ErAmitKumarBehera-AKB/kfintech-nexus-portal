const userService = require('../../services/auth/user.service');
const passwordService = require('../../services/auth/password.service');
const tokenService = require('../../services/auth/token.service');
const cookieService = require('../../services/auth/cookie.service');
const User = require('../../models/User'); // Keep for creation until authService is built, or just use User directly here
const snsService = require('../../services/snsService');
const sesService = require('../../services/sesService');

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

        // Send Welcome Email
        try {
            await sesService.sendEmail({
                to: newUser.email,
                subject: 'Welcome to FinnovaX Portal!',
                message: `
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fbfbfb; padding: 40px 20px; color: #18181b; line-height: 1.6;">
                        <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; padding: 40px; border: 1px solid #e4e4e7; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
                            <div style="text-align: center; margin-bottom: 30px;">
                                <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #18181b; letter-spacing: -0.5px;">FinnovaX</h1>
                                <div style="height: 2px; width: 40px; background-color: #18181b; margin: 15px auto;"></div>
                            </div>
                            <h2 style="color: #18181b; font-size: 20px; font-weight: 600; margin-top: 0;">Welcome, ${newUser.name}!</h2>
                            <p style="color: #52525b; font-size: 15px; margin-bottom: 24px;">Thank you for joining the FinnovaX Portal. We're thrilled to have you on board.</p>
                            <p style="color: #52525b; font-size: 15px; margin-bottom: 24px;">You can now securely log in to your dashboard to track your investments, manage your profile, and create support tickets.</p>
                            <div style="text-align: center; margin: 35px 0;">
                                <a href="http://localhost:5173/login" style="background-color: #18181b; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 15px; display: inline-block;">Go to Dashboard</a>
                            </div>
                            <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 30px 0;" />
                            <p style="color: #a1a1aa; font-size: 13px; margin: 0; text-align: center;">Need help? Reply to this email to reach our support team.</p>
                        </div>
                    </div>
                `
            });
        } catch (err) {
            console.error('Failed to send welcome email:', err);
        }

        // Send Welcome SMS if phone number exists
        if (newUser.phoneNumber) {
            try {
                await snsService.sendSMS({
                    phoneNumber: newUser.phoneNumber,
                    message: `Welcome to FinnovaX, ${newUser.name}! Your account has been successfully created.`
                });
            } catch (err) {
                console.error('Failed to send welcome SMS:', err);
            }
        }

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
