const multer = require('multer');
const path = require('path');

// Configure storage options for Multer
// Using memoryStorage is good for direct streaming to Cloudinary
// If you need to process files locally first, use diskStorage
const storage = multer.memoryStorage();

// Alternatively, for disk storage (if needed before Cloudinary upload)
// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, 'uploads/'); // Make sure this 'uploads/' directory exists in your root
//     },
//     filename: function (req, file, cb) {
//         cb(null, `<span class="math-inline">\{file\.fieldname\}\-</span>{Date.now()}${path.extname(file.originalname)}`);
//     }
// });

// Filter to allow only image files
const fileFilter = (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only images are allowed (jpeg, jpg, png, gif)!'), false);
    }
};

// Initialize Multer upload middleware
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB file size limit (adjust as needed)
    },
});

module.exports = { upload };
