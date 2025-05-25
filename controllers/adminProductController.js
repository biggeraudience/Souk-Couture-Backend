const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const Category = require('../models/Category'); // To validate category IDs
const cloudinary = require('cloudinary').v2; // For deleting images

// @desc    Get all products (for admin view, includes archived)
// @route   GET /api/admin/products
// @access  Private/Admin
const getAdminProducts = asyncHandler(async (req, res) => {
    const products = await Product.find({}).populate('category', 'name gender'); // Populate category name/gender
    res.json(products);
});

// @desc    Get single product by ID (for edit form)
// @route   GET /api/admin/products/:id
// @access  Private/Admin
const getAdminProductById = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id).populate('category', 'name gender');
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
        name, description, brand, sku, categoryId, gender, price, salePrice,
        isOnSale, images, stock, sizes, colors, materials, careInstructions,
        isFeatured, isArchived
    } = req.body;

    // Basic validation
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

    const product = new Product({
        user: req.user._id, // Set the creating admin's ID
        name,
        description,
        brand,
        sku,
        category: categoryId,
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
        name, description, brand, sku, categoryId, gender, price, salePrice,
        isOnSale, images, stock, sizes, colors, materials, careInstructions,
        isFeatured, isArchived
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

        product.name = name || product.name;
        product.description = description || product.description;
        product.brand = brand !== undefined ? brand : product.brand; // Allow null/empty string
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
        // The frontend is responsible for managing additions/deletions from Cloudinary on its side
        // or sending a list of public_ids to delete here. For simplicity, we just replace.
        if (images && Array.isArray(images)) {
            // Determine images to delete from Cloudinary (if any were removed by admin)
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
        // Delete images from Cloudinary first
        for (const image of product.images) {
            await cloudinary.uploader.destroy(image.public_id);
        }
        await product.deleteOne(); // Use deleteOne() or remove()
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