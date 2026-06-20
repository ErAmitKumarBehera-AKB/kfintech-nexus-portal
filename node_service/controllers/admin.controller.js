const mongoose = require('mongoose');
const axios = require('axios');
const FormData = require('form-data');
const Ticket = require('../models/Ticket');
const AuditLog = require('../models/AuditLog');

exports.verifyInvestorDocument = async (req, res) => {
    // 1. Extract multipart form data
    const file = req.file;
    const { accountNumber, ticketId } = req.body;
    
    // Injecting a fallback mock admin ID
    const adminId = req.user ? req.user.id : new mongoose.Types.ObjectId('60d5ecb8b392d700153f3a01'); 

    if (!file) {
        return res.status(400).json({ message: "An image file (JPEG/PNG) under 5MB is required." });
    }
    if (!accountNumber || !ticketId) {
        return res.status(400).json({ message: "accountNumber and ticketId are required fields." });
    }

    // 2. Wrap entire logic in a strict MongoDB ACID Transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 3. Prepare payload for Python AI Microservice
        const formData = new FormData();
        formData.append('account_number', accountNumber);
        formData.append('file', file.buffer, {
            filename: file.originalname,
            contentType: file.mimetype
        });

        // Forward the image buffer to the internal EasyOCR Python backend
        let aiPayload;
        try {
            const aiResponse = await axios.post('http://127.0.0.1:8000/ocr/verify-account', formData, {
                headers: {
                    ...formData.getHeaders()
                }
            });
            aiPayload = aiResponse.data;
        } catch (aiError) {
            console.error("OCR Engine Error:", aiError.message);
            throw new Error("Failed to communicate with AI OCR Verification Engine.");
        }

        // 4. Automated State Machine based on AI prediction
        // The API returns 'account_found' which acts as our boolean verified flag
        const is_ai_pre_verified = aiPayload.account_found;

        const ticket = await Ticket.findById(ticketId).session(session);
        if (!ticket) {
            throw new Error("Target Ticket ID not found in database.");
        }

        const previousStatus = ticket.status;
        // Advance to L2_APPROVAL if AI successfully matches the account number, else reject back to L1_REVIEW
        const newStatus = is_ai_pre_verified ? 'L2_APPROVAL' : 'L1_REVIEW';
        
        ticket.status = newStatus;
        await ticket.save({ session });

        // 5. Append precise event to the AuditLog collection
        const auditLog = new AuditLog({
            entityId: ticket._id,
            entityType: 'Ticket',
            action: is_ai_pre_verified ? 'DOCUMENT_AI_VERIFIED' : 'DOCUMENT_AI_REJECTED',
            performedBy: adminId, 
            details: {
                previousStatus,
                newStatus,
                accountNumberVerified: is_ai_pre_verified,
                extractedText: aiPayload.extracted_text,
                note: `AI OCR Zero-Touch Verification executed by L1 Maker.`
            }
        });

        await auditLog.save({ session });

        // 6. Commit ACID Transaction
        await session.commitTransaction();
        session.endSession();

        return res.status(200).json({
            message: `Document processed. Automated State Machine advanced ticket from ${previousStatus} to ${newStatus}.`,
            is_ai_pre_verified,
            extractedData: aiPayload.extracted_text
        });

    } catch (error) {
        // 7. Strict Error Intercept & Rollback
        await session.abortTransaction();
        session.endSession();
        console.error("Maker Transaction aborted cleanly:", error);
        
        const statusCode = error.message.includes("not found") ? 404 : 500;
        return res.status(statusCode).json({ 
            message: "Failed to verify document. MongoDB Transaction safely aborted.", 
            error: error.message 
        });
    }
};
