const express = require('express');
const router = express.Router();
const career = require('../controllers/career.controller');

router.get('/', career.listCareers);
router.get('/categories/list', career.getCategories);
router.get('/compare', career.compareCareers);
router.get('/:id', career.getCareer);

module.exports = router;
