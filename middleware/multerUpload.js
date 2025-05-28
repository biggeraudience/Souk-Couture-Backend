const multer = require('multer');
const path = require('path'); 

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {

    const allowedMimeTypes = [
      
        'image/jpeg',           
        'image/png',            
        'image/gif',            
        'image/webp',           
        'image/svg+xml',        
        'image/bmp',            
        'image/tiff',           
        'image/heif',           
        'image/heic',          
        'image/avif',          
        'image/x-icon',         
        'image/vnd.microsoft.icon', 


       
        'video/mp4',            
        'video/webm',           
        'video/quicktime',      
        'video/x-msvideo',      
        'video/x-ms-wmv',       
        'video/x-flv',          
        'video/3gpp',           
        'video/3gpp2',          
        'video/mpeg',          
        'video/ogg',            
        'video/x-matroska',     
   
    ];

    
    if (allowedMimeTypes.includes(file.mimetype)) {
        console.log(`Accepted file type: ${file.mimetype}`); 
        return cb(null, true);
    } else {
       
        console.log(`Rejected file type: ${file.mimetype}`); 
        cb(new Error(`Unsupported file type: ${file.mimetype}. Only common image and video formats are allowed.`), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      
        fileSize: 50 * 1024 * 1024, // 50MB
    },
});

module.exports = { upload };