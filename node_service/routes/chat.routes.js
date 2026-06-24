const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const { authenticate } = require('../middleware/auth');

// Route: POST /api/chat/ask
// Any authenticated user (Investor or Admin) can use the AI Chatbot
// Proxy mapped directly to the Python LLAMA 3 endpoint
router.post('/ask', authenticate, chatController.askAssistant);

module.exports = router;
