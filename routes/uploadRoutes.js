// routes/uploadRoutes.js
// Assume you have multer and cloudinary config set up
const express = require('express');
const router = express.Router();
const { upload } = require('../middleware/multerUpload'); // Your multer setup
const cloudinary = require('cloudinary').v2; // Your Cloudinary config

// Route for multiple image uploads
router.post('/images', upload.array('images', 10), async (req, res) => { // 'images' is the field name, 10 is max files
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'No images uploaded' });
    }

    const uploadedImages = [];
    try {
        for (const file of req.files) {
            // If using memoryStorage, file.buffer contains the file data
            const result = await cloudinary.uploader.upload(`data:<span class="math-inline">\{file\.mimetype\};base64,</span>{file.buffer.toString('base64')}`, {
                folder: 'souk-couture-products', // Your desired Cloudinary folder
            });
            uploadedImages.push({
                url: result.secure_url,
                public_id: result.public_id,
            });
            // No need to delete local file if multer saves to memory
        }
        res.status(200).json(uploadedImages); // Return array of objects with url and public_id
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        res.status(500).json({ message: 'Image upload failed', error: error.message });
    }
});

// Optional: Route for deleting an image from Cloudinary (useful for edits)
router.delete('/images/:public_id', async (req, res) => {
    try {
        await cloudinary.uploader.destroy(req.params.public_id);
        res.status(200).json({ message: 'Image deleted successfully' });
    } catch (error) {
        console.error('Cloudinary delete error:', error);
        res.status(500).json({ message: 'Image deletion failed', error: error.message });
    }
});

module.exports = router;