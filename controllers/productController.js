const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');

// @desc    Fetch all products (public)
// @route   GET /api/products
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
    // Implement filtering and sorting via query parameters here for efficiency
    const { category, gender, priceRange, sort, keyword } = req.query;
    let query = { isArchived: false }; // Only show non-archived products publicly

    if (gender && ['men', 'women', 'unisex'].includes(gender)) {
        query.gender = gender;
    }

    if (category) {
        // You'll need to find the category ID from its name
        const categoryObj = await Category.findOne({ name: category });
        if (categoryObj) {
            query.category = categoryObj._id;
        }
    }

    if (priceRange) {
        const [min, max] = priceRange.split('-').map(Number);
        if (!isNaN(min) && !isNaN(max)) {
            query.price = { $gte: min, $lte: max };
        } else if (!isNaN(min) && priceRange.endsWith('+')) {
            query.price = { $gte: min };
        }
    }

    if (keyword) {
        query.$or = [
            { name: { $regex: keyword, $options: 'i' } },
            { description: { $regex: keyword, $options: 'i' } },
            { brand: { $regex: keyword, $options: 'i' } },
        ];
    }

    let products = await Product.find(query).populate('category', 'name gender');

    // Server-side sorting
    if (sort) {
        if (sort === 'price_asc') {
            products.sort((a, b) => a.price - b.price);
        } else if (sort === 'price_desc') {
            products.sort((a, b) => b.price - a.price);
        } else if (sort === 'name_asc') {
            products.sort((a, b) => a.name.localeCompare(b.name));
        } else if (sort === 'name_desc') {
            products.sort((a, b) => b.name.localeCompare(a.name));
        }
        // Add other sorting options as needed
    }

    res.json(products);
});

// @desc    Fetch single product (public)
// @route   GET /api/products/:id
// @access  Public
const getProductById = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id).populate('category', 'name gender');
    if (product && !product.isArchived) { // Ensure it's not archived for public view
        res.json(product);
    } else {
        res.status(404);
        throw new Error('Product not found or not available');
    }
});

module.exports = {
    getProducts,
    getProductById,
};