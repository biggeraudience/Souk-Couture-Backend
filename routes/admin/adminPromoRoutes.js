const express = require('express');
const router = express.Router();
const { protect, admin } = require('../../middleware/authMiddleware');
const { createPromotion, getPromotions } = require('../../controllers/adminController');

router.route('/')
    .post(protect, admin, createPromotion) 
    .get(protect, admin, getPromotions); 

module.exports = router;
