const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Subcategory = require('../models/Subcategory'); 
const cloudinary = require('cloudinary').v2;


const getAdminProducts = asyncHandler(async (req, res) => {
    
    const products = await Product.find({})
        .populate('category', 'name gender')
        .populate('subcategory', 'name'); 
    res.json(products);
});


const getAdminProductById = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id)
        .populate('category', 'name gender')
        .populate('subcategory', 'name'); 
    if (product) {
        res.json(product);
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
});


const createProduct = asyncHandler(async (req, res) => {
    const {
        name, description, brand, sku, categoryId, subcategory, 
        gender, price, salePrice, isOnSale, images, stock, sizes, colors,
        materials, careInstructions, isFeatured, isArchived
    } = req.body;

    
    if (!name || !description || !categoryId || !gender || !price || !stock || !sizes || sizes.length === 0 || !colors || colors.length === 0 || !images || images.length === 0) {
        res.status(400);
        throw new Error('Please fill all required product fields (name, description, category, gender, price, stock, sizes, colors, images).');
    }

    
    const categoryExists = await Category.findById(categoryId);
    if (!categoryExists) {
        res.status(400);
        throw new Error('Invalid category ID.');
    }

    
    if (subcategory) { 
        const subcategoryExists = await Subcategory.findById(subcategory);
        
        if (!subcategoryExists || subcategoryExists.category.toString() !== categoryId) {
            res.status(400);
            throw new Error('Invalid subcategory ID or subcategory does not belong to the selected category.');
        }
    } else { 
        
        if (categoryExists.hasSubcategories) {
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
        subcategory: subcategory || null, 
        gender,
        price,
        salePrice,
        isOnSale,
        images, 
        stock,
        sizes,
        colors,
        materials,
        careInstructions,
        isFeatured,
        isArchived,
        rating: 0, 
        numReviews: 0,
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
});


const updateProduct = asyncHandler(async (req, res) => {
    const {
        name, description, brand, sku, categoryId, subcategory, 
        gender, price, salePrice, isOnSale, images, stock, sizes, colors,
        materials, careInstructions, isFeatured, isArchived
    } = req.body;

    const product = await Product.findById(req.params.id);

    if (product) {
        
        if (categoryId && categoryId !== product.category.toString()) {
            const categoryExists = await Category.findById(categoryId);
            if (!categoryExists) {
                res.status(400);
                throw new Error('Invalid category ID.');
            }
            product.category = categoryId;
        }

       
        if (subcategory !== undefined) { 
            if (subcategory) { 
                const subcategoryExists = await Subcategory.findById(subcategory);
                
                const currentCategoryId = categoryId || product.category.toString();
                if (!subcategoryExists || subcategoryExists.category.toString() !== currentCategoryId) {
                    res.status(400);
                    throw new Error('Invalid subcategory ID or subcategory does not belong to the selected category.');
                }
                product.subcategory = subcategory; // Assign the ID
            } else { 
               
                const currentCategory = await Category.findById(categoryId || product.category.toString());
             
                if (currentCategory && currentCategory.hasSubcategories) {
                    res.status(400);
                    throw new Error('A subcategory is required for the selected category.');
                }
                product.subcategory = null; 
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