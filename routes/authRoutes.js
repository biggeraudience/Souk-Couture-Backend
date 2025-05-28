const express = require('express')
const router = express.Router()
const {
  registerUser,
  loginUser,
  registerAdmin,
  loginAdmin,
  forgotPasswordAdmin,
  logoutUser
} = require('../controllers/authController')


router.post('/register', registerUser)
router.post('/login', loginUser)
router.post('/logout', logoutUser)


router.post('/admin-portal-register', registerAdmin)
router.post('/admin-portal-login',    loginAdmin)
router.post('/admin-portal-forgot-password', forgotPasswordAdmin)

module.exports = router
