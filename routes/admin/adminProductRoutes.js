// routes/admin/adminProductRoutes.js
const express = require('express');
const router = express.Router();
const { protect, admin } = require('../../middleware/authMiddleware');
const {
  getAdminProducts,
  getAdminProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../../controllers/adminProductController');

router
  .route('/')
  .get(protect, admin, getAdminProducts)
  .post(protect, admin, createProduct);

router
  .route('/:id')
  .get(protect, admin, getAdminProductById)
  .put(protect, admin, updateProduct)
  .delete(protect, admin, deleteProduct);

module.exports = router;
