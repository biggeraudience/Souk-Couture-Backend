const express = require('express');
const router = express.Router();
const { protect, admin } = require('../../middleware/authMiddleware');
const { getAllUsers, getUserById, updateUser, deleteUser } = require('../../controllers/adminController');


router.route('/').get(protect, admin, getAllUsers); 
router.route('/:id')
    .get(protect, admin, getUserById)  
    .put(protect, admin, updateUser)   
    .delete(protect, admin, deleteUser); 

module.exports = router;
