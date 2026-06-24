const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const adminController = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middleware/auth');

// Route: POST /api/admin/verify-document
// L1 Maker desk and Super Admins can verify investor documents
router.post('/verify-document', authenticate, authorize('ADMIN_L1', 'ADMIN_SUPER'), upload.single('file'), adminController.verifyInvestorDocument);

// Route: PUT /api/admin/escalate/:id
// L1 Maker desk and Super Admins can escalate tickets to L2
router.put('/escalate/:id', authenticate, authorize('ADMIN_L1', 'ADMIN_SUPER'), adminController.escalateTicket);

// Route: PUT /api/admin/reject/:id
// L1 Maker desk and Super Admins can reject a ticket
router.put('/reject/:id', authenticate, authorize('ADMIN_L1', 'ADMIN_SUPER'), adminController.rejectTicket);

module.exports = router;
