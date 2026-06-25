const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticket.controller');
const upload = require('../middleware/upload');
const { authenticate, authorize } = require('../middleware/auth');

// Route: POST /api/tickets
// Only authenticated Investors (and Admins) can lodge tickets
router.post('/', authenticate, authorize('INVESTOR', 'ADMIN_SUPER'), upload.array('documents', 5), ticketController.createTicket);

// Route: GET /api/tickets
// Get tickets for logged-in user
router.get('/', authenticate, ticketController.getTickets);

// Route: GET /api/tickets/:id
// Get specific ticket and timeline
router.get('/:id', authenticate, ticketController.getTicketById);

// POST /api/tickets/:id/comments
router.post('/:id/comments', authenticate, ticketController.addComment);

// POST /api/tickets/:id/resubmit
router.post('/:id/resubmit', authenticate, upload.array('documents', 5), ticketController.resubmitTicket);

module.exports = router;
