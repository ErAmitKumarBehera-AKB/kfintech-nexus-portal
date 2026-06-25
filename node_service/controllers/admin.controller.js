const mongoose = require('mongoose');
const axios = require('axios');
const FormData = require('form-data');
const { v4: uuidv4 } = require('uuid');
const Ticket = require('../models/Ticket');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const { uploadToS3 } = require('../services/s3Service');

exports.verifyInvestorDocument = async (req, res) => {
    // 1. Extract multipart form data
    const file = req.file;
    const { accountNumber, ticketId } = req.body;
    
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
            const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';
            const aiResponse = await axios.post(`${mlServiceUrl}/ocr/verify-account`, formData, {
                headers: {
                    ...formData.getHeaders()
                }
            });
            aiPayload = aiResponse.data;
        } catch (aiError) {
            console.error("OCR Engine Error:", aiError.message);
            throw new Error("Failed to communicate with AI OCR Verification Engine.");
        }

        const is_ai_pre_verified = aiPayload.account_found;

        const ticket = await Ticket.findById(ticketId).session(session);
        if (!ticket) throw new Error("Target Ticket ID not found in database.");

        // Upload Document to S3
        let documentUrl = null;
        try {
            const fileName = `${uuidv4()}-${file.originalname}`;
            await uploadToS3({
                Key: fileName,
                Body: file.buffer,
                ContentType: file.mimetype,
            });
            const endpoint = process.env.AWS_ENDPOINT_URL || 'http://localhost:4566';
            const bucket = process.env.AWS_BUCKET_NAME || 'kfintech-bucket';
            documentUrl = `${endpoint}/${bucket}/${encodeURIComponent(fileName)}`;
        } catch (s3Error) {
            console.error("LocalStack S3 Upload Error:", s3Error.message);
        }

        // Add to documents array
        if (documentUrl) {
            ticket.documents.push({
                name: file.originalname,
                fileType: file.mimetype,
                size: file.size,
                s3Key: documentUrl,
                ocrExtraction: {
                    extractedText: aiPayload.extracted_text ? aiPayload.extracted_text.join('\n') : '',
                    matchVerified: is_ai_pre_verified
                }
            });
        }

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
        if(!ticket) throw new Error("Ticket not found.");
        
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
    } catch(err) {
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

// SuperAdmin Endpoint: Metrics
exports.getSystemMetrics = async (req, res) => {
    try {
        const totalTickets = await Ticket.countDocuments();
        const totalInvestors = await User.countDocuments({ role: 'INVESTOR' });
        
        const openTickets = await Ticket.countDocuments({ status: 'OPEN' });
        const resolvedTickets = await Ticket.countDocuments({ status: 'RESOLVED' });
        const rejectedTickets = await Ticket.countDocuments({ status: 'REJECTED' });

        const rejectionRate = totalTickets > 0 ? (rejectedTickets / totalTickets) * 100 : 0;
        const resolutionRate = totalTickets > 0 ? (resolvedTickets / totalTickets) * 100 : 0;

        const slaBreachedTickets = await Ticket.countDocuments({ "slaTimeline.isBreached": true });

        const serviceTypeDataRaw = await Ticket.aggregate([
            { $group: { _id: "$serviceType", count: { $sum: 1 } } }
        ]);
        const serviceTypeData = serviceTypeDataRaw.map(item => ({ name: item._id || 'UNKNOWN', value: item.count }));

        const statusDataRaw = await Ticket.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);
        const statusData = statusDataRaw.map(item => ({ name: item._id || 'UNKNOWN', value: item.count }));

        return res.status(200).json({
            totalTickets,
            totalInvestors,
            rejectionRate,
            resolutionRate,
            openTickets,
            slaBreachedTickets,
            serviceTypeData,
            statusData
        });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

// SuperAdmin Endpoint: Users
exports.getAllUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const role = req.query.role;

        const query = {};
        if (role && role !== 'ALL') {
            query.role = role;
        }

        const users = await User.find(query)
            .select('-passwordHash')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);
        
        const total = await User.countDocuments(query);

        return res.status(200).json({ 
            users, 
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } 
        });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

// SuperAdmin Endpoint: All Tickets
exports.getAllTickets = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const { status, serviceType, priority, dateRange } = req.query;

        const query = {};
        if (status && status !== 'ALL') query.status = status;
        if (serviceType && serviceType !== 'ALL') query.serviceType = serviceType;
        if (priority && priority !== 'ALL') query.assignedPriority = priority;
        
        if (dateRange && dateRange !== 'ALL') {
            const days = parseInt(dateRange.replace('d', ''));
            if (!isNaN(days)) {
                query.createdAt = { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) };
            }
        }

        const tickets = await Ticket.find(query)
            .select('investorName serviceType status assignedPriority createdAt slaTimeline aiSentimentScore isPotentialFraud')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await Ticket.countDocuments(query);

        return res.status(200).json({ 
            tickets,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } 
        });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

// SuperAdmin Endpoint: Flagged Tickets
exports.getFlaggedTickets = async (req, res) => {
    try {
        const tickets = await Ticket.find({
            $or: [
                { isPotentialFraud: true },
                { assignedPriority: 'CRITICAL' },
                { status: 'ESCALATED' }
            ]
        })
        .select('investorName serviceType status assignedPriority isPotentialFraud title description createdAt')
        .sort({ createdAt: -1 });
        return res.status(200).json({ tickets });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

// SuperAdmin Endpoint: Export Reports (CSV)
exports.exportReports = async (req, res) => {
    try {
        const { dateRange } = req.query;
        const query = {};
        
        if (dateRange && dateRange !== 'ALL') {
            const days = parseInt(dateRange.replace('d', ''));
            if (!isNaN(days)) {
                query.createdAt = { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) };
            }
        }

        const tickets = await Ticket.find(query)
            .select('ticketId investorName serviceType status assignedPriority isPotentialFraud createdAt resolvedAt')
            .sort({ createdAt: -1 });

        // Build CSV string
        let csv = 'Ticket ID,Investor Name,Service Type,Status,Priority,Fraud Flag,Created At,Resolved At\n';
        
        tickets.forEach(t => {
            const ticketId = t.ticketId || t._id.toString();
            const investorName = `"${(t.investorName || '').replace(/"/g, '""')}"`;
            const serviceType = t.serviceType || '';
            const status = t.status || '';
            const priority = t.assignedPriority || '';
            const isFraud = t.isPotentialFraud ? 'YES' : 'NO';
            const createdAt = t.createdAt ? t.createdAt.toISOString() : '';
            const resolvedAt = t.resolvedAt ? t.resolvedAt.toISOString() : '';
            
            csv += `${ticketId},${investorName},${serviceType},${status},${priority},${isFraud},${createdAt},${resolvedAt}\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="nexus_reports_export.csv"');
        
        return res.status(200).send(csv);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

// SuperAdmin Endpoint: Update User Status (Activate/Deactivate)
exports.updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;
        const adminId = req.user ? req.user.id : null;

        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: "User not found" });

        // Prevent self-deactivation (optional safety check)
        if (adminId && adminId.toString() === id) {
            return res.status(400).json({ message: "Cannot deactivate your own admin account." });
        }

        user.isActive = isActive;
        await user.save();

        const auditLog = new AuditLog({
            entityId: user._id,
            entityType: 'User',
            action: isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
            performedBy: adminId || user._id,
            details: { note: `User status changed to ${isActive ? 'ACTIVE' : 'INACTIVE'}` }
        });
        await auditLog.save();

        return res.status(200).json({ message: "User status updated successfully", user });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
