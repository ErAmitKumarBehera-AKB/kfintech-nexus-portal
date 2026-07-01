const { uploadToS3 } = require('../s3Service');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const FormData = require('form-data');
const cloudinary = require('cloudinary').v2;

// Explicitly configure Cloudinary from the CLOUDINARY_URL env variable
if (process.env.CLOUDINARY_URL) {
    cloudinary.config({ cloudinary_url: process.env.CLOUDINARY_URL });
}

/**
 * Uploads an array of multer file objects to S3 or Cloudinary and returns the document
 * metadata array ready to be embedded into a Ticket document.
 * Supports JPEG, PNG, and PDF.
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
            if (process.env.CLOUDINARY_URL) {
                // Try Cloudinary
                try {
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
                } catch (cloudinaryErr) {
                    console.error("Cloudinary Upload Error, falling back to LocalStack:", cloudinaryErr.message);
                }
            }
            
            // If Cloudinary wasn't configured, or if it failed, use LocalStack S3
            if (!documentUrl) {
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
            console.error("Storage Upload Error, using Local Mock Fallback:", error.message);
            // Fallback for local development if all external services are unreachable
            documentUrl = `http://localhost/mock-uploads/${encodeURIComponent(fileName)}`;
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

exports.runOcrOnDocument = async (fileBuffer, mimetype, originalname) => {
    const ocrUrl = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';
    try {
        const formData = new FormData();
        formData.append('file', fileBuffer, {
            filename: originalname,
            contentType: mimetype,
        });

        const ocrRes = await axios.post(`${ocrUrl}/ocr/extract`, formData, {
            headers: { ...formData.getHeaders() }
        });
        
        return ocrRes.data.text || '';
    } catch (error) {
        console.error("OCR API failed:", error.message);
        throw new Error("Failed to process document with OCR.");
    }
};
