const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Subcategory = require('../models/Subcategory');
const mongoose = require('mongoose');

// @desc    Fetch all products (public)
// @route   GET /api/products
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
    const { category, subcategory, gender, priceRange, sort, keyword } = req.query;
    let query = { isArchived: false }; // Base query to exclude archived products

    // --- Start of suggested filter improvements ---

    // Gender filter (already robust due to enum, but adding case-insensitivity for consistency)
    if (gender) {
        // Ensuring gender is one of the allowed values
        if (['men', 'women', 'unisex'].includes(gender.toLowerCase())) {
            query.gender = gender.toLowerCase(); // Store/query in lowercase to match enum
        }
    }

    // Category filter
    if (category && category !== 'All') {
        // Use case-insensitive regex for finding the category name
        const categoryObj = await Category.findOne({ name: { $regex: new RegExp(`^${category.trim()}$`, 'i') } });
        if (categoryObj) {
            query.category = categoryObj._id;
        } else {
            // If category not found, ensure no products match this non-existent category
            query.category = null;
        }
    }

    // Subcategory filter
    if (subcategory && subcategory !== 'All') {
        let subcategoryToQuery = subcategory.trim(); // Trim whitespace from incoming subcategory
        
        // Check if it's a valid ObjectId first (e.g., if direct ID is passed from elsewhere)
        if (mongoose.Types.ObjectId.isValid(subcategoryToQuery)) {
            // If it's a valid ObjectId, use it directly
            query.subcategory = subcategoryToQuery;
        } else {
            // If not a valid ObjectId, search by name with case-insensitivity
            const subcategoryObj = await Subcategory.findOne({ name: { $regex: new RegExp(`^${subcategoryToQuery}$`, 'i') } });
            if (subcategoryObj) {
                query.subcategory = subcategoryObj._id;
            } else {
                // If subcategory not found by name, ensure no products match
                query.subcategory = null;
            }
        }
    }
    // --- End of suggested filter improvements ---


    if (priceRange) {
        const [min, max] = priceRange.split('-').map(Number);
        if (!isNaN(min) && !isNaN(max)) {
            query.price = { $gte: min, $lte: max };
        } else if (!isNaN(min) && priceRange.endsWith('+')) {
            query.price = { $gte: min };
        }
    }

    if (keyword) {
        // Apply keyword search across name, description, brand with case-insensitivity
        query.$or = [
            { name: { $regex: keyword, $options: 'i' } },
            { description: { $regex: keyword, $options: 'i' } },
            { brand: { $regex: keyword, $options: 'i' } },
        ];
    }

    // --- Debugging logs (as per your suggestion) ---
    console.log('Constructed MongoDB Query Filters:', query);
    // console.log('Number of products matching filters:', await Product.countDocuments(query));
    // --- End Debugging logs ---
      // Debug logs
    console.log('🕵️ req.query:', req.query);
    console.log('🕵️ Mongo filters:', JSON.stringify(query));

    
    let products = await Product.find(query)
        .populate('category', 'name gender')
        .populate('subcategory', 'name');

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
    }

    res.json(products);
});

// @desc    Fetch single product (public)
// @route   GET /api/products/:id
// @access  Public
const getProductById = asyncHandler(async (req, res) => {
    // Populate both category and subcategory
    const product = await Product.findById(req.params.id)
        .populate('category', 'name gender')
        .populate('subcategory', 'name'); // Populate subcategory name

    if (product && !product.isArchived) { // Ensure it's not archived for public view
        res.json(product);
    } else {
        res.status(404);
        throw new Error('Product not found or not available');
    }
});

