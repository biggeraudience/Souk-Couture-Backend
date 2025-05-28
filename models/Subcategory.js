const mongoose = require('mongoose');

const subcategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Subcategory name is required'],
    trim: true,
    unique: false, 
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
 
}, {
  timestamps: true, 
});


subcategorySchema.index({ name: 1, category: 1 }, { unique: true });

const Subcategory = mongoose.model('Subcategory', subcategorySchema);

module.exports = Subcategory;