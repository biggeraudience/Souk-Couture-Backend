const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Subcategory = require('../models/Subcategory'); // NEW: Import Subcategory model
const cloudinary = require('cloudinary').v2;

// @desc    Get all products (for admin view, includes archived)
// @route   GET /api/admin/products
// @access  Private/Admin
const getAdminProducts = asyncHandler(async (req, res) => {
    // Populate category and subcategory for display
    const products = await Product.find({})
        .populate('category', 'name gender')
        .populate('subcategory', 'name'); // ADDED: Populate subcategory
    res.json(products);
});

// @desc    Get single product by ID (for edit form)
// @route   GET /api/admin/products/:id
// @access  Private/Admin
const getAdminProductById = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id)
        .populate('category', 'name gender')
        .populate('subcategory', 'name'); // ADDED: Populate subcategory
    if (product) {
        res.json(product);
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
});

// @desc    Create a new product
// @route   POST /api/admin/products
// @access  Private/Admin
const createProduct = asyncHandler(async (req, res) => {
    const {
        name, description, brand, sku, categoryId, subcategory, // ADDED: subcategory
        gender, price, salePrice, isOnSale, images, stock, sizes, colors,
        materials, careInstructions, isFeatured, isArchived
    } = req.body;

    // Basic validation (updated to include subcategory in consideration for backend validation)
    if (!name || !description || !categoryId || !gender || !price || !stock || !sizes || sizes.length === 0 || !colors || colors.length === 0 || !images || images.length === 0) {
        res.status(400);
        throw new Error('Please fill all required product fields (name, description, category, gender, price, stock, sizes, colors, images).');
    }

    // Validate categoryId
    const categoryExists = await Category.findById(categoryId);
    if (!categoryExists) {
        res.status(400);
        throw new Error('Invalid category ID.');
    }

    // Backend validation for subcategory based on schema's required: true and category's structure
    // This assumes your Category model has a 'hasSubcategories' field, or a similar flag
    // to indicate if a category *must* have a subcategory.
    if (subcategory) { // If a subcategory ID is provided
        const subcategoryExists = await Subcategory.findById(subcategory);
        // Ensure the subcategory exists and belongs to the chosen category
        if (!subcategoryExists || subcategoryExists.category.toString() !== categoryId) {
            res.status(400);
            throw new Error('Invalid subcategory ID or subcategory does not belong to the selected category.');
        }
    } else { // If subcategory is NOT provided (it will be null or empty string from frontend)
        // Check if the chosen category explicitly requires a subcategory
        // IMPORTANT: Adjust `categoryExists.hasSubcategories` to your actual Category model field
        // that indicates if a subcategory is mandatory for this category.
        // If all subcategories are optional, you can remove this `else` block.
        if (categoryExists.hasSubcategories) { // Example: If your Category model dictates requirement
            res.status(400);
            throw new Error('A subcategory is required for the selected category.');
        }
    }

    const product = new Product({
        user: req.user._id, // Set the creating admin's ID
        name,
        description,
        brand,
        sku,
        category: categoryId,
        subcategory: subcategory || null, // CRITICAL: Assign subcategory here, ensuring null if not provided
        gender,
        price,
        salePrice,
        isOnSale,
        images, // Array of { url, public_id } from frontend image uploads
        stock,
        sizes,
        colors,
        materials,
        careInstructions,
        isFeatured,
        isArchived,
        rating: 0, // Initial values
        numReviews: 0,
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
});

// @desc    Update a product
// @route   PUT /api/admin/products/:id
// @access  Private/Admin
const updateProduct = asyncHandler(async (req, res) => {
    const {
        name, description, brand, sku, categoryId, subcategory, // ADDED: subcategory
        gender, price, salePrice, isOnSale, images, stock, sizes, colors,
        materials, careInstructions, isFeatured, isArchived
    } = req.body;

    const product = await Product.findById(req.params.id);

    if (product) {
        // Validate categoryId if it's being changed
        if (categoryId && categoryId !== product.category.toString()) {
            const categoryExists = await Category.findById(categoryId);
            if (!categoryExists) {
                res.status(400);
                throw new Error('Invalid category ID.');
            }
            product.category = categoryId;
        }

        // Handle subcategory update and validation
        // Ensure subcategory is sent (even if null) before proceeding
        if (subcategory !== undefined) { // Check if `subcategory` key was even sent in the body
            if (subcategory) { // If a subcategory ID is provided (not null/empty string)
                const subcategoryExists = await Subcategory.findById(subcategory);
                // Ensure the subcategory exists and belongs to the (potentially new) category
                const currentCategoryId = categoryId || product.category.toString(); // Use new category if provided, else old
                if (!subcategoryExists || subcategoryExists.category.toString() !== currentCategoryId) {
                    res.status(400);
                    throw new Error('Invalid subcategory ID or subcategory does not belong to the selected category.');
                }
                product.subcategory = subcategory; // Assign the ID
            } else { // If subcategory is explicitly null or empty string
                // Check if the chosen category (new or old) requires a subcategory
                const currentCategory = await Category.findById(categoryId || product.category.toString());
                // IMPORTANT: Adjust `currentCategory.hasSubcategories` to your actual Category model field
                if (currentCategory && currentCategory.hasSubcategories) {
                    res.status(400);
                    throw new Error('A subcategory is required for the selected category.');
                }
                product.subcategory = null; // Set to null if explicitly cleared and not required
            }
        }


        product.name = name || product.name;
        product.description = description || product.description;
        product.brand = brand !== undefined ? brand : product.brand;
        product.sku = sku !== undefined ? sku : product.sku;
        product.gender = gender || product.gender;
        product.price = price !== undefined ? price : product.price;
        product.salePrice = salePrice !== undefined ? salePrice : product.salePrice;
        product.isOnSale = isOnSale !== undefined ? isOnSale : product.isOnSale;
        product.stock = stock !== undefined ? stock : product.stock;
        product.sizes = sizes || product.sizes;
        product.colors = colors || product.colors;
        product.materials = materials || product.materials;
        product.careInstructions = careInstructions !== undefined ? careInstructions : product.careInstructions;
        product.isFeatured = isFeatured !== undefined ? isFeatured : product.isFeatured;
        product.isArchived = isArchived !== undefined ? isArchived : product.isArchived;

        // Handle images: this assumes the frontend sends the full, updated array of image objects
        if (images && Array.isArray(images)) {
            const oldImagePublicIds = product.images.map(img => img.public_id);
            const newImagePublicIds = images.map(img => img.public_id);
            const publicIdsToDelete = oldImagePublicIds.filter(id => !newImagePublicIds.includes(id));

            for (const publicId of publicIdsToDelete) {
                await cloudinary.uploader.destroy(publicId);
                console.log(`Deleted Cloudinary image: ${publicId}`);
            }
            product.images = images;
        }

        const updatedProduct = await product.save();
        res.json(updatedProduct);
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
});

// @desc    Delete a product
// @route   DELETE /api/admin/products/:id
// @access  Private/Admin
const deleteProduct = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (product) {
        for (const image of product.images) {
            await cloudinary.uploader.destroy(image.public_id);
        }
        await product.deleteOne();
        res.json({ message: 'Product and associated images removed' });
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
});

module.exports = {
    getAdminProducts,
    getAdminProductById,
    createProduct,
    updateProduct,
    deleteProduct,
};