// @desc    Create a product (Admin only)
// @route   POST /api/admin/products
// @access  Private/Admin
const createProduct = asyncHandler(async (req, res) => {
    const {
        name,
        description,
        brand,
        sku,
        categoryId,
        subcategory, // Now directly destructuring 'subcategory'
        gender,
        price,
        salePrice,
        isOnSale,
        stock,
        sizes,
        colors,
        materials,
        careInstructions,
        isFeatured,
        isArchived,
        images,
        user // Expecting user ID from frontend now
    } = req.body;

    // Server-side validation for required fields
    if (!name || !description || !categoryId || !subcategory || !gender || price === undefined || stock === undefined || !sizes || sizes.length === 0 || !colors || colors.length === 0 || !images || images.length === 0) {
        res.status(400);
        throw new Error('Please fill all required product fields (name, description, category, subcategory, gender, price, stock, sizes, colors, images).');
    }

    // Validate categoryId and subcategory are valid MongoDB ObjectIds
    if (!mongoose.Types.ObjectId.isValid(categoryId) || !mongoose.Types.ObjectId.isValid(subcategory)) {
        res.status(400);
        throw new Error('Invalid Category ID or Subcategory ID provided.');
    }

    // Check if category and subcategory exist
    const existingCategory = await Category.findById(categoryId);
    if (!existingCategory) {
        res.status(404);
        throw new Error('Category not found.');
    }

    const existingSubcategory = await Subcategory.findById(subcategory);
    if (!existingSubcategory) {
        res.status(404);
        throw new Error('Subcategory not found.');
    }
    // Validate that the subcategory belongs to the selected category
    if (existingSubcategory.category.toString() !== categoryId.toString()) { // Ensure comparison as strings
        res.status(400);
        throw new Error('Selected subcategory does not belong to the chosen category.');
    }

    const product = new Product({
        user: user, // Use the user ID passed from frontend (adminInfo._id)
        name,
        description,
        brand,
        sku,
        category: categoryId,
        subcategory: subcategory, // Use the destructured 'subcategory' ID directly
        gender,
        price,
        salePrice,
        isOnSale,
        stock,
        sizes,
        colors,
        materials,
        careInstructions,
        isFeatured,
        isArchived,
        images,
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
});

// @desc    Update a product (Admin only)
// @route   PUT /api/admin/products/:id
// @access  Private/Admin
const updateProduct = asyncHandler(async (req, res) => {
    const { id } = req.params; // Changed from productId to id to match common express params
    const {
        name,
        description,
        brand,
        sku,
        categoryId,
        subcategory, // Now directly destructuring 'subcategory'
        gender,
        price,
        salePrice,
        isOnSale,
        stock,
        sizes,
        colors,
        materials,
        careInstructions,
        isFeatured,
        isArchived,
        images,
        user // User ID from frontend
    } = req.body;

    const product = await Product.findById(id); // Use 'id' from params

    if (!product) {
        res.status(404);
        throw new Error('Product not found');
    }

    // Server-side validation for required fields (for updates, only if they are changed)
    // If a field is being updated, it must be valid. If it's not provided, keep existing.
    if (name === '' || description === '' || categoryId === '' || subcategory === '' || gender === '' || price === '' || stock === '' || sizes === '' || colors === '' || images === '') {
        res.status(400);
        throw new Error('Required product fields cannot be empty strings.');
    }

    // Validate categoryId and subcategory if they are provided in the update payload
    if (categoryId && !mongoose.Types.ObjectId.isValid(categoryId)) {
        res.status(400);
        throw new Error('Invalid Category ID provided.');
    }
    if (subcategory && !mongoose.Types.ObjectId.isValid(subcategory)) {
        res.status(400);
        throw new Error('Invalid Subcategory ID provided.');
    }

    // Check if category and subcategory exist if they are being updated
    if (categoryId && categoryId !== product.category.toString()) { // Check if category is being changed
        const existingCategory = await Category.findById(categoryId);
        if (!existingCategory) {
            res.status(404);
            throw new Error('Category not found.');
        }
        product.category = categoryId; // Update category if valid
    }

    if (subcategory && subcategory !== product.subcategory.toString()) { // Check if subcategory is being changed
        const existingSubcategory = await Subcategory.findById(subcategory);
        if (!existingSubcategory) {
            res.status(404);
            throw new Error('Subcategory not found.');
        }
        // Validate that the new subcategory belongs to the (potentially new) category
        const currentCategory = categoryId || product.category; // Use new category if provided, else old
        if (existingSubcategory.category.toString() !== currentCategory.toString()) {
            res.status(400);
            throw new Error('Selected subcategory does not belong to the chosen category.');
        }
        product.subcategory = subcategory; // Update subcategory if valid
    }

    // Update product fields only if they are provided in the request body
    product.user = user !== undefined ? user : product.user;
    product.name = name !== undefined ? name : product.name;
    product.description = description !== undefined ? description : product.description;
    product.brand = brand !== undefined ? brand : product.brand;
    product.sku = sku !== undefined ? sku : product.sku;
    // category and subcategory are handled above
    product.gender = gender !== undefined ? gender : product.gender;
    product.price = price !== undefined ? price : product.price;
    product.salePrice = salePrice !== undefined ? salePrice : product.salePrice;
    product.isOnSale = isOnSale !== undefined ? isOnSale : product.isOnSale;
    product.stock = stock !== undefined ? stock : product.stock;
    product.sizes = sizes !== undefined ? sizes : product.sizes;
    product.colors = colors !== undefined ? colors : product.colors;
    product.materials = materials !== undefined ? materials : product.materials;
    product.careInstructions = careInstructions !== undefined ? careInstructions : product.careInstructions;
    product.isFeatured = isFeatured !== undefined ? isFeatured : product.isFeatured;
    product.isArchived = isArchived !== undefined ? isArchived : product.isArchived;
    product.images = images !== undefined ? images : product.images; // Be careful with image updates: this overwrites. Consider array merge/specific update if needed.

    const updatedProduct = await product.save();
    res.json(updatedProduct);
});

// @desc    Delete a product (Admin only)
// @route   DELETE /api/admin/products/:id
// @access  Private/Admin
const deleteProduct = asyncHandler(async (req, res) => {
    const { id } = req.params; // Changed from productId to id
    const product = await Product.findById(id);

    if (product) {
        await product.deleteOne(); // Use deleteOne() for Mongoose 5.x+
        res.json({ message: 'Product removed' });
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
});


module.exports = {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
};