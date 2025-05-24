const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    getFavorites,
    addFavorite,    // Correctly import as addFavorite
    removeFavorite, // Correctly import as removeFavorite
} = require('../controllers/favoriteController'); // Path to the controller

router.route('/').get(protect, getFavorites);
router.post('/add', protect, addFavorite); // This is line 12, now expecting addFavorite
router.delete('/remove/:productId', protect, removeFavorite);
module.exports = router;
