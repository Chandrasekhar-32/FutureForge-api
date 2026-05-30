const express = require('express');
const router = express.Router();
const dashboard = require('../controllers/dashboard.controller');
const { protect } = require('../middleware/auth');

router.get('/stats', protect, dashboard.getStats);

module.exports = router;
