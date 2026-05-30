const express = require('express');
const router = express.Router();
const interview = require('../controllers/interview.controller');
const { protect } = require('../middleware/auth');

router.post('/generate', protect, interview.generate);
router.post('/answer', protect, interview.submitAnswer);
router.get('/history', protect, interview.getHistory);

module.exports = router;
