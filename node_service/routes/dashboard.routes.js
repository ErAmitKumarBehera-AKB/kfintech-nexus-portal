const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { authenticate, authorize } = require('../middleware/auth');

// 1. Investor Dashboard 
// fetch own tickets by investorId
router.get('/investor/:id', authenticate, authorize('INVESTOR', 'ADMIN_SUPER'), dashboardController.getInvestorTickets);

// 2. L1 Maker Desk Queue
// OPEN and L1_REVIEW status tickets
router.get('/l1-queue', authenticate, authorize('ADMIN_L1', 'ADMIN_SUPER'), dashboardController.getL1Queue);

// 3. L2 Checker Desk Queue 
// L2_APPROVAL status tickets
router.get('/l2-queue', authenticate, authorize('ADMIN_L2', 'ADMIN_SUPER'), dashboardController.getL2Queue);

module.exports = router;
