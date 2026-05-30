const express = require('express');
const router = express.Router();
const auth = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');

router.post('/register', auth.register);
router.post('/login', auth.login);
router.post('/google', auth.googleLogin);
router.get('/profile', protect, auth.getProfile);
router.put('/profile', protect, auth.updateProfile);

module.exports = router;
