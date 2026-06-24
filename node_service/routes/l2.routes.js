const express = require('express');
const router = express.Router();
const l2Controller = require('../controllers/l2.controller');
const { authenticate, authorize } = require('../middleware/auth');

// Route: POST /api/l2/finalize
// Strictly enforces ADMIN_L2 Checker role (and ADMIN_SUPER)
router.post('/finalize', authenticate, authorize('ADMIN_L2', 'ADMIN_SUPER'), l2Controller.finalizeTicket);

module.exports = router;
