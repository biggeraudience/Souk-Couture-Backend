const mongoose = require('mongoose');

const productSchema = mongoose.Schema(
  {
    user: { // The admin who created the product
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    brand: {
      type: String,
      required: false, // Make optional if some products don't have a specific brand
    },
    sku: { // Stock Keeping Unit - unique identifier for tracking
      type: String,
      unique: true,
      sparse: true, // Allows null values, so products without SKU won't cause error
      required: false,
    },
    category: { // Reference to Category model
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Category',
    },
    gender: { // Crucial for filtering categories and products
      type: String,
      enum: ['men', 'women', 'unisex'],
      required: true,
    },
    price: {
      type: Number,
      required: true,
      default: 0,
    },
    salePrice: { // Optional: for sales/discounts
      type: Number,
      default: null,
    },
    isOnSale: {
      type: Boolean,
      default: false,
    },
    images: [ // Array of Cloudinary URLs
      {
        url: { type: String, required: true },
        public_id: { type: String, required: true },
      },
    ],
    // You might want a 'thumbnail' or 'mainImage' field if you need a specific one for product cards
    // mainImage: { url: String, public_id: String },
    stock: {
      type: Number,
      required: true,
      default: 0,
    },
    sizes: [ // Array of available sizes (e.g., ['S', 'M', 'L'] or ['7', '8', '9'])
      {
        type: String,
        required: true,
      }
    ],
    colors: [ // Array of available colors (e.g., ['Black', 'Blue'])
      {
        type: String,
        required: true,
      }
    ],
    materials: [ // Array of materials (e.g., ['Cotton', 'Leather'])
      {
        type: String,
        required: false,
      }
    ],
    careInstructions: {
      type: String,
      required: false,
    },
    isFeatured: { // For showcasing on homepage or specific sections
      type: Boolean,
      default: false,
    },
    isArchived: { // Soft delete: hides product from public view but retains data
      type: Boolean,
      default: false,
    },
    rating: { // For future reviews/ratings feature
      type: Number,
      required: true,
      default: 0,
    },
    numReviews: { // For future reviews/ratings feature
      type: Number,
      required: true,
      default: 0,
    },
    // Consider adding 'weight', 'dimensions' for shipping if needed
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

module.exports = mongoose.model('Product', productSchema);