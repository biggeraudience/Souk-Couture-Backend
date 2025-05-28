// controllers/authController.js
const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const sendEmail = require('../utils/emailService'); 


const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    
    const user = await User.create({
        name,
        email,
        password,
        role: 'customer',
    });

    if (user) {
        //Send Welcome Email
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


const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        // Ensure only customers can log in through this endpoint
        if (user.role !== 'customer') {
            res.status(403);
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


const registerAdmin = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400);
        throw new Error('Admin user with this email already exists.');
    }

    const adminUser = await User.create({
        name,
        email,
        password,
        role: 'admin', 
    });

    if (adminUser) {
       
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



const loginAdmin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        
        if (user.role !== 'admin') {
            res.status(403); 
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


const forgotPasswordAdmin = asyncHandler(async (req, res) => {
    const { email } = req.body;

    console.log(`Admin forgot password request for: ${email}`);
    res.status(200).json({ message: 'If an admin account with that email exists, a password reset link has been sent.' });
});


const logoutUser = asyncHandler(async (req, res) => {

    res.status(200).json({ message: 'Logged out successfully' });
});

module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    registerAdmin, 
    loginAdmin,
    forgotPasswordAdmin,
};