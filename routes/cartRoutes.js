const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    getCart,
    addItemToCart,
    updateCartItemQuantity,
    removeItemFromCart,
    clearCart,
} = require('../controllers/cartController'); // Will create this controller next

router.route('/').get(protect, getCart);
router.post('/add', protect, addItemToCart);
router.put('/update', protect, updateCartItemQuantity);
router.delete('/remove', protect, removeItemFromCart);
router.delete('/clear', protect, clearCart);
module.exports = router;
