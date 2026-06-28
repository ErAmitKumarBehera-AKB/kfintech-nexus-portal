const multer = require('multer');

// Configure memory storage to hold the file buffer directly in RAM
const storage = multer.memoryStorage();

// Strict File filter for JPEG and PNG only
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype.startsWith('audio/') || file.mimetype.startsWith('video/')) {
        cb(null, true);
    } else {
        cb(new Error('Strict FileType Error: Only JPEG, PNG, or Audio files are allowed.'), false);
    }
};

// Initialize multer instance with 5MB hard limit
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5 MB
    },
    fileFilter: fileFilter
});

module.exports = upload;
