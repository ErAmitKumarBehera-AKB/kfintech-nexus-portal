const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profile.controller');

// All routes are protected by verifyToken middleware in server.js
router.get('/', profileController.getProfile);
router.post('/sync', profileController.syncFromInternet);

module.exports = router;
