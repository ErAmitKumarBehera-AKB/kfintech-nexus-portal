const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { message: 'Too many login attempts from this IP, please try again after 15 minutes' }
});

router.post('/register', authController.register);
router.post('/login', loginLimiter, authController.login);
router.post('/refresh', authController.refresh);
router.get('/me', authenticate, authController.me);
router.put('/profile', authenticate, authController.updateProfile);

// POST /api/auth/logout
router.post('/logout', authController.logout);

// POST /api/auth/change-password
router.post('/change-password', authenticate, authController.changePassword);

module.exports = router;
