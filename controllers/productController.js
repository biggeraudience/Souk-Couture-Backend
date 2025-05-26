const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const Category = require('../models/Category'); // Assuming you have a Category model for category lookup
const Subcategory = require('../models/Subcategory'); // Assuming you have a Subcategory model for subcategory lookup

// @desc    Fetch all products (public)
// @route   GET /api/products
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
    // Implement filtering and sorting via query parameters here for efficiency
    const { category, subcategory, gender, priceRange, sort, keyword } = req.query; // Added subcategory to destructuring
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

    // --- ADDED: Subcategory filter ---
    if (subcategory) {
        // Assuming subcategory might come as a name or ID, try to find by name first
        const subcategoryObj = await Subcategory.findOne({ name: subcategory });
        if (subcategoryObj) {
            query.subcategory = subcategoryObj._id;
        } else {
            // If not found by name, assume it might be an ID and add it directly
            query.subcategory = subcategory;
        }
    }
    // --- END ADDED ---

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
            // --- OPTIONAL: Add subcategory name to keyword search if populated ---
            // This would require populating subcategory first, then filtering,
            // or adding a direct reference if you store subcategory name in product.
            // For now, sticking to ID-based search.
            // { 'subcategory.name': { $regex: keyword, $options: 'i' } },
            // --- END OPTIONAL ---
        ];
    }

    // Populate both category and subcategory
    let products = await Product.find(query)
        .populate('category', 'name gender')
        .populate('subcategory', 'name'); // Populate subcategory name

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

// --- ADDED: Admin-specific product controllers for create/update/delete ---
// This assumes you have separate routes for admin functionalities,
// like `/api/admin/products` as seen in your frontend.

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
        subcategory, // Renamed from subcategoryId, as per frontend transformation
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

    // --- Backend Mapping (Defense in Depth) ---
    // Even though frontend sends 'subcategory', we can still map if 'subcategoryId' comes
    // This provides resilience if other clients don't follow frontend's naming.
    // However, given your frontend sends 'subcategory', this primarily ensures it's captured.
    const finalSubcategory = subcategory || req.body.subcategoryId; // Prefer 'subcategory', fallback to 'subcategoryId'


    // Server-side validation
    if (!name || !description || !categoryId || !finalSubcategory || !gender || price === undefined || stock === undefined || !sizes || sizes.length === 0 || !colors || colors.length === 0 || !images || images.length === 0) {
        res.status(400);
        throw new Error('Please fill all required product fields (name, description, category, subcategory, gender, price, stock, sizes, colors, images).');
    }

    // Check if category and subcategory exist
    const existingCategory = await Category.findById(categoryId);
    if (!existingCategory) {
        res.status(404);
        throw new Error('Category not found');
    }

    const existingSubcategory = await Subcategory.findById(finalSubcategory);
    if (!existingSubcategory) {
        res.status(404);
        throw new Error('Subcategory not found');
    }
    // Optional: Validate that the subcategory belongs to the selected category
    if (existingSubcategory.category.toString() !== categoryId) {
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
        subcategory: finalSubcategory, // Use the mapped/validated subcategory ID
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
    const { productId } = req.params;
    const {
        name,
        description,
        brand,
        sku,
        categoryId,
        subcategory, // Renamed from subcategoryId, as per frontend transformation
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

    const product = await Product.findById(productId);

    if (!product) {
        res.status(404);
        throw new Error('Product not found');
    }

    // --- Backend Mapping (Defense in Depth) for update ---
    const finalSubcategory = subcategory || req.body.subcategoryId;

    // Perform validations similar to createProduct
    if (!name || !description || !categoryId || !finalSubcategory || !gender || price === undefined || stock === undefined || !sizes || sizes.length === 0 || !colors || colors.length === 0 || !images || images.length === 0) {
        res.status(400);
        throw new Error('Please fill all required product fields (name, description, category, subcategory, gender, price, stock, sizes, colors, images).');
    }

    const existingCategory = await Category.findById(categoryId);
    if (!existingCategory) {
        res.status(404);
        throw new Error('Category not found');
    }

    const existingSubcategory = await Subcategory.findById(finalSubcategory);
    if (!existingSubcategory) {
        res.status(404);
        throw new Error('Subcategory not found');
    }
    // Optional: Validate that the subcategory belongs to the selected category
    if (existingSubcategory.category.toString() !== categoryId) {
        res.status(400);
        throw new Error('Selected subcategory does not belong to the chosen category.');
    }


    product.user = user || product.user; // Update user if provided, else keep existing
    product.name = name || product.name;
    product.description = description || product.description;
    product.brand = brand || product.brand;
    product.sku = sku || product.sku;
    product.category = categoryId || product.category;
    product.subcategory = finalSubcategory || product.subcategory; // Update subcategory
    product.gender = gender || product.gender;
    product.price = price !== undefined ? price : product.price;
    product.salePrice = salePrice !== undefined ? salePrice : product.salePrice;
    product.isOnSale = isOnSale !== undefined ? isOnSale : product.isOnSale;
    product.stock = stock !== undefined ? stock : product.stock;
    product.sizes = sizes || product.sizes;
    product.colors = colors || product.colors;
    product.materials = materials || product.materials;
    product.careInstructions = careInstructions || product.careInstructions;
    product.isFeatured = isFeatured !== undefined ? isFeatured : product.isFeatured;
    product.isArchived = isArchived !== undefined ? isArchived : product.isArchived;
    product.images = images || product.images; // Overwrite or append based on your image handling strategy

    const updatedProduct = await product.save();
    res.json(updatedProduct);
});

// @desc    Delete a product (Admin only)
// @route   DELETE /api/admin/products/:id
// @access  Private/Admin
const deleteProduct = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const product = await Product.findById(productId);

    if (product) {
        await product.deleteOne(); // Use deleteOne()
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