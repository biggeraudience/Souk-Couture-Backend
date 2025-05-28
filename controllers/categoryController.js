const asyncHandler = require('../utils/asyncHandler');
const Category = require('../models/Category'); 


const getCategories = asyncHandler(async (req, res) => {
    console.log('Fetching all categories (placeholder)');
    const categories = await Category.find({});
    res.json(categories);
});


const getCategoryById = asyncHandler(async (req, res) => {
    console.log(`Workspaceing category with ID: ${req.params.id} (placeholder)`);
    const category = await Category.findById(req.params.id);

    if (category) {
        res.json(category);
    } else {
        res.status(404);
        throw new Error('Category not found');
    }
});


const createCategory = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    const categoryExists = await Category.findOne({ name });

    if (categoryExists) {
        res.status(400);
        throw new Error('Category with that name already exists');
    }

    const category = new Category({
        name,
        description,
        user: req.user._id, 
    });

    const createdCategory = await category.save();
    res.status(201).json(createdCategory);
});


const updateCategory = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    const category = await Category.findById(req.params.id);

    if (category) {
        category.name = name || category.name;
        category.description = description || category.description;

        const updatedCategory = await category.save();
        res.json(updatedCategory);
    } else {
        res.status(404);
        throw new Error('Category not found');
    }
});


const deleteCategory = asyncHandler(async (req, res) => {
    const category = await Category.findById(req.params.id);

    if (category) {
        await Category.deleteOne({ _id: category._id }); 
        res.json({ message: 'Category removed' });
    } else {
        res.status(404);
        throw new Error('Category not found');
    }
});


module.exports = {
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
};
