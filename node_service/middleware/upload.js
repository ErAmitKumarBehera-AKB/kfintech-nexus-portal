const multer = require('multer');

// Hold file bytes in memory — no disk writes needed before S3 upload
const storage = multer.memoryStorage();

/**
 * Accept JPEG, PNG, and PDF documents.
 * document.service.js already handles PDF vs image branching downstream;
 * this filter was previously blocking PDFs before they could reach the service.
 */
const fileFilter = (req, file, cb) => {
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
    if (ALLOWED_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Invalid file type "${file.mimetype}". Only JPEG, PNG, and PDF are accepted.`), false);
    }
};

// 5 MB hard limit per file
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter
});

module.exports = upload;
