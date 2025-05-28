const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    createOrder,
    getUserOrders,
    getOrderById,
    updateOrderToPaid,
  
} = require('../controllers/orderController'); 

router.route('/').post(protect, createOrder).get(protect, getUserOrders);
router.route('/:id').get(protect, getOrderById);
router.route('/:id/pay').put(protect, updateOrderToPaid);

module.exports = router;
