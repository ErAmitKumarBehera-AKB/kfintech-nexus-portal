const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticket.controller');

// Temporary mock auth middleware
const mockAuthMiddleware = (req, res, next) => {
    req.user = { id: '60d5ecb8b392d700153f3a00', role: 'INVESTOR' }; 
    next();
};

// Route: POST /api/tickets
router.post('/', mockAuthMiddleware, ticketController.createTicket);

module.exports = router;
