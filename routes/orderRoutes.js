const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    createOrder,
    getUserOrders,
    getOrderById,
    updateOrderToPaid,
    // stripeWebhookHandler, // Webhook handler should be on a different route/middleware chain if raw body needed
} = require('../controllers/orderController'); // Will create this controller next

router.route('/').post(protect, createOrder).get(protect, getUserOrders);
router.route('/:id').get(protect, getOrderById);
router.route('/:id/pay').put(protect, updateOrderToPaid);

module.exports = router;
