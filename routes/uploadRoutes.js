const express = require('express');
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const asyncHandler = require('../utils/asyncHandler');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

// Configure multer storage (in-memory for Cloudinary upload)
const storage = multer.memoryStorage(); // Store files in memory buffer
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    },
});

// @desc    Upload image to Cloudinary
// @route   POST /api/upload
// @access  Private/Admin
router.post('/', protect, admin, upload.single('image'), asyncHandler(async (req, res) => {
    if (!req.file) {
        res.status(400);
        throw new Error('No image file provided');
    }

    try {
        const result = await cloudinary.uploader.upload(
            `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
            {
                folder: 'souk-couture/products', // Folder in Cloudinary
                // Add any other upload options
            }
        );

        res.json({
            message: 'Image uploaded successfully',
            imageUrl: result.secure_url,
            publicId: result.public_id,
        });
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        res.status(500);
        throw new Error('Image upload failed');
    }
}));

module.exports = router;
