const asyncHandler = require('../utils/asyncHandler');
const Cart = require('../models/Cart');
const Product = require('../models/Product'); // To fetch product details and validate

// @desc    Get user's cart
// @route   GET /api/cart
// @access  Private
const getCart = asyncHandler(async (req, res) => {
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product', 'name images price');

    if (cart) {
        res.json(cart);
    } else {
        // If cart doesn't exist for the user, return an empty cart
        res.json({ user: req.user._id, items: [], totalQuantity: 0, totalPrice: 0 });
    }
});

// @desc    Add item to cart
// @route   POST /api/cart/add
// @access  Private
const addItemToCart = asyncHandler(async (req, res) => {
    const { productId, quantity, selectedSize, selectedColors } = req.body;

    if (!productId || !quantity || quantity <= 0 || !selectedSize) {
        res.status(400);
        throw new Error('Please provide productId, quantity, and selectedSize.');
    }

    const product = await Product.findById(productId);

    if (!product) {
        res.status(404);
        throw new Error('Product not found.');
    }

    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
        // Create a new cart if one doesn't exist for the user
        cart = new Cart({
            user: req.user._id,
            items: [],
            totalQuantity: 0,
            totalPrice: 0,
        });
    }

    // Check if the item already exists in the cart with the same size and colors
    const existingItemIndex = cart.items.findIndex(
        (item) =>
            item.product.toString() === productId &&
            item.selectedSize === selectedSize &&
            JSON.stringify(item.selectedColors.sort()) === JSON.stringify((selectedColors || []).sort()) // Compare colors as arrays
    );

    if (existingItemIndex > -1) {
        // Update quantity of existing item
        cart.items[existingItemIndex].quantity += quantity;
    } else {
        // Add new item to cart
        cart.items.push({
            product: productId,
            name: product.name,
            images: product.images, // Assuming products have an images array
            price: product.price,
            selectedSize,
            selectedColors: selectedColors || [],
            quantity,
        });
    }

    const updatedCart = await cart.save();
    res.status(200).json(updatedCart);
});

// @desc    Update cart item quantity
// @route   PUT /api/cart/update
// @access  Private
const updateCartItemQuantity = asyncHandler(async (req, res) => {
    const { productId, quantity, selectedSize, selectedColors } = req.body;

    if (!productId || !quantity || quantity <= 0 || !selectedSize) {
        res.status(400);
        throw new Error('Please provide productId, quantity, and selectedSize.');
    }

    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
        res.status(404);
        throw new Error('Cart not found for this user.');
    }

    const itemIndex = cart.items.findIndex(
        (item) =>
            item.product.toString() === productId &&
            item.selectedSize === selectedSize &&
            JSON.stringify(item.selectedColors.sort()) === JSON.stringify((selectedColors || []).sort())
    );

    if (itemIndex > -1) {
        cart.items[itemIndex].quantity = quantity;
        const updatedCart = await cart.save();
        res.status(200).json(updatedCart);
    } else {
        res.status(404);
        throw new Error('Item not found in cart.');
    }
});

// @desc    Remove item from cart
// @route   DELETE /api/cart/remove
// @access  Private
const removeItemFromCart = asyncHandler(async (req, res) => {
    const { productId, selectedSize, selectedColors } = req.body; // Expecting these in the body for specific item removal

    if (!productId || !selectedSize) {
        res.status(400);
        throw new Error('Please provide productId and selectedSize to remove an item.');
    }

    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
        res.status(404);
        throw new Error('Cart not found for this user.');
    }

    const initialItemCount = cart.items.length;
    cart.items = cart.items.filter(
        (item) =>
            !(
                item.product.toString() === productId &&
                item.selectedSize === selectedSize &&
                JSON.stringify(item.selectedColors.sort()) === JSON.stringify((selectedColors || []).sort())
            )
    );

    if (cart.items.length === initialItemCount) {
        res.status(404);
        throw new Error('Item not found in cart.');
    }

    const updatedCart = await cart.save();
    res.status(200).json(updatedCart);
});

// @desc    Clear user's cart
// @route   DELETE /api/cart/clear
// @access  Private
const clearCart = asyncHandler(async (req, res) => {
    const cart = await Cart.findOne({ user: req.user._id });

    if (cart) {
        cart.items = [];
        const updatedCart = await cart.save();
        res.status(200).json(updatedCart);
    } else {
        res.status(404);
        throw new Error('Cart not found for this user.');
    }
});


module.exports = {
    getCart,
    addItemToCart,
    updateCartItemQuantity,
    removeItemFromCart,
    clearCart,
};
