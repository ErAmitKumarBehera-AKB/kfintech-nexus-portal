const mongoose = require('mongoose');
const axios = require('axios');
const FormData = require('form-data');
const Ticket = require('../models/Ticket');
const AuditLog = require('../models/AuditLog');
const InvestorProfile = require('../models/InvestorProfile');

/**
 * POST /api/admin/ocr-scan
 * Standalone OCR endpoint — no ticketId needed.
 * L1 Maker Desk uses this to preview OCR output before escalating.
 */
exports.ocrScan = async (req, res) => {
    const { account_number, investor_name, ticketId } = req.body;
    console.log("OCR SCAN RECEIVED:", { account_number, investor_name, ticketId });

    let fileBuffer;
    let originalname = 'document.png';
    let mimetype = 'image/png';

    try {
        let dob = null;
        if (ticketId) {
            const ticket = await Ticket.findById(ticketId);
            if (!ticket || !ticket.documentUrl) {
                return res.status(400).json({ message: 'No document attached to this ticket.' });
            }

            // Fetch DOB if available
            if (ticket.investorId) {
                const profile = await InvestorProfile.findOne({ userId: ticket.investorId }).lean();
                if (profile && profile.dateOfBirth) {
                    dob = new Date(profile.dateOfBirth).toISOString().split('T')[0];
                }
            }

            const urlParts = ticket.documentUrl.split('/');
            const fileName = decodeURIComponent(urlParts[urlParts.length - 1]);
            originalname = fileName;

            const { downloadFromS3 } = require('../services/s3Service');
            fileBuffer = await downloadFromS3(fileName);
        } else if (req.file) {
            fileBuffer = req.file.buffer;
            originalname = req.file.originalname;
            mimetype = req.file.mimetype;
        } else {
            return res.status(400).json({ message: 'Either a ticketId or an image file is required.' });
        }

        const formData = new FormData();
        formData.append('account_number', account_number || '');
        if (investor_name) {
            formData.append('investor_name', investor_name);
        }
        if (dob) {
            formData.append('dob', dob);
        }
        formData.append('file', fileBuffer, {
            filename: originalname,
            contentType: mimetype
        });

        const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://backend:8000';
        const aiResponse = await axios.post(`${mlServiceUrl}/ocr/verify-account`, formData, {
            headers: { ...formData.getHeaders() },
            timeout: 120000 // Increased timeout for CPU-bound Florence-2 model
        });

        const data = aiResponse.data;
        return res.status(200).json({
            account_found: data.account_found,
            all_details_found: data.all_details_found,
            verification_details: data.verification_details,
            extracted_text: data.extracted_text,
            message: data.message,
            accountVerified: data.all_details_found,
            ocrResult: data
        });
    } catch (err) {
        console.error('OCR Scan error:', err.message);
        return res.status(500).json({
            message: 'OCR engine failed.',
            error: err.message,
            account_found: false,
            accountVerified: false,
            extracted_text: []
        });
    }
};


exports.verifyInvestorDocument = async (req, res) => {
    // 1. Extract multipart form data
    const file = req.file;
    const { accountNumber, ticketId, investorName } = req.body;

    // A fallback mock admin ID
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
        const ticket = await Ticket.findById(ticketId).session(session);
        if (!ticket) throw new Error("Target Ticket ID not found in database.");

        let dob = null;
        if (ticket.investorId) {
            const profile = await InvestorProfile.findOne({ userId: ticket.investorId }).lean();
            if (profile && profile.dateOfBirth) {
                dob = new Date(profile.dateOfBirth).toISOString().split('T')[0];
            }
        }

        // 3. Prepare payload for Python AI Microservice
        const formData = new FormData();
        formData.append('account_number', accountNumber);
        formData.append('investor_name', investorName || '');
        if (dob) {
            formData.append('dob', dob);
        }
        formData.append('file', file.buffer, {
            filename: file.originalname,
            contentType: file.mimetype
        });

        const previousStatus = ticket.status;
        const newStatus = is_ai_pre_verified ? 'L2_APPROVAL' : 'L1_REVIEW';

        ticket.status = newStatus;
        await ticket.save({ session });

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
        await session.commitTransaction();
        session.endSession();

        return res.status(200).json({
            message: `Document processed. State Machine advanced ticket to ${newStatus}.`,
            is_ai_pre_verified,
            extractedData: aiPayload.extracted_text
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Maker Transaction aborted cleanly:", error);
        return res.status(error.message.includes("not found") ? 404 : 500).json({
            message: "Failed to verify document.", error: error.message
        });
    }
};

exports.escalateTicket = async (req, res) => {
    const { id } = req.params;
    const { notes } = req.body;
    const adminId = req.user ? req.user.id : new mongoose.Types.ObjectId('60d5ecb8b392d700153f3a01');

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const ticket = await Ticket.findById(id).session(session);
        if (!ticket) throw new Error("Ticket not found.");

        const previousStatus = ticket.status;
        ticket.status = 'L2_APPROVAL';
        await ticket.save({ session });

        const auditLog = new AuditLog({
            entityId: ticket._id,
            entityType: 'Ticket',
            action: 'ESCALATED_TO_L2',
            performedBy: adminId,
            details: { previousStatus, newStatus: 'L2_APPROVAL', note: notes }
        });

        await auditLog.save({ session });
        await session.commitTransaction();
        session.endSession();

        return res.status(200).json({ message: "Successfully escalated to L2 Checker.", ticket });
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        return res.status(500).json({ error: err.message });
    }
};

exports.rejectTicket = async (req, res) => {
    // 1. Extract data
    const { id } = req.params;
    const { notes } = req.body;
    // Injecting a fallback mock admin ID
    const adminId = req.user ? req.user.id : new mongoose.Types.ObjectId('60d5ecb8b392d700153f3a01');

    // 2. Wrap entire logic in a strict MongoDB ACID Transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const ticket = await Ticket.findById(id).session(session);
        if (!ticket) throw new Error('Ticket not found.');

        // 3. Update Status
        const previousStatus = ticket.status;
        ticket.status = 'REJECTED';
        await ticket.save({ session });

        // 4. Securely write final state to AuditLog
        const auditLog = new AuditLog({
            entityId: ticket._id,
            entityType: 'Ticket',
            action: 'L1_TICKET_REJECTED',
            performedBy: adminId,
            details: { previousStatus, newStatus: 'REJECTED', note: notes || 'Rejected by L1 Maker.' }
        });

        await auditLog.save({ session });

        // 5. Commit Transaction
        await session.commitTransaction();
        session.endSession();

        return res.status(200).json({ message: 'Ticket rejected by L1 Maker.', ticket });
    } catch (err) {
        // 6. Transaction Rollback
        await session.abortTransaction();
        session.endSession();
        return res.status(500).json({ error: err.message });
    }
};
