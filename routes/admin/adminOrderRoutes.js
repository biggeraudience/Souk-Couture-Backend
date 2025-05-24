const express = require('express');
const router = express.Router();
const { protect, admin } = require('../../middleware/authMiddleware');
const { getAllOrders, updateOrderStatus } = require('../../controllers/adminController');

router.route('/')
    .get(protect, admin, getAllOrders); // Get all orders

router.route('/:id/status')
    .put(protect, admin, updateOrderStatus); // Update order status

module.exports = router;
