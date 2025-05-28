const mongoose = require('mongoose');

const favoriteItemSchema = mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Product', 
    },
 
    name: { type: String, required: true },
    images: [{ type: String }],
    price: { type: Number, required: true },
});

const favoriteSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User', 
            unique: true, 
        },
        items: [favoriteItemSchema],
    },
    { timestamps: true }
);

const Favorite = mongoose.model('Favorite', favoriteSchema);
module.exports = Favorite;
