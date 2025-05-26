const mongoose = require('mongoose');

const subcategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Subcategory name is required'],
    trim: true,
    unique: false, // Set to false here because uniqueness will be handled by the compound index
    minlength: [2, 'Subcategory name must be at least 2 characters long'],
    maxlength: [50, 'Subcategory name cannot exceed 50 characters'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Subcategory description cannot exceed 200 characters'],
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Subcategory must belong to a category'],
  },
  // You can add other fields like image, slug, etc.
}, {
  timestamps: true, // Adds createdAt and updatedAt timestamps
});

// IMPORTANT: Create a compound unique index
// This ensures that the combination of 'name' and 'category' is unique.
// So, "Shoes" can exist under "Men's" and "Women's", but only once under each.
subcategorySchema.index({ name: 1, category: 1 }, { unique: true });

const Subcategory = mongoose.model('Subcategory', subcategorySchema);

module.exports = Subcategory;