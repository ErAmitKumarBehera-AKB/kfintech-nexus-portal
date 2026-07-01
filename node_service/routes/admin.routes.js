const express = require('express');
const router  = express.Router();
const upload  = require('../middleware/upload');
const adminController = require('../controllers/admin.controller');
const l1Controller    = require('../controllers/l1.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Route: POST /api/admin/verify-document
// L1 Maker desk and Super Admins can verify investor documents via OCR
router.post('/verify-document', authenticate, authorize('ADMIN_L1', 'ADMIN_SUPER'), upload.single('file'), adminController.verifyInvestorDocument);

// Route: PUT /api/admin/escalate/:id
// Delegates to the canonical l1Controller.escalateTicket (includes notifications + full audit log).
// The previously duplicated admin version has been removed.
router.put('/escalate/:id', authenticate, authorize('ADMIN_L1', 'ADMIN_SUPER'), l1Controller.escalateTicket);

// Route: PUT /api/admin/reject/:id
// Delegates to the canonical l1Controller.rejectTicket (includes notifications + full audit log).
// The previously duplicated admin version has been removed.
router.put('/reject/:id', authenticate, authorize('ADMIN_L1', 'ADMIN_SUPER'), l1Controller.rejectTicket);

// Route: GET /api/admin/metrics — SuperAdmin dashboard KPIs
router.get('/metrics', authenticate, authorize('ADMIN_SUPER'), adminController.getSystemMetrics);

// Route: GET /api/admin/users — SuperAdmin user management
router.get('/users', authenticate, authorize('ADMIN_SUPER'), adminController.getAllUsers);

// Route: PUT /api/admin/users/:id/status — Activate / deactivate user
router.put('/users/:id/status', authenticate, authorize('ADMIN_SUPER'), adminController.updateUserStatus);

// Route: GET /api/admin/tickets — All tickets (filtered/paginated)
router.get('/tickets', authenticate, authorize('ADMIN_SUPER'), adminController.getAllTickets);

// Route: GET /api/admin/tickets/flagged — Fraud / CRITICAL tickets
router.get('/tickets/flagged', authenticate, authorize('ADMIN_SUPER'), adminController.getFlaggedTickets);

// Route: GET /api/admin/reports/export — CSV report export
router.get('/reports/export', authenticate, authorize('ADMIN_SUPER'), adminController.exportReports);

// Route: GET /api/admin/agents/activities — L1/L2 agent audit trail (with optional ?agentId= filter)
router.get('/agents/activities', authenticate, authorize('ADMIN_SUPER'), adminController.getAgentActivities);

// Route: GET /api/admin/agents/activities/export — Download CSV (all or per-agent)
router.get('/agents/activities/export', authenticate, authorize('ADMIN_SUPER'), adminController.exportAgentActivities);

// Route: GET /api/admin/agents — List of all L1/L2 agents for dropdown
router.get('/agents', authenticate, authorize('ADMIN_SUPER'), adminController.getAgentList);

module.exports = router;
