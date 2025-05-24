const mongoose = require('mongoose');

const favoriteItemSchema = mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Product', // Reference to the Product model
    },
    // You might want to store some denormalized product data here
    // for quick display, like name, images, price, etc.
    name: { type: String, required: true },
    images: [{ type: String }],
    price: { type: Number, required: true },
});

const favoriteSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User', // Each favorite list belongs to a user
            unique: true, // Ensures a user only has one favorite list
        },
        items: [favoriteItemSchema],
    },
    { timestamps: true }
);

const Favorite = mongoose.model('Favorite', favoriteSchema);
module.exports = Favorite;
