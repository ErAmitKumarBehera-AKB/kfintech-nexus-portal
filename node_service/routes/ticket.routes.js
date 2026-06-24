const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticket.controller');
const upload = require('../middleware/upload');
const { authenticate, authorize } = require('../middleware/auth');

// Route: POST /api/tickets
// Only authenticated Investors (and Admins) can lodge tickets
router.post('/', authenticate, authorize('INVESTOR', 'ADMIN_SUPER'), upload.single('file'), ticketController.createTicket);

module.exports = router;
