const asyncHandler = require('../utils/asyncHandler');
const Subcategory = require('../models/Subcategory');
const Category = require('../models/Category'); 
const mongoose = require('mongoose'); 


const getSubcategories = asyncHandler(async (req, res) => {
    const { category } = req.query;

    let query = {};
    if (category) {
        
        if (!mongoose.Types.ObjectId.isValid(category)) {
            res.status(400);
            throw new Error('Invalid category ID format');
        }
        query.category = category; 
    }

   
    const subcategories = await Subcategory.find(query).populate('category', 'name gender');
    res.json(subcategories);
});


const getSubcategoryById = asyncHandler(async (req, res) => {
    const subcategory = await Subcategory.findById(req.params.id).populate('category', 'name gender');

    if (subcategory) {
        res.json(subcategory);
    } else {
        res.status(404);
        throw new Error('Subcategory not found');
    }
});

const createSubcategory = asyncHandler(async (req, res) => {
    const { name, category: categoryId, description } = req.body; 

 
    const existingCategory = await Category.findById(categoryId);
    if (!existingCategory) {
        res.status(404);
        throw new Error('Parent category not found');
    }


    const subcategoryExists = await Subcategory.findOne({ name });
    if (subcategoryExists) {
        res.status(400);
        throw new Error('Subcategory with that name already exists');
    }

    const subcategory = new Subcategory({
        name,
        category: categoryId, 
        description,
    });

    const createdSubcategory = await subcategory.save();
    res.status(201).json(createdSubcategory);
});


const updateSubcategory = asyncHandler(async (req, res) => {
    const { name, category: categoryId, description } = req.body;

    const subcategory = await Subcategory.findById(req.params.id);

    if (subcategory) {
 
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