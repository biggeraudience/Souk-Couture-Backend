const express = require('express');
const router = express.Router();
const {
    createProduct,
    updateProduct,
    deleteProduct,
    getAdminProducts // Import the new function
} = require('../../controllers/adminController');
const { protect, admin } = require('../../middleware/authMiddleware');

router.route('/')
    .get(protect, admin, getAdminProducts) // Admin only to get all products for management
    .post(protect, admin, createProduct);

router.route('/:id')
    .put(protect, admin, updateProduct)
    .delete(protect, admin, deleteProduct);

module.exports = router;