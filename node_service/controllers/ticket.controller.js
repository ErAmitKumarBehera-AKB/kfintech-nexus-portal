const mongoose = require('mongoose');
const axios = require('axios');
const Ticket = require('../models/Ticket');
const AuditLog = require('../models/AuditLog');

const FormData = require('form-data');

exports.createTicket = async (req, res) => {
    // 1. Extract data
    const { complaintText, investorName = "Jane Doe", accountNumber = "123456789" } = req.body;
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
        let aiPayload = { priority: 'NORMAL', score: 0.5 };
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
                question: `Summarize this investor complaint into exactly 3 short bullet points. Provide ONLY the bullets starting with dashes, nothing else: ${complaintText}`
            });
            const rawResponse = chatResponse.data.response;
            // Parse response into array of strings
            aiSummary = rawResponse.split('\n')
                .map(line => line.replace(/^[-*•]\s*/, '').trim())
                .filter(line => line.length > 5);
                
            if (aiSummary.length === 0) aiSummary = [rawResponse];
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

        // 4. Create Ticket Document
        const newTicket = new Ticket({
            investorId,
            investorName,
            accountNumber,
            documentName: file ? file.originalname : null,
            complaintText,
            aiSentimentScore: aiPayload.score || 0,
            assignedPriority: aiPayload.priority || 'NORMAL',
            aiSummary,
            ocrExtractedText,
            ocrMatchVerified,
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
