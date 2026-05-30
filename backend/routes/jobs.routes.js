const express = require('express');
const router = express.Router();
const jobs = require('../controllers/jobs.controller');
const { protect } = require('../middleware/auth');

router.get('/search', jobs.search);
router.post('/save', protect, jobs.saveJob);
router.get('/saved', protect, jobs.getSaved);

module.exports = router;
