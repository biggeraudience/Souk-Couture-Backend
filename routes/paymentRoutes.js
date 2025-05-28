const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    initializeFlutterwavePayment,
    verifyFlutterwavePayment,
} = require('../controllers/paymentController');

router.post('/flutterwave/initialize', protect, initializeFlutterwavePayment);

router.get('/flutterwave/verify/:txRef', protect, verifyFlutterwavePayment);



module.exports = router;
