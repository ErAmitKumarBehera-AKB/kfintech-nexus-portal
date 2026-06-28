const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const adminController = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Route: POST /api/admin/verify-document
// L1 Maker desk and Super Admins can verify investor documents
router.post('/verify-document', authenticate, authorize('ADMIN_L1', 'ADMIN_SUPER'), upload.single('file'), adminController.verifyInvestorDocument);

// Route: PUT /api/admin/escalate/:id
// L1 Maker desk and Super Admins can escalate tickets to L2
router.put('/escalate/:id', authenticate, authorize('ADMIN_L1', 'ADMIN_SUPER'), adminController.escalateTicket);

// Route: PUT /api/admin/reject/:id
// L1 Maker desk and Super Admins can reject a ticket
router.put('/reject/:id', authenticate, authorize('ADMIN_L1', 'ADMIN_SUPER'), adminController.rejectTicket);

// Route: GET /api/admin/metrics
// SuperAdmin dashboard metrics
router.get('/metrics', authenticate, authorize('ADMIN_SUPER'), adminController.getSystemMetrics);

// Route: GET /api/admin/users
// SuperAdmin user management
router.get('/users', authenticate, authorize('ADMIN_SUPER'), adminController.getAllUsers);

// Route: PUT /api/admin/users/:id/status
// SuperAdmin user activation/deactivation
router.put('/users/:id/status', authenticate, authorize('ADMIN_SUPER'), adminController.updateUserStatus);

// Route: GET /api/admin/tickets
// SuperAdmin all tickets
router.get('/tickets', authenticate, authorize('ADMIN_SUPER'), adminController.getAllTickets);

// Route: GET /api/admin/tickets/flagged
// SuperAdmin flagged tickets
router.get('/tickets/flagged', authenticate, authorize('ADMIN_SUPER'), adminController.getFlaggedTickets);

// Route: GET /api/admin/reports/export
// SuperAdmin export reports to CSV
router.get('/reports/export', authenticate, authorize('ADMIN_SUPER'), adminController.exportReports);

// Route: GET /api/admin/agents/activities
// SuperAdmin track L1/L2 agent activities
router.get('/agents/activities', authenticate, authorize('ADMIN_SUPER'), adminController.getAgentActivities);

module.exports = router;
