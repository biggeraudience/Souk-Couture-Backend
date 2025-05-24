// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const {
    registerUser,
    loginUser,
    logoutUser,
    registerAdmin,      // New
    loginAdmin,         // New
    forgotPasswordAdmin // New
} = require('../controllers/authController');

router.post('/register', registerUser); // Public customer registration
router.post('/login', loginUser);       // Public customer login
router.post('/logout', logoutUser);     // Public logout

// --- Secret Admin Portal Routes ---
// These are the "secret" endpoints that only you should know.
// You can make the path more complex if you wish for more "secrecy".
router.post('/admin-portal-register', registerAdmin);
router.post('/admin-portal-login', loginAdmin);
router.post('/admin-portal-forgot-password', forgotPasswordAdmin);

module.exports = router;