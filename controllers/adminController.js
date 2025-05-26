// adminController.js
const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Category = require('../models/Category');
const Promotion = require('../models/Promotion');
const Message = require('../models/Message');
const cloudinary = require('../config/cloudinary'); // Make sure this is imported

// @desc    Get all users (Admin)
// @route   GET /api/admin/users
// @access  Private/Admin
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

// @desc    Update user (e.g., change role, name, email) (Admin)
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

// @desc    Delete a user (Admin)
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


const createProduct = asyncHandler(async (req, res) => {
    const {
        name,
        description,
        price,
        category, // This will be the category ID from frontend
        sizes,
        colors,
        stock,
        isBespoke, // Corresponds to isFeatured in your frontend form
        images, // Array of Cloudinary URLs
        // New fields from frontend form:
        gender,
        subCategory,
        material,
        tags,
        sku,
        availability, // Corresponds to availability in your frontend form
        careInstructions,
        weight,
        dimensions,
        brand,
        countryOfOrigin,
    } = req.body;

    // Basic validation (adjust as needed based on required fields in your Product model)
    if (!name || !description || !price || !category || !stock || !images || images.length === 0) {
        res.status(400);
        throw new Error('Please fill in all required product fields and upload at least one image.');
    }

    // Find the category by ID
    const existingCategory = await Category.findById(category);
    if (!existingCategory) {
        res.status(404);
        throw new Error('Category not found');
    }

    try {
        const product = new Product({
            name,
            description,
            price,
            category: existingCategory._id,
            sizes: Array.isArray(sizes) ? sizes : sizes.split(',').map(s => s.trim()).filter(Boolean),
            colors: Array.isArray(colors) ? colors : colors.split(',').map(c => c.trim()).filter(Boolean),
            stock,
            isBespoke: isBespoke || false, // Use isFeatured from frontend as isBespoke for now
            images: images, // Cloudinary URLs
            user: req.user._id, // User who created it (admin)
            // Map additional fields from frontend form
            gender: gender,
            subCategory: subCategory || null, // Optional
            material: material || null, // Optional
            tags: Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim()).filter(Boolean), // Optional
            sku: sku || null, // Optional
            availability: availability, // Boolean
            careInstructions: careInstructions || null, // Optional
            weight: weight || null, // Optional
            dimensions: dimensions || {}, // Object {length, width, height}
            brand: brand || null, // Optional
            countryOfOrigin: countryOfOrigin || null, // Optional
        });

        const createdProduct = await product.save();
        res.status(201).json(createdProduct);
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500);
        throw new Error('Failed to create product: ' + error.message);
    }
});


const updateProduct = asyncHandler(async (req, res) => {
    const {
        name,
        description,
        price,
        category,
        sizes,
        colors,
        stock,
        isBespoke, // Corresponds to isFeatured in your frontend form
        images, // Array of Cloudinary URLs
        // New fields from frontend form:
        gender,
        subCategory,
        material,
        tags,
        sku,
        availability,
        careInstructions,
        weight,
        dimensions,
        brand,
        countryOfOrigin,
    } = req.body;

    const product = await Product.findById(req.params.id);

    if (product) {
        product.name = name || product.name;
        product.description = description || product.description;
        product.price = price !== undefined ? price : product.price;
        product.stock = stock !== undefined ? stock : product.stock;
        product.images = images || product.images; // Update images array

        // If category ID is provided, find and update
        if (category) {
            const existingCategory = await Category.findById(category);
            if (!existingCategory) {
                res.status(404);
                throw new Error('Category not found');
            }
            product.category = existingCategory._id;
        }

        // Handle array fields (convert comma-separated strings to arrays if needed)
        product.sizes = Array.isArray(sizes) ? sizes : (sizes ? sizes.split(',').map(s => s.trim()).filter(Boolean) : product.sizes);
        product.colors = Array.isArray(colors) ? colors : (colors ? colors.split(',').map(c => c.trim()).filter(Boolean) : product.colors);
        product.tags = Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : product.tags);

        // Map additional fields from frontend form
        product.isBespoke = isBespoke !== undefined ? isBespoke : product.isBespoke;
        product.gender = gender || product.gender;
        product.subCategory = subCategory || product.subCategory;
        product.material = material || product.material;
        product.sku = sku || product.sku;
        product.availability = availability !== undefined ? availability : product.availability;
        product.careInstructions = careInstructions || product.careInstructions;
        product.weight = weight !== undefined ? weight : product.weight;
        product.dimensions = dimensions || product.dimensions;
        product.brand = brand || product.brand;
        product.countryOfOrigin = countryOfOrigin || product.countryOfOrigin;


        const updatedProduct = await product.save();
        res.json(updatedProduct);
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
});


const deleteProduct = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (product) {
        // Optional: Delete images from Cloudinary before deleting product
        // This requires iterating through product.images and calling cloudinary.uploader.destroy()
        // Example:
        // for (const imageUrl of product.images) {
        //     const publicId = imageUrl.split('/').pop().split('.')[0]; // Extract public_id from URL
        //     await cloudinary.uploader.destroy(`souk-couture/products/${publicId}`);
        // }

        await product.deleteOne();
        res.json({ message: 'Product removed' });
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
});


const getAdminProducts = asyncHandler(async (req, res) => {
    // This function is for the admin's product listing page
    // It can include pagination, more detailed filters specific to admin needs
    const products = await Product.find({})
        .populate('category', 'name') // Populate category details
        .sort({ createdAt: -1 }); // Latest products first
    res.json(products);
});



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
    createProduct,
    updateProduct,
    deleteProduct,
    getAdminProducts, 
    getAllOrders,
    updateOrderStatus,
    createPromotion,
    getPromotions,
    getAllMessages,
    updateMessage,
};