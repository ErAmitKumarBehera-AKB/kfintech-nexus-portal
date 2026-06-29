const { uploadToS3 } = require('../s3Service');
const { v4: uuidv4 } = require('uuid');

const axios = require('axios');
const FormData = require('form-data');
const cloudinary = require('cloudinary').v2;


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


        // Document Upload (Cloudinary or S3)
        const fileName = `${uuidv4()}-${file.originalname}`;
        let documentUrl = null;
        
        try {
            if (process.env.CLOUDINARY_URL) {
                // Production Deployment: Cloudinary
                const uploadResult = await new Promise((resolve, reject) => {
                    cloudinary.uploader.upload_stream(
                        { resource_type: 'auto', public_id: fileName, folder: 'kfintech-nexus' },
                        (error, result) => {
                            if (error) reject(error);
                            else resolve(result);
                        }
                    ).end(file.buffer);
                });
                documentUrl = uploadResult.secure_url;
            } else {
                // Local Development: AWS LocalStack S3
                await uploadToS3({
                    Key: fileName,
                    Body: file.buffer,
                    ContentType: file.mimetype,
                });
                
                const bucket = process.env.AWS_BUCKET_NAME || "kfintech-bucket";
                if (process.env.AWS_ENDPOINT_URL) {
                    const publicEndpoint = process.env.PUBLIC_S3_URL || "http://localhost:4566";
                    documentUrl = `${publicEndpoint}/${bucket}/${encodeURIComponent(fileName)}`;
                } else {
                    const region = process.env.AWS_REGION || "ap-south-1";
                    documentUrl = `https://${bucket}.s3.${region}.amazonaws.com/${encodeURIComponent(fileName)}`;
                }
            }
        } catch (error) {
            console.error("Storage Upload Error:", error.message);
            throw new Error("Failed to upload document to secure storage.");

            
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
