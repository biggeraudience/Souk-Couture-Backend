const express = require('express');
const router = express.Router();
const { protect, admin } = require('../../middleware/authMiddleware');
const { createPromotion, getPromotions } = require('../../controllers/adminController');

router.route('/')
    .post(protect, admin, createPromotion) // Create a new promotion
    .get(protect, admin, getPromotions); // Get all promotions

module.exports = router;
