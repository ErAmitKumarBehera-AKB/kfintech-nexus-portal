const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Route: GET /api/chat/history
// Retrieve previous chat history for the authenticated user
router.get('/history', authenticate, chatController.getHistory);

// Route: POST /api/chat/ask
// Any authenticated user (Investor or Admin) can use the AI Chatbot
// Proxy mapped directly to the Python RAG endpoint
router.post('/ask', authenticate, chatController.askAssistant);

module.exports = router;
