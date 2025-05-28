const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    getFavorites,
    addFavorite,    
    removeFavorite, 
} = require('../controllers/favoriteController'); 

router.route('/').get(protect, getFavorites);
router.post('/add', protect, addFavorite); 
router.delete('/remove/:productId', protect, removeFavorite);
module.exports = router;
