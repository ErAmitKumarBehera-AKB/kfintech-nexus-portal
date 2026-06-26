const express = require('express');
const router = express.Router();
const l1Controller = require('../controllers/l1.controller');
const { authenticate, authorize } = require('../middleware/auth');

// Route: GET /api/l1/tickets
// L1 Queue with filtering and pagination
router.get('/tickets', authenticate, authorize('ADMIN_L1', 'ADMIN_SUPER'), l1Controller.getL1Queue);

// Route: POST /api/l1/tickets/:id/assign
// Assign ticket to current L1
router.post('/tickets/:id/assign', authenticate, authorize('ADMIN_L1', 'ADMIN_SUPER'), l1Controller.assignTicket);

// Route: POST /api/l1/tickets/:id/verify-document/:docId
// Verify a document
router.post('/tickets/:id/verify-document/:docId', authenticate, authorize('ADMIN_L1', 'ADMIN_SUPER'), l1Controller.verifyDocument);

// Route: POST /api/l1/tickets/:id/escalate
// Escalate to L2
router.post('/tickets/:id/escalate', authenticate, authorize('ADMIN_L1', 'ADMIN_SUPER'), l1Controller.escalateTicket);

// Route: POST /api/l1/tickets/:id/reject
// Reject with reason
router.post('/tickets/:id/reject', authenticate, authorize('ADMIN_L1', 'ADMIN_SUPER'), l1Controller.rejectTicket);

// Route: POST /api/l1/tickets/:id/hold
// Hold for investigation
router.post('/tickets/:id/hold', authenticate, authorize('ADMIN_L1', 'ADMIN_SUPER'), l1Controller.holdTicket);

// Route: POST /api/l1/tickets/:id/summarize
// Generate AI summary for the ticket
router.post('/tickets/:id/summarize', authenticate, authorize('ADMIN_L1', 'ADMIN_SUPER'), l1Controller.summarizeTicket);

module.exports = router;
