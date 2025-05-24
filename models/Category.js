const mongoose = require('mongoose');

const categorySchema = mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    gender: { type: String, enum: ['men', 'women', 'unisex'], required: true },
    description: { type: String },
  },
  { timestamps: true }
);

const Category = mongoose.model('Category', categorySchema);
module.exports = Category;
