const { uploadToS3 } = require('../s3Service');
const { v4: uuidv4 } = require('uuid');

/**
 * Uploads an array of multer file objects to S3 and returns the document
 * metadata array ready to be embedded into a Ticket document.
 * Supports JPEG, PNG, and PDF (gate is enforced by the upload middleware).
 */
exports.uploadDocuments = async (files) => {
    const uploadedDocuments = [];

    for (const file of files) {
        const isPdf = file.mimetype === 'application/pdf';
        const isImage = file.mimetype.startsWith('image/');

        if (!isPdf && !isImage) {
            throw new Error(`Invalid file type "${file.mimetype}". Only PDF and images (PNG/JPG) are allowed.`);
        }

        const fileName = `${uuidv4()}-${file.originalname}`;
        let documentUrl = null;

        try {
            await uploadToS3({
                Key: fileName,
                Body: file.buffer,
                ContentType: file.mimetype,
            });

            const bucket = process.env.AWS_BUCKET_NAME || 'kfintech-bucket';
            if (process.env.AWS_ENDPOINT_URL) {
                // LocalStack — browser-accessible path-style URL
                const publicEndpoint = process.env.PUBLIC_S3_URL || 'http://localhost:4566';
                documentUrl = `${publicEndpoint}/${bucket}/${encodeURIComponent(fileName)}`;
            } else {
                // Real AWS — virtual-hosted-style URL
                const region = process.env.AWS_REGION || 'ap-south-1';
                documentUrl = `https://${bucket}.s3.${region}.amazonaws.com/${encodeURIComponent(fileName)}`;
            }
        } catch (error) {
            console.error('S3 Upload Error:', error.message);
            throw new Error('Failed to upload document to secure storage.');
        }

        uploadedDocuments.push({
            name: file.originalname,
            fileType: file.mimetype,
            size: file.size,
            s3Key: documentUrl,
            status: 'PENDING',
            ocrExtraction: {
                extractedText: null,
                matchVerified: false
            }
        });
    }

    return uploadedDocuments;
};
