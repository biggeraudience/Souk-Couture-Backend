const asyncHandler = require('../utils/asyncHandler');
const Favorite = require('../models/Favorite');
const Product = require('../models/Product'); 


const getFavorites = asyncHandler(async (req, res) => {
    const favoriteList = await Favorite.findOne({ user: req.user._id }).populate('items.product', 'name images price description');

    if (favoriteList) {
        res.json(favoriteList.items);
    } else {
        res.json([]);
    }
});


const addFavorite = asyncHandler(async (req, res) => { 
    const { productId } = req.body; 

    if (!productId) {
        res.status(400);
        throw new Error('Please provide a product ID.');
    }

    if (!require('mongoose').Types.ObjectId.isValid(productId)) {
        res.status(400);
        throw new Error('Invalid product ID format.');
    }

    const product = await Product.findById(productId);

    if (!product) {
        res.status(404);
        throw new Error('Product not found.');
    }

    let favoriteList = await Favorite.findOne({ user: req.user._id });

    if (!favoriteList) {
        favoriteList = new Favorite({
            user: req.user._id,
            items: [],
        });
    }

    const alreadyFavorited = favoriteList.items.some(
        (item) => item.product.toString() === productId
    );

    if (alreadyFavorited) {
        res.status(400);
        throw new Error('Product already in favorites.');
    }

    favoriteList.items.push({
        product: productId,
        name: product.name,
        images: product.images,
        price: product.price,
    });

    const updatedFavoriteList = await favoriteList.save();
    res.status(201).json({
        message: 'Product added to favorites',
        favorites: updatedFavoriteList.items,
    });
});


const removeFavorite = asyncHandler(async (req, res) => { 
    const { productId } = req.params;

    if (!require('mongoose').Types.ObjectId.isValid(productId)) {
        res.status(400);
        throw new Error('Invalid product ID format.');
    }

    let favoriteList = await Favorite.findOne({ user: req.user._id });

    if (!favoriteList) {
        res.status(404);
        throw new Error('Favorite list not found for this user.');
    }

    const initialItemCount = favoriteList.items.length;
    favoriteList.items = favoriteList.items.filter(
        (item) => item.product.toString() !== productId
    );

    if (favoriteList.items.length === initialItemCount) {
        res.status(404);
        throw new Error('Product not found in favorites.');
    }

    const updatedFavoriteList = await favoriteList.save();
    res.status(200).json({
        message: 'Product removed from favorites',
        favorites: updatedFavoriteList.items,
    });
});


module.exports = {
    getFavorites,
    addFavorite,    
    removeFavorite, 
};
