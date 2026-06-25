const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticket.controller');
const upload = require('../middleware/upload');
const { authenticate, authorize } = require('../middleware/auth');

// Route: POST /api/tickets
// Only authenticated Investors (and Admins) can lodge tickets
router.post('/', authenticate, authorize('INVESTOR', 'ADMIN_SUPER'), upload.single('file'), ticketController.createTicket);

// Route: GET /api/tickets
// Get tickets for logged-in user
router.get('/', authenticate, ticketController.getTickets);

// Route: GET /api/tickets/:id
// Get specific ticket and timeline
router.get('/:id', authenticate, ticketController.getTicketById);

module.exports = router;
