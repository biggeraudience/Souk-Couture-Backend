const express = require('express');
const router = express.Router();
const { upload } = require('../middleware/multerUpload'); 
const cloudinary = require('cloudinary').v2; 


router.post('/images', upload.array('images', 10), async (req, res) => { 
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'No media uploaded' });
    }

    const uploadedMedia = []; 
    try {
        for (const file of req.files) {
            
            let resourceType;
            if (file.mimetype.startsWith('image/')) {
                resourceType = 'image';
            } else if (file.mimetype.startsWith('video/')) {
                resourceType = 'video';
            } else {
               
                console.warn(`Unexpected MIME type encountered: ${file.mimetype}. Attempting 'auto' resource_type.`);
                resourceType = 'auto';
            }

            const result = await cloudinary.uploader.upload(`data:${file.mimetype};base64,${file.buffer.toString('base64')}`, {
                folder: 'souk-couture-products',
                resource_type: resourceType, 
        
            });
            uploadedMedia.push({
                url: result.secure_url,
                public_id: result.public_id,
                resource_type: result.resource_type, 
            });
        }
        res.status(200).json(uploadedMedia);
    } catch (error) {
        console.error('Cloudinary upload error:', error);
    
        console.error('Cloudinary error details:', error.response?.data || error.message);
        res.status(500).json({ message: 'Media upload failed', error: error.message });
    }
});


router.delete('/images/:public_id', async (req, res) => {
    try {
      
        await cloudinary.uploader.destroy(req.params.public_id);
        res.status(200).json({ message: 'Media deleted successfully' });
    } catch (error) {
        console.error('Cloudinary delete error:', error);
        res.status(500).json({ message: 'Media deletion failed', error: error.message });
    }
});

module.exports = router;