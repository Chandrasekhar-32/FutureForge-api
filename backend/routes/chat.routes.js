const express = require('express');
const router = express.Router();
const chat = require('../controllers/chat.controller');
const { protect } = require('../middleware/auth');
const { optionalAuth } = require('../middleware/optionalAuth');

router.post('/message', optionalAuth, chat.sendMessage);
router.get('/sessions', protect, chat.getSessions);

module.exports = router;
