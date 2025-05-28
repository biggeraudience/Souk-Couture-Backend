// adminController.js
const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Category = require('../models/Category');
const Promotion = require('../models/Promotion');
const Message = require('../models/Message');
const cloudinary = require('../config/cloudinary'); // Make sure this is imported


const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find({}).select('-password'); // Exclude passwords
    res.json(users);
});


const getUserById = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select('-password');
    if (user) {
        res.json(user);
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});


const updateUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user) {
        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        user.role = req.body.role || user.role; 

        if (req.body.password) {
            user.password = req.body.password; 
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
        isBespoke, 
        images, // Array of Cloudinary URLs
        
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
            isBespoke: isBespoke || false,
            images: images, 
            user: req.user._id, 
            
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
        isBespoke, 
        images, 
        
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

       
        if (category) {
            const existingCategory = await Category.findById(category);
            if (!existingCategory) {
                res.status(404);
                throw new Error('Category not found');
            }
            product.category = existingCategory._id;
        }

        
        product.sizes = Array.isArray(sizes) ? sizes : (sizes ? sizes.split(',').map(s => s.trim()).filter(Boolean) : product.sizes);
        product.colors = Array.isArray(colors) ? colors : (colors ? colors.split(',').map(c => c.trim()).filter(Boolean) : product.colors);
        product.tags = Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : product.tags);

      
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
       

        await product.deleteOne();
        res.json({ message: 'Product removed' });
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
});


const getAdminProducts = asyncHandler(async (req, res) => {
    
    const products = await Product.find({})
        .populate('category', 'name') // Populate category details
        .sort({ createdAt: -1 }); 
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