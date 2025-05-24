const express = require('express');
const router = express.Router();
const { protect, admin } = require('../../middleware/authMiddleware');
const { getAllUsers, getUserById, updateUser, deleteUser } = require('../../controllers/adminController');

// Admin routes for users (requires admin role)
router.route('/').get(protect, admin, getAllUsers); // Get all users
router.route('/:id')
    .get(protect, admin, getUserById)  // Get single user by ID
    .put(protect, admin, updateUser)   // Update user details/role
    .delete(protect, admin, deleteUser); // Delete user

module.exports = router;
