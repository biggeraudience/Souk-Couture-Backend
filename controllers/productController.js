const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Subcategory = require('../models/Subcategory');
const mongoose = require('mongoose');


const getProducts = asyncHandler(async (req, res) => {
    const { category, subcategory, gender, priceRange, sort, keyword } = req.query;
    let query = { isArchived: false }; 

    if (gender) {
        if (['men', 'women', 'unisex'].includes(gender.toLowerCase())) {
            query.gender = gender.toLowerCase(); 
        }
    }

    if (category && category !== 'All') {

        const categoryObj = await Category.findOne({ name: { $regex: new RegExp(`^${category.trim()}$`, 'i') } });
        if (categoryObj) {
            query.category = categoryObj._id;
        } else {
            query.category = null;
        }
    }

    if (subcategory && subcategory !== 'All') {
        let subcategoryToQuery = subcategory.trim();
        
        if (mongoose.Types.ObjectId.isValid(subcategoryToQuery)) {
            query.subcategory = subcategoryToQuery;
        } else {
            const subcategoryObj = await Subcategory.findOne({ name: { $regex: new RegExp(`^${subcategoryToQuery}$`, 'i') } });
            if (subcategoryObj) {
                query.subcategory = subcategoryObj._id;
            } else {
            
                query.subcategory = null;
            }
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

    console.log('Constructed MongoDB Query Filters:', query);

    if (req.query.debug === 'true') {
      const matched = await Product.find(query);
      return res.json({
        reqQuery: req.query,
        mongoQuery: query,
        matchedCount: matched.length,
      });
    }

    let products = await Product.find(query)
      .populate('category','name gender')
      .populate('subcategory','name');


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


const getProductById = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id)
        .populate('category', 'name gender')
        .populate('subcategory', 'name'); 

    if (product && !product.isArchived) { 
        res.json(product);
    } else {
        res.status(404);
        throw new Error('Product not found or not available');
    }
});


const createProduct = asyncHandler(async (req, res) => {
    const {
        name,
        description,
        brand,
        sku,
        categoryId,
        subcategory,
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
        user 
    } = req.body;


    if (!name || !description || !categoryId || !subcategory || !gender || price === undefined || stock === undefined || !sizes || sizes.length === 0 || !colors || colors.length === 0 || !images || images.length === 0) {
        res.status(400);
        throw new Error('Please fill all required product fields (name, description, category, subcategory, gender, price, stock, sizes, colors, images).');
    }


    if (!mongoose.Types.ObjectId.isValid(categoryId) || !mongoose.Types.ObjectId.isValid(subcategory)) {
        res.status(400);
        throw new Error('Invalid Category ID or Subcategory ID provided.');
    }


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
   
    if (existingSubcategory.category.toString() !== categoryId.toString()) { 
        res.status(400);
        throw new Error('Selected subcategory does not belong to the chosen category.');
    }

    const product = new Product({
        user: user, 
        name,
        description,
        brand,
        sku,
        category: categoryId,
        subcategory: subcategory, 
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


const updateProduct = asyncHandler(async (req, res) => {
    const { id } = req.params; 
    const {
        name,
        description,
        brand,
        sku,
        categoryId,
        subcategory, 
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
        user 
    } = req.body;

    const product = await Product.findById(id); 

    if (!product) {
        res.status(404);
        throw new Error('Product not found');
    }


    if (name === '' || description === '' || categoryId === '' || subcategory === '' || gender === '' || price === '' || stock === '' || sizes === '' || colors === '' || images === '') {
        res.status(400);
        throw new Error('Required product fields cannot be empty strings.');
    }

   
    if (categoryId && !mongoose.Types.ObjectId.isValid(categoryId)) {
        res.status(400);
        throw new Error('Invalid Category ID provided.');
    }
    if (subcategory && !mongoose.Types.ObjectId.isValid(subcategory)) {
        res.status(400);
        throw new Error('Invalid Subcategory ID provided.');
    }

    if (categoryId && categoryId !== product.category.toString()) { 
        const existingCategory = await Category.findById(categoryId);
        if (!existingCategory) {
            res.status(404);
            throw new Error('Category not found.');
        }
        product.category = categoryId;
    }

    if (subcategory && subcategory !== product.subcategory.toString()) { 
        const existingSubcategory = await Subcategory.findById(subcategory);
        if (!existingSubcategory) {
            res.status(404);
            throw new Error('Subcategory not found.');
        }
        const currentCategory = categoryId || product.category; 
        if (existingSubcategory.category.toString() !== currentCategory.toString()) {
            res.status(400);
            throw new Error('Selected subcategory does not belong to the chosen category.');
        }
        product.subcategory = subcategory; 
    }

    product.user = user !== undefined ? user : product.user;
    product.name = name !== undefined ? name : product.name;
    product.description = description !== undefined ? description : product.description;
    product.brand = brand !== undefined ? brand : product.brand;
    product.sku = sku !== undefined ? sku : product.sku;
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
    product.images = images !== undefined ? images : product.images;

    const updatedProduct = await product.save();
    res.json(updatedProduct);
});


const deleteProduct = asyncHandler(async (req, res) => {
    const { id } = req.params; 
    const product = await Product.findById(id);

    if (product) {
        await product.deleteOne(); 
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