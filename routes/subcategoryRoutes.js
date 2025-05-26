const express = require('express');
const router = express.Router();
const {
    getSubcategories,
    getSubcategoryById,
    createSubcategory,
    updateSubcategory,
    deleteSubcategory,
} = require('../controllers/subcategoryController');
const { protect, admin } = require('../middleware/authMiddleware'); // Assuming you have these

// Public access to view subcategories, and admin to create
router.route('/')
    .get(getSubcategories) // GET /api/subcategories?category=<categoryId>
    .post(protect, admin, createSubcategory);

// Public access to view single subcategory, admin to update/delete
router.route('/:id')
    .get(getSubcategoryById)
    .put(protect, admin, updateSubcategory)
    .delete(protect, admin, deleteSubcategory);

module.exports = router;