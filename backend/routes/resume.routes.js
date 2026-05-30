const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const resume = require('../controllers/resume.controller');
const { protect } = require('../middleware/auth');

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({ dest: uploadDir, limits: { fileSize: 5 * 1024 * 1024 } });

router.post('/analyze', protect, upload.single('resume'), resume.analyze);
router.get('/latest', protect, resume.getLatest);

module.exports = router;
