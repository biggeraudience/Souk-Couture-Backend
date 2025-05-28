const mongoose = require('mongoose');

const cartItemSchema = mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Product',
    },
    name: { type: String, required: true },
    images: [{ type: String }],
    price: { type: Number, required: true },
    selectedSize: { type: String, required: true },
    selectedColors: [{ type: String }], 
    quantity: { type: Number, required: true, default: 1 },
});

const cartSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
            unique: true, 
        },
        items: [cartItemSchema],
    },
    { timestamps: true }
);


cartSchema.virtual('totalPrice').get(function() {
    return this.items.reduce((acc, item) => acc + item.quantity * item.price, 0);
});

const Cart = mongoose.model('Cart', cartSchema);
module.exports = Cart;
