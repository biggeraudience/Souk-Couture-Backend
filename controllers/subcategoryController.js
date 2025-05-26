const asyncHandler = require('../utils/asyncHandler');
const Subcategory = require('../models/Subcategory');
const Category = require('../models/Category'); // We'll need this to validate parent categories
const mongoose = require('mongoose'); // Add this line

// @desc    Get all subcategories (or filter by category ID)
// @route   GET /api/subcategories?category=:categoryId
// @access  Public
const getSubcategories = asyncHandler(async (req, res) => {
    const { category } = req.query; // Get category ID from query parameter

    let query = {};
    if (category) {
        // Validate if the provided category ID is a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(category)) {
            res.status(400);
            throw new Error('Invalid category ID format');
        }
        query.category = category; // Filter by parent category ID
    }

    // Find subcategories and populate the name and gender of their parent category
    const subcategories = await Subcategory.find(query).populate('category', 'name gender');
    res.json(subcategories);
});

// @desc    Get single subcategory by ID
// @route   GET /api/subcategories/:id
// @access  Public
const getSubcategoryById = asyncHandler(async (req, res) => {
    const subcategory = await Subcategory.findById(req.params.id).populate('category', 'name gender');

    if (subcategory) {
        res.json(subcategory);
    } else {
        res.status(404);
        throw new Error('Subcategory not found');
    }
});

// @desc    Create a new subcategory (Admin only)
// @route   POST /api/subcategories
// @access  Private/Admin
const createSubcategory = asyncHandler(async (req, res) => {
    const { name, category: categoryId, description } = req.body; // categoryId is the parent category's _id

    // Validate if the parent category exists
    const existingCategory = await Category.findById(categoryId);
    if (!existingCategory) {
        res.status(404);
        throw new Error('Parent category not found');
    }

    // Check if a subcategory with this name already exists (due to unique: true on name)
    const subcategoryExists = await Subcategory.findOne({ name });
    if (subcategoryExists) {
        res.status(400);
        throw new Error('Subcategory with that name already exists');
    }

    const subcategory = new Subcategory({
        name,
        category: categoryId, // Assign the parent category's ID
        description,
    });

    const createdSubcategory = await subcategory.save();
    res.status(201).json(createdSubcategory);
});

// @desc    Update a subcategory (Admin only)
// @route   PUT /api/subcategories/:id
// @access  Private/Admin
const updateSubcategory = asyncHandler(async (req, res) => {
    const { name, category: categoryId, description } = req.body;

    const subcategory = await Subcategory.findById(req.params.id);

    if (subcategory) {
        // If changing parent category, validate the new category ID
        if (categoryId && categoryId.toString() !== subcategory.category.toString()) {
            if (!mongoose.Types.ObjectId.isValid(categoryId)) {
                res.status(400);
                throw new Error('Invalid new category ID format');
            }
            const newParentCategory = await Category.findById(categoryId);
            if (!newParentCategory) {
                res.status(404);
                throw new Error('New parent category not found');
            }
            subcategory.category = categoryId;
        }

        // Check for name uniqueness if name is changed
        if (name && name !== subcategory.name) {
            const subcategoryExists = await Subcategory.findOne({ name });
            if (subcategoryExists) {
                res.status(400);
                throw new Error('Subcategory with that name already exists');
            }
        }

        subcategory.name = name || subcategory.name;
        subcategory.description = description || subcategory.description;

        const updatedSubcategory = await subcategory.save();
        res.json(updatedSubcategory);
    } else {
        res.status(404);
        throw new Error('Subcategory not found');
    }
});

// @desc    Delete a subcategory (Admin only)
// @route   DELETE /api/subcategories/:id
// @access  Private/Admin
const deleteSubcategory = asyncHandler(async (req, res) => {
    const subcategory = await Subcategory.findById(req.params.id);

    if (subcategory) {
        await Subcategory.deleteOne({ _id: subcategory._id });
        res.json({ message: 'Subcategory removed' });
    } else {
        res.status(404);
        throw new Error('Subcategory not found');
    }
});

module.exports = {
    getSubcategories,
    getSubcategoryById,
    createSubcategory,
    updateSubcategory,
    deleteSubcategory,
};