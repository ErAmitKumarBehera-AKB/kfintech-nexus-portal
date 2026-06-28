const express = require('express');
const router = express.Router();
const voiceController = require('../controllers/voice.controller');
const upload = require('../middleware/upload');
const { authenticate } = require('../middleware/auth');

// Route: POST /api/voice/transcribe
// Any authenticated user can use the voice AI
router.post('/transcribe', authenticate, upload.single('audio_file'), voiceController.transcribe);

module.exports = router;
