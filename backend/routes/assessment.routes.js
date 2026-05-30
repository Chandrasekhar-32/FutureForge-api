const express = require('express');
const router = express.Router();
const assessment = require('../controllers/assessment.controller');
const { protect } = require('../middleware/auth');

router.post('/submit', protect, assessment.submitAssessment);
router.get('/latest', protect, assessment.getLatest);

module.exports = router;
