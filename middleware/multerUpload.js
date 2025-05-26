const multer = require('multer');
const path = require('path'); // Still useful for path.extname in case we need it, though MIME types are primary

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    // Define a comprehensive list of allowed image and video MIME types
    const allowedMimeTypes = [
        // --- Image Formats ---
        'image/jpeg',           // .jpg, .jpeg
        'image/png',            // .png
        'image/gif',            // .gif
        'image/webp',           // .webp (modern, efficient)
        'image/svg+xml',        // .svg (vector graphics)
        'image/bmp',            // .bmp
        'image/tiff',           // .tif, .tiff (high quality, often for print)
        'image/heif',           // .heif, .heic (Apple devices, efficient)
        'image/heic',           // .heif, .heic
        'image/avif',           // .avif (newer, very efficient)
        'image/x-icon',         // .ico (favicons)
        'image/vnd.microsoft.icon', // .ico (alternative for favicons)
        // Add more obscure image types if absolutely necessary:
        // 'image/jp2',            // JPEG 2000
        // 'image/jpx',            // JPEG 2000
        // 'image/x-adobe-dng',    // DNG RAW
        // 'image/x-canon-cr2',    // Canon RAW
        // 'image/x-fuji-raf',     // Fuji RAW
        // 'image/x-nikon-nef',    // Nikon RAW
        // 'image/x-olympus-orf',  // Olympus RAW
        // 'image/x-panasonic-rw2',// Panasonic RAW
        // 'image/x-sony-arw',     // Sony RAW

        // --- Video Formats ---
        'video/mp4',            // .mp4 (most common and widely supported)
        'video/webm',           // .webm (web-friendly, open source)
        'video/quicktime',      // .mov (Apple QuickTime)
        'video/x-msvideo',      // .avi (older Windows format)
        'video/x-ms-wmv',       // .wmv (Windows Media Video)
        'video/x-flv',          // .flv (Flash Video, less common now)
        'video/3gpp',           // .3gp (mobile devices)
        'video/3gpp2',          // .3g2 (mobile devices)
        'video/mpeg',           // .mpg, .mpeg (older MPEG-1/2)
        'video/ogg',            // .ogv (open source)
        'video/x-matroska',     // .mkv (Matroska, versatile container)
        // Add more obscure video types if absolutely necessary:
        // 'video/mts',            // AVCHD (camcorder) - Note: Mime type might vary, often uses 'video/mp2t'
        // 'video/x-m4v',          // .m4v (often just a variation of mp4)
        // 'video/x-dv',           // Digital Video (DV)
        // 'video/x-la-asf',       // Advanced Systems Format (ASF)
        // 'application/vnd.rn-realmedia', // .rm
        // 'application/vnd.rn-realmedia-vbr', // .rmvb
        // 'video/mp2t',           // .ts, .m2ts (MPEG Transport Stream)
    ];

    // Check if the file's mimetype is in our allowed list
    if (allowedMimeTypes.includes(file.mimetype)) {
        console.log(`Accepted file type: ${file.mimetype}`); // For debugging
        return cb(null, true); // Accept the file
    } else {
        // If not, reject the file with a specific error message
        console.log(`Rejected file type: ${file.mimetype}`); // For debugging
        cb(new Error(`Unsupported file type: ${file.mimetype}. Only common image and video formats are allowed.`), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        // Significantly increased file size limit to accommodate videos.
        // 50 MB is a reasonable starting point, but adjust based on your needs
        // and server/Cloudinary plan limits.
        fileSize: 50 * 1024 * 1024, // 50MB
    },
});

module.exports = { upload };