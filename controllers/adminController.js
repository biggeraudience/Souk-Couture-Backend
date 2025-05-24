const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
// Other models like Product, Order, Promotion, Message will be imported here too.
const Product = require('../models/Product');
const Order = require('../models/Order');
const Category = require('../models/Category');
const Promotion = require('../models/Promotion');
const Message = require('../models/Message');

//admin
const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find({}).select('-password'); // Exclude passwords
    res.json(users);
});

// @desc    Get user by ID (Admin)
// @route   GET /api/admin/users/:id
// @access  Private/Admin
const getUserById = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select('-password');
    if (user) {
        res.json(user);
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});


// @desc    Update user (e.g., change role, name, email)
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user) {
        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        user.role = req.body.role || user.role; // Allow changing role

        // Important: If changing password, hash it. For admin, consider a separate 'reset password' flow.
        if (req.body.password) {
            user.password = req.body.password; // pre-save hook handles hashing
        }

        const updatedUser = await user.save();
        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Delete a user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user) {
        if (user.role === 'admin') {
            res.status(400);
            throw new Error('Cannot delete admin user');
        }
        await user.deleteOne();
        res.json({ message: 'User removed' });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// Placeholder for other admin functions (Product, Order, etc.)
// These will be fully fleshed out in subsequent steps as we build each module.
// Example: createProduct, updateProduct, getAllOrders etc.
const createProduct = (req, res) => res.status(501).json({ message: 'createProduct not implemented yet' });
const updateProduct = (req, res) => res.status(501).json({ message: 'updateProduct not implemented yet' });
const deleteProduct = (req, res) => res.status(501).json({ message: 'deleteProduct not implemented yet' });
const getAllOrders = (req, res) => res.status(501).json({ message: 'getAllOrders not implemented yet' });
const updateOrderStatus = (req, res) => res.status(501).json({ message: 'updateOrderStatus not implemented yet' });
const createPromotion = (req, res) => res.status(501).json({ message: 'createPromotion not implemented yet' });
const getPromotions = (req, res) => res.status(501).json({ message: 'getPromotions not implemented yet' });
const getAllMessages = (req, res) => res.status(501).json({ message: 'getAllMessages not implemented yet' });
const updateMessage = (req, res) => res.status(501).json({ message: 'updateMessage not implemented yet' });


module.exports = {
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    // Export placeholders for now; will be replaced with actual implementations
    createProduct,
    updateProduct,
    deleteProduct,
    getAllOrders,
    updateOrderStatus,
    createPromotion,
    getPromotions,
    getAllMessages,
    updateMessage,
};
