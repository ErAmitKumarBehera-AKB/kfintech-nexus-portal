const { uploadToS3 } = require('../s3Service');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const FormData = require('form-data');

exports.uploadDocuments = async (files) => {
    const uploadedDocuments = [];
    
    for (const file of files) {
        // Validate file type
        const isPdf = file.mimetype === 'application/pdf';
        const isImage = file.mimetype.startsWith('image/');
        
        if (!isPdf && !isImage) {
            throw new Error("Invalid file type. Only PDF and images (PNG/JPG) are allowed.");
        }

        // S3 Document Upload
        const fileName = `${uuidv4()}-${file.originalname}`;
        let documentUrl = null;
        try {
            await uploadToS3({
                Key: fileName,
                Body: file.buffer,
                ContentType: file.mimetype,
            });
            
            const bucket = process.env.AWS_BUCKET_NAME || "kfintech-bucket";
            if (process.env.AWS_ENDPOINT_URL) {
                // LocalStack - browser accessible URL
                const publicEndpoint =process.env.PUBLIC_S3_URL || "http://localhost:4566";
                documentUrl = `${publicEndpoint}/${bucket}/${encodeURIComponent(fileName)}`;}
                 else {
                    const region = process.env.AWS_REGION || "ap-south-1";
                    documentUrl = `https://${bucket}.s3.${region}.amazonaws.com/${encodeURIComponent(fileName)}`;
                }
        } catch (error) {
            console.error("LocalStack S3 Upload Error:", error.message);
            throw new Error("Failed to upload document to secure storage.");
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
    const ocrUrl = process.env.OCR_SERVICE_URL || 'http://localhost:8001';
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
