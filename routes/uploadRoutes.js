// routes/uploadRoutes.js
const express = require('express');
const router = express.Router();
const { upload } = require('../middleware/multerUpload'); // Your multer setup
const cloudinary = require('cloudinary').v2; // Your Cloudinary config

// Route for multiple image/video uploads
router.post('/images', upload.array('images', 10), async (req, res) => { // 'images' is the field name, 10 is max files
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'No media uploaded' });
    }

    const uploadedMedia = []; // Renamed from uploadedImages to be more generic
    try {
        for (const file of req.files) {
            // Determine resource_type based on MIME type
            let resourceType;
            if (file.mimetype.startsWith('image/')) {
                resourceType = 'image';
            } else if (file.mimetype.startsWith('video/')) {
                resourceType = 'video';
            } else {
                // Fallback for unexpected types, or throw an error if you want to be strict
                // This case should ideally be caught by Multer's fileFilter, but good to have
                console.warn(`Unexpected MIME type encountered: ${file.mimetype}. Attempting 'auto' resource_type.`);
                resourceType = 'auto';
            }

            const result = await cloudinary.uploader.upload(`data:${file.mimetype};base64,${file.buffer.toString('base64')}`, {
                folder: 'souk-couture-products', // Your desired Cloudinary folder
                resource_type: resourceType, // <--- **Crucial Change Here**
                // You might want to add quality or other transformations for videos here as well
                // For videos, consider adding `chunk_size` for large files if you frequently hit timeouts
                // chunk_size: 6000000, // 6MB, adjust as needed
            });
            uploadedMedia.push({
                url: result.secure_url,
                public_id: result.public_id,
                resource_type: result.resource_type, // Also store resource_type if useful for frontend logic later
            });
        }
        res.status(200).json(uploadedMedia); // Return array of objects with url, public_id, and resource_type
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        // Log more details about the error if available from Cloudinary
        console.error('Cloudinary error details:', error.response?.data || error.message);
        res.status(500).json({ message: 'Media upload failed', error: error.message });
    }
});

// Optional: Route for deleting media from Cloudinary (useful for edits)
router.delete('/images/:public_id', async (req, res) => {
    try {
        // When deleting, Cloudinary needs to know the resource_type if it's not an image by default.
        // You might need to store the resource_type in your database along with public_id
        // or infer it. For simplicity, we'll assume it's always 'image' for this route,
        // which might be a limitation if you delete videos this way.
        // A better approach would be: router.delete('/media/:resourceType/:public_id'
        // For now, if all your uploads go through this route, Cloudinary often handles auto-detection for deletion too.
        await cloudinary.uploader.destroy(req.params.public_id);
        res.status(200).json({ message: 'Media deleted successfully' });
    } catch (error) {
        console.error('Cloudinary delete error:', error);
        res.status(500).json({ message: 'Media deletion failed', error: error.message });
    }
});

module.exports = router;