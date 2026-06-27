const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { authenticate } = require('../middleware/auth.middleware');

const registerController = require('../controllers/auth/register.controller');
const loginController = require('../controllers/auth/login.controller');
const sessionController = require('../controllers/auth/session.controller');
const passwordController = require('../controllers/auth/password.controller');
const profileController = require('../controllers/auth/profile.controller');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 mins
    max: 10,
    message: { message: 'Too many login attempts. Try again later.' }
});

// Authentication Flow
router.post('/register', registerController.register);
router.post('/login', loginLimiter, loginController.initiateLogin);
router.post('/verify-otp', loginController.verifyOTP);

// Session Management
router.post('/refresh', sessionController.refresh);
router.post('/logout', sessionController.logout);
router.get('/me', authenticate, sessionController.me);

// Password Management
router.post('/forgot-password', passwordController.forgotPassword);
router.post('/reset-password', passwordController.resetPassword);
router.post('/change-password', authenticate, passwordController.changePassword);

// Profile
router.put('/profile', authenticate, profileController.updateProfile);

module.exports = router;
