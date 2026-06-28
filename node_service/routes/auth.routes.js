const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');

// POST /api/auth/login 
router.post('/login', authController.login);

// POST /api/auth/register (Investor self-signup)
router.post('/register', authController.register);

// GET /api/auth/me 
router.get('/me', authenticate, authController.me);

// POST /api/auth/logout
router.post('/logout', authenticate, authController.logout);

module.exports = router;
