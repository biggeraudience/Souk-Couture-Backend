// controllers/authController.js
const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const sendEmail = require('../utils/emailService'); // Assuming this exists and works

// @desc    Register a new user (customer)
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    // Always create as 'customer' for the public registration endpoint
    const user = await User.create({
        name,
        email,
        password,
        role: 'customer',
    });

    if (user) {
        // --- Send Welcome Email ---
        const welcomeEmailSubject = 'Welcome to Souk Couture!';
        const welcomeEmailHtml = `
            <h1>Welcome to Souk Couture, ${user.name}!</h1>
            <p>Thank you for registering. We're excited to have you join our community.</p>
            <p>Start exploring our exquisite collection now!</p>
            <p><a href="${process.env.FRONTEND_URL}">Shop Now</a></p>
            <p>Best regards,<br>The Souk Couture Team</p>
        `;
        const welcomeEmailText = `Welcome to Souk Couture, ${user.name}!\nThank you for registering. Start exploring our collection now: ${process.env.FRONTEND_URL}\nBest regards,\nThe Souk Couture Team`;

        await sendEmail({
            to: user.email,
            subject: welcomeEmailSubject,
            html: welcomeEmailHtml,
            text: welcomeEmailText,
        });
        // -------------------------

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: user.generateAuthToken(),
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// @desc    Authenticate customer & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        // Ensure only customers can log in through this endpoint
        if (user.role !== 'customer') {
            res.status(403); // Forbidden
            throw new Error('Access denied. Please use the appropriate login for your role.');
        }
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: user.generateAuthToken(),
        });
    } else {
        res.status(401);
        throw new Error('Invalid email or password');
    }
});

// @desc    Register a new admin user (via secret endpoint)
// @route   POST /api/auth/admin-portal-register
// @access  Public (but URL is secret)
const registerAdmin = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400);
        throw new Error('Admin user with this email already exists.');
    }

    // IMPORTANT: This endpoint creates an 'admin' role.
    // In a production app, you might want to add extra security checks here
    // (e.g., a secret key in the request body, or only allow creation if no admins exist).
    const adminUser = await User.create({
        name,
        email,
        password,
        role: 'admin', // Explicitly set to 'admin'
    });

    if (adminUser) {
        // You might want a different welcome email for admins
        res.status(201).json({
            _id: adminUser._id,
            name: adminUser.name,
            email: adminUser.email,
            role: adminUser.role,
            token: adminUser.generateAuthToken(),
            message: 'Admin user registered successfully via secret portal.'
        });
    } else {
        res.status(400);
        throw new Error('Invalid admin user data provided.');
    }
});


// @desc    Authenticate admin & get token (via secret endpoint)
// @route   POST /api/auth/admin-portal-login
// @access  Public (but URL is secret)
const loginAdmin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        // Ensure only admins can log in through this endpoint
        if (user.role !== 'admin') {
            res.status(403); // Forbidden
            throw new Error('Access denied. This login is for administrators only.');
        }
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: user.generateAuthToken(),
        });
    } else {
        res.status(401);
        throw new Error('Invalid email or password');
    }
});

// @desc    Handle forgot password request for admins (via secret endpoint)
// @route   POST /api/auth/admin-portal-forgot-password
// @access  Public (but URL is secret)
const forgotPasswordAdmin = asyncHandler(async (req, res) => {
    const { email } = req.body;
    // TODO: Implement actual forgot password logic for admins
    // This would typically involve:
    // 1. Finding the user by email
    // 2. Checking if their role is 'admin'
    // 3. Generating a password reset token
    // 4. Sending an email with the reset link (pointing to the admin-specific reset page)
    console.log(`Admin forgot password request for: ${email}`);
    res.status(200).json({ message: 'If an admin account with that email exists, a password reset link has been sent.' });
});


const logoutUser = asyncHandler(async (req, res) => {
    // Clear cookie (if using http-only cookies)
    // res.clearCookie('jwt'); // Example if you were setting a cookie
    res.status(200).json({ message: 'Logged out successfully' });
});

module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    registerAdmin, // Export new admin functions
    loginAdmin,
    forgotPasswordAdmin,
};