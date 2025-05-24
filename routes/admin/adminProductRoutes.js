const express = require('express');
const router = express.Router();
const { protect, admin } = require('../../middleware/authMiddleware');
const { createProduct, updateProduct, deleteProduct } = require('../../controllers/adminController');

router.route('/')
    .post(protect, admin, createProduct);

router.route('/:id')
    .put(protect, admin, updateProduct)
    .delete(protect, admin, deleteProduct);

module.exports = router;
