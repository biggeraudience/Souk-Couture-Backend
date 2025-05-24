const express = require('express');
const router = express.Router();
const { getCategories, getCategoryById } = require('../controllers/categoryController'); // Will create this controller next

router.route('/').get(getCategories);
router.route('/:id').get(getCategoryById);
module.exports = router;
