const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const sendEmail = require('../utils/emailService'); // Import the email service

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    const user = await User.create({
        username,
        email,
        password,
    });

    if (user) {
        // --- Send Welcome Email ---
        const welcomeEmailSubject = 'Welcome to Souk Couture!';
        const welcomeEmailHtml = `
            <h1>Welcome to Souk Couture, ${user.username}!</h1>
            <p>Thank you for registering. We're excited to have you join our community.</p>
            <p>Start exploring our exquisite collection now!</p>
            <p><a href="${process.env.FRONTEND_URL}">Shop Now</a></p>
            <p>Best regards,<br>The Souk Couture Team</p>
        `;
        const welcomeEmailText = `Welcome to Souk Couture, ${user.username}!\nThank you for registering. Start exploring our collection now: ${process.env.FRONTEND_URL}\nBest regards,\nThe Souk Couture Team`;

        await sendEmail({
            to: user.email,
            subject: welcomeEmailSubject,
            html: welcomeEmailHtml,
            text: welcomeEmailText,
        });
        // -------------------------

        res.status(201).json({
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            token: user.generateAuthToken(),
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        res.json({
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            token: user.generateAuthToken(),
        });
    } else {
        res.status(401);
        throw new Error('Invalid email or password');
    }
});

// @desc    Logout user / clear cookie (if using http-only cookies)
// @route   POST /api/auth/logout
// @access  Public
const logoutUser = asyncHandler(async (req, res) => {
  
    res.status(200).json({ message: 'Logged out successfully' });
});

module.exports = {
    registerUser,
    loginUser,
    logoutUser,
};
main