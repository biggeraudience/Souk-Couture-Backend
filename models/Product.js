const mongoose = require('mongoose');

const productSchema = mongoose.Schema(
  {
    user: { 
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
      required: false, 
    },
    sku: { 
      type: String,
      unique: true,
      sparse: true, 
      required: false,
    },
    category: { 
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Category',
    },
     subcategory: { 
      type: mongoose.Schema.Types.ObjectId, 
      required: true,
      ref: 'Subcategory', 
    },
    gender: { 
      type: String,
      enum: ['men', 'women', 'unisex'],
      required: true,
    },
    price: {
      type: Number,
      required: true,
      default: 0,
    },
    salePrice: { 
      type: Number,
      default: null,
    },
    isOnSale: {
      type: Boolean,
      default: false,
    },
    images: [ 
      {
        url: { type: String, required: true },
        public_id: { type: String, required: true },
      },
    ],
  
    stock: {
      type: Number,
      required: true,
      default: 0,
    },
    sizes: [
      {
        type: String,
        required: true,
      }
    ],
    colors: [ 
      {
        type: String,
        required: true,
      }
    ],
    materials: [
      {
        type: String,
        required: false,
      }
    ],
    careInstructions: {
      type: String,
      required: false,
    },
    isFeatured: { 
      type: Boolean,
      default: false,
    },
    isArchived: { 
      type: Boolean,
      default: false,
    },
    rating: { 
      type: Number,
      required: true,
      default: 0,
    },
    numReviews: { 
      type: Number,
      required: true,
      default: 0,
    },
    
  },
  {
    timestamps: true, 
  }
);

module.exports = mongoose.model('Product', productSchema);