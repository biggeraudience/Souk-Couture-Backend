const mongoose = require('mongoose');

const reviewSchema = mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
        name: { type: String, required: true },
        rating: { type: Number, required: true },
        comment: { type: String, required: true },
    },
    { timestamps: true }
);

const productSchema = mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    images: [{ type: String, required: true }], // Array of Cloudinary URLs
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    sizes: [{ type: String, required: true }], // e.g., ['S', 'M', 'L', 'XL'] or ['7', '8', '9']
    colors: [{ type: String, required: true }], // e.g., ['Black', 'Blue Denim', 'White']
    stock: { type: Number, required: true, default: 0, min: 0 }, // Overall stock, can be adjusted for variants
    isBespoke: { type: Boolean, default: false }, // For custom/bespoke items if applicable
    reviews: [reviewSchema], // Embedded reviews
    rating: { type: Number, required: true, default: 0 }, // Average rating
    numReviews: { type: Number, required: true, default: 0 }, // Count of reviews
  },
  { timestamps: true }
);

// Optional: Pre-save hook or helper for calculating average rating if reviews are updated frequently
productSchema.methods.updateAverageRating = function() {
    if (this.reviews.length > 0) {
        const totalRating = this.reviews.reduce((acc, item) => item.rating + acc, 0);
        this.rating = totalRating / this.reviews.length;
    } else {
        this.rating = 0;
    }
    this.numReviews = this.reviews.length;
};

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
