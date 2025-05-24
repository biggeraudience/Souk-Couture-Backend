const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    initializeFlutterwavePayment,
    verifyFlutterwavePayment,
    // flutterwaveWebhookHandler // Webhook handler is imported directly in server.js
} = require('../controllers/paymentController');

// Initialize Flutterwave payment (frontend calls this to get payment link)
router.post('/flutterwave/initialize', protect, initializeFlutterwavePayment);

// Verify Flutterwave payment (frontend calls this after redirect from Flutterwave, using tx_ref)
router.get('/flutterwave/verify/:txRef', protect, verifyFlutterwavePayment);

// NOTE: The webhook route for Flutterwave is handled directly in server.js
// using `express.raw` middleware, due to its specific body parsing requirements for signature verification.
// It is NOT mounted here via `router.post`.

module.exports = router;
