const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

// Strict rate limit for login to prevent brute force
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 login requests per window
    message: { message: 'Too many login attempts from this IP, please try again after 15 minutes' }
});

// POST /api/auth/register
router.post('/register', authController.register);

// POST /api/auth/login 
router.post('/login', loginLimiter, authController.login);

// GET /api/auth/me 
router.get('/me', authenticate, authController.me);

// POST /api/auth/logout
router.post('/logout', authenticate, authController.logout);

module.exports = router;
