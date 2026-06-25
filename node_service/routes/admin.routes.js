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

const superAdminController = require('../controllers/superadmin.controller');

// Super Admin Only Routes
router.get('/users', authenticate, authorize('ADMIN_SUPER'), superAdminController.getUsers);
router.put('/users/:id/role', authenticate, authorize('ADMIN_SUPER'), superAdminController.changeUserRole);
router.delete('/users/:id', authenticate, authorize('ADMIN_SUPER'), superAdminController.deleteUser);
router.get('/audit-logs', authenticate, authorize('ADMIN_SUPER'), superAdminController.getAuditLogs);
router.get('/system/health', authenticate, authorize('ADMIN_SUPER'), superAdminController.getSystemHealth);
router.post('/revoke-all', authenticate, authorize('ADMIN_SUPER'), superAdminController.revokeAllSessions);

module.exports = router;
