const express = require('express');
const router = express.Router();
const roadmap = require('../controllers/roadmap.controller');
const { protect } = require('../middleware/auth');
const { optionalAuth } = require('../middleware/optionalAuth');

router.post('/generate', roadmap.generateRoadmap);
router.get('/generate', roadmap.generateRoadmap);
router.get('/custom', roadmap.getRoadmap);
router.get('/:careerId', roadmap.getRoadmap);
router.post('/progress', optionalAuth, roadmap.updateProgress);

module.exports = router;
