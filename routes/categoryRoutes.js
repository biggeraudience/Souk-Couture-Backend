const express = require('express');
const router = express.Router();
const { getCategories, createCategory, deleteCategory } = require('../controllers/categoryController');
const { protect, admin } = require('../middleware/authMiddleware'); // For admin access to create/delete

router.route('/')
    .get(getCategories) // Public access to view categories
    .post(protect, admin, createCategory); // Admin only to create categories

router.route('/:id')
    .delete(protect, admin, deleteCategory); // Admin only to delete categories

module.exports = router;