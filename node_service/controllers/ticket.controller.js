const mongoose = require('mongoose');
const axios = require('axios');
const Ticket = require('../models/Ticket');
const AuditLog = require('../models/AuditLog');

const FormData = require('form-data');
const { v4: uuidv4 } = require("uuid");
const { uploadToS3 } = require('../services/s3Service');

exports.createTicket = async (req, res) => {
    // 1. Extract data
    const { complaintText, investorName = "Jane Doe", accountNumber = "123456789", serviceType = 'COMPLAINT' } = req.body;
    let serviceMetadata = {};
    if (req.body.serviceMetadata) {
        try {
            serviceMetadata = typeof req.body.serviceMetadata === 'string'
                ? JSON.parse(req.body.serviceMetadata)
                : req.body.serviceMetadata;
        } catch (e) {
            serviceMetadata = {};
        }
    }
    const file = req.file;

    const investorId = req.user ? req.user.id : new mongoose.Types.ObjectId('60d5ecb8b392d700153f3a00'); 

    if (!complaintText) {
        return res.status(400).json({ message: "complaintText is required." });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';
        
        // --- A. FinBERT Sentiment ---
        let aiPayload = { priority: 'NORMAL', score: 0.5, fraud_alert: false };
        try {
            const aiResponse = await axios.post(`${mlServiceUrl}/sentiment/analyze`, { text: complaintText });
            aiPayload = aiResponse.data;
        } catch (error) {
            console.error("FinBERT Error:", error.message);
        }

        // --- B. Ollama Insight Summary ---
        let aiSummary = [];
        try {
            const chatResponse = await axios.post(`${mlServiceUrl}/chatbot/ask`, { 
                question: `Summarize this investor complaint into exactly 3 short bullet points. Provide the output ONLY as a JSON object with a single key "bullets" containing an array of exactly 3 strings. Example: {"bullets": ["point 1", "point 2", "point 3"]}. Do not include any other text. Complaint: ${complaintText}`,
                format: 'json'
            });
            const rawResponse = chatResponse.data.response;
            
            // Aggressive string cleanup to extract the actual sentences
            // Find all substrings that look like sentences (ignoring JSON brackets/braces/keys)
            const cleanedMatches = rawResponse.match(/(?:"|')([^"']{15,})(?:"|')/g);
            
            if (cleanedMatches && cleanedMatches.length > 0) {
                aiSummary = cleanedMatches
                    .map(s => s.replace(/["']/g, '').trim())
                    .filter(s => !s.toLowerCase().includes("bullets") && s.length > 10);
            } else {
                // Absolute fallback: just strip all JSON chars
                let stripped = rawResponse.replace(/[\*"{}\[\]\\]/g, '').replace(/bullets:/gi, '').trim();
                aiSummary = stripped.split(',').map(s => s.trim()).filter(s => s.length > 5);
            }
                
            // Truncate strictly to 3 bullets
            if (aiSummary.length > 3) aiSummary = aiSummary.slice(0, 3);
            if (aiSummary.length === 0) {
                aiSummary = ["Requires manual review.", "AI summary extraction failed.", "Sentiment flags potential issue."];
            }
        } catch (error) {
            console.error("Ollama Error:", error.message);
            aiSummary = ["Ollama AI Engine not reachable.", "Using default static insights.", "Sentiment flags potential churn."];
        }

        // --- C. EasyOCR Extraction ---
        let ocrExtractedText = null;
        let ocrMatchVerified = false;
        if (file) {
            try {
                const formData = new FormData();
                formData.append('account_number', accountNumber);
                formData.append('file', file.buffer, {
                    filename: file.originalname,
                    contentType: file.mimetype,
                });
                
                const ocrRes = await axios.post(`${mlServiceUrl}/ocr/verify-account`, formData, {
                    headers: { ...formData.getHeaders() }
                });
                
                ocrExtractedText = ocrRes.data.extracted_text.join('\n');
                ocrMatchVerified = ocrRes.data.account_found;
            } catch (error) {
                console.error("EasyOCR Error:", error.message);
                ocrExtractedText = "OCR Processing Failed: " + error.message;
            }
        }

        // --- D. S3 Document Upload ---
        let documentUrl = null;
        let documentName = null;
        if (file) {
            documentName = file.originalname;
            const fileName = `${uuidv4()}-${file.originalname}`;
            try {
                await uploadToS3({
                    Key: fileName,
                    Body: file.buffer,
                    ContentType: file.mimetype,
                });
                
                // Construct S3 path-style URL for LocalStack
                const endpoint = process.env.AWS_ENDPOINT_URL || 'http://localhost:4566';
                const bucket = process.env.AWS_BUCKET_NAME || 'kfintech-bucket';
                documentUrl = `${endpoint}/${bucket}/${encodeURIComponent(fileName)}`;
            } catch (error) {
                console.error("LocalStack S3 Upload Error:", error.message);
            }
        }

        // 4. Create Ticket Document
        const newTicket = new Ticket({
            investorId,
            investorName,
            accountNumber,
            documentName,
            documentUrl,
            complaintText,
            aiSentimentScore: aiPayload.score || 0,
            assignedPriority: aiPayload.priority || 'NORMAL',
            aiSummary,
            ocrExtractedText,
            ocrMatchVerified,
            isPotentialFraud: aiPayload.fraud_alert || false,
            serviceType: serviceType || 'COMPLAINT',
            serviceMetadata: serviceMetadata || {},
            status: 'OPEN'
        });


        await newTicket.save({ session });

        // 5. Create AuditLog
        const auditLog = new AuditLog({
            entityId: newTicket._id,
            entityType: 'Ticket',
            action: 'TICKET_CREATED',
            performedBy: investorId,
            details: {
                assignedPriority: newTicket.assignedPriority,
                aiSentimentScore: newTicket.aiSentimentScore,
                hasOCR: !!ocrExtractedText,
                isPotentialFraud: newTicket.isPotentialFraud,
                note: 'Ticket created and initially triaged by AI.'
            }
        });

        await auditLog.save({ session });

        await session.commitTransaction();
        session.endSession();

        return res.status(201).json({ message: "Ticket created successfully.", ticket: newTicket });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Transaction aborted. Error:", error);
        return res.status(500).json({ message: "Failed to create ticket.", error: error.message });
    }
};
