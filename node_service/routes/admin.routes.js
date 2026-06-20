const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const adminController = require('../controllers/admin.controller');

// Secure Route Guard enforcing ADMIN_L1 Role
const mockAdminL1Middleware = (req, res, next) => {
    // In production, this data comes from decoding the signed JWT Token
    req.user = { id: 'usr_202', role: 'ADMIN_L1' };
    
    if (req.user.role !== 'ADMIN_L1') {
        return res.status(403).json({ message: "Forbidden Access. Requires ADMIN_L1 Maker permissions." });
    }
    next();
};

// Route: POST /api/admin/verify-document
// Injects the multer 'upload.single("file")' middleware right before the controller
router.post('/verify-document', mockAdminL1Middleware, upload.single('file'), adminController.verifyInvestorDocument);

module.exports = router;
