const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const Ticket = require('../models/Ticket');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const { uploadToS3 } = require('../services/s3Service');
const mlService = require('../services/mlService');

/**
 * POST /api/admin/verify-document
 * Runs EasyOCR account verification on a submitted document, uploads it to S3,
 * and advances the ticket state machine.
 * L1 Maker desk and Super Admins only.
 */
exports.verifyInvestorDocument = async (req, res) => {
    const file = req.file;
    const { accountNumber, ticketId } = req.body;
    const adminId = req.user.id;

    if (!file) {
        return res.status(400).json({ message: 'An image or PDF file under 5 MB is required.' });
    }
    if (!accountNumber || !ticketId) {
        return res.status(400).json({ message: 'accountNumber and ticketId are required fields.' });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. OCR verification via centralised ML service
        let aiPayload;
        try {
            aiPayload = await mlService.verifyAccount(
                file.buffer,
                file.originalname,
                file.mimetype,
                accountNumber
            );
        } catch (aiError) {
            console.error('OCR Engine Error:', aiError.message);
            throw new Error('Failed to communicate with AI OCR Verification Engine.');
        }

        const is_ai_pre_verified = aiPayload.account_found;

        const ticket = await Ticket.findById(ticketId).session(session);
        if (!ticket) throw new Error('Target Ticket ID not found in database.');

        // 2. Upload document to S3
        let documentUrl = null;
        try {
            const fileName = `${uuidv4()}-${file.originalname}`;
            await uploadToS3({
                Key: fileName,
                Body: file.buffer,
                ContentType: file.mimetype,
            });
            const bucket = process.env.AWS_BUCKET_NAME || 'kfintech-bucket';
            if (process.env.AWS_ENDPOINT_URL) {
                const endpoint = process.env.PUBLIC_S3_URL || 'http://localhost:4566';
                documentUrl = `${endpoint}/${bucket}/${encodeURIComponent(fileName)}`;
            } else {
                const region = process.env.AWS_REGION || 'ap-south-1';
                documentUrl = `https://${bucket}.s3.${region}.amazonaws.com/${encodeURIComponent(fileName)}`;
            }
        } catch (s3Error) {
            console.error('LocalStack S3 Upload Error:', s3Error.message);
        }

        // 3. Attach document to ticket
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

        // 4. Advance state machine
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
                note: 'AI OCR Zero-Touch Verification executed by L1 Maker.'
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
        console.error('Maker Transaction aborted:', error);
        return res.status(error.message.includes('not found') ? 404 : 500).json({
            message: 'Failed to verify document.',
            error: error.message
        });
    }
};

// NOTE: escalateTicket and rejectTicket have been removed from this controller.
// The admin.routes.js now delegates PUT /escalate/:id and PUT /reject/:id to the
// l1.controller.js versions, which are complete (include notifications + audit logs).

// --------------------------------------------------------------------------
// SuperAdmin Endpoints
// --------------------------------------------------------------------------

exports.getSystemMetrics = async (req, res) => {
    try {
        const totalTickets    = await Ticket.countDocuments();
        const totalInvestors  = await User.countDocuments({ role: 'INVESTOR' });
        const openTickets     = await Ticket.countDocuments({ status: 'OPEN' });
        const resolvedTickets = await Ticket.countDocuments({ status: 'RESOLVED' });
        const rejectedTickets = await Ticket.countDocuments({ status: 'REJECTED' });

        const rejectionRate  = totalTickets > 0 ? (rejectedTickets / totalTickets) * 100 : 0;
        const resolutionRate = totalTickets > 0 ? (resolvedTickets / totalTickets) * 100 : 0;

        const slaBreachedTickets = await Ticket.countDocuments({ 'slaTimeline.isBreached': true });

        const serviceTypeDataRaw = await Ticket.aggregate([
            { $group: { _id: '$serviceType', count: { $sum: 1 } } }
        ]);
        const serviceTypeData = serviceTypeDataRaw.map(item => ({ name: item._id || 'UNKNOWN', value: item.count }));

        const statusDataRaw = await Ticket.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        const statusData = statusDataRaw.map(item => ({ name: item._id || 'UNKNOWN', value: item.count }));

        // Agent performance: top L1/L2 agents in the last 30 days
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const agentActivityRaw = await AuditLog.aggregate([
            { $match: { createdAt: { $gte: thirtyDaysAgo } } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'performedBy',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: '$user' },
            { $match: { 'user.role': { $in: ['ADMIN_L1', 'ADMIN_L2'] } } },
            {
                $group: {
                    _id: { userId: '$user._id', name: '$user.name', role: '$user.role' },
                    actionsCount: { $sum: 1 }
                }
            },
            { $sort: { actionsCount: -1 } },
            { $limit: 10 }
        ]);

        const agentPerformance = agentActivityRaw.map(item => ({
            name: item._id.name,
            role: item._id.role,
            actionsCount: item.actionsCount
        }));

        return res.status(200).json({
            totalTickets,
            totalInvestors,
            rejectionRate,
            resolutionRate,
            openTickets,
            slaBreachedTickets,
            serviceTypeData,
            statusData,
            agentPerformance
        });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const page  = parseInt(req.query.page)  || 1;
        const limit = parseInt(req.query.limit) || 20;
        const role  = req.query.role;

        const query = {};
        if (role && role !== 'ALL') query.role = role;

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

exports.getAllTickets = async (req, res) => {
    try {
        const page  = parseInt(req.query.page)  || 1;
        const limit = parseInt(req.query.limit) || 20;
        const { status, serviceType, priority, dateRange } = req.query;

        const query = {};
        if (status      && status      !== 'ALL') query.status          = status;
        if (serviceType && serviceType !== 'ALL') query.serviceType      = serviceType;
        if (priority    && priority    !== 'ALL') query.assignedPriority = priority;

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

        let csv = 'Ticket ID,Investor Name,Service Type,Status,Priority,Fraud Flag,Created At,Resolved At\n';
        tickets.forEach(t => {
            const ticketId     = t.ticketId || t._id.toString();
            const investorName = `"${(t.investorName || '').replace(/"/g, '""')}"`;
            const serviceType  = t.serviceType        || '';
            const status       = t.status             || '';
            const priority     = t.assignedPriority   || '';
            const isFraud      = t.isPotentialFraud ? 'YES' : 'NO';
            const createdAt    = t.createdAt  ? t.createdAt.toISOString()  : '';
            const resolvedAt   = t.resolvedAt ? t.resolvedAt.toISOString() : '';
            csv += `${ticketId},${investorName},${serviceType},${status},${priority},${isFraud},${createdAt},${resolvedAt}\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="nexus_reports_export.csv"');
        return res.status(200).send(csv);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

exports.updateUserStatus = async (req, res) => {
    try {
        const { id }      = req.params;
        const { isActive } = req.body;
        const adminId     = req.user.id;

        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (adminId.toString() === id) {
            return res.status(400).json({ message: 'Cannot deactivate your own admin account.' });
        }

        user.isActive = isActive;
        await user.save();

        const auditLog = new AuditLog({
            entityId: user._id,
            entityType: 'User',
            action: isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
            performedBy: adminId,
            details: { note: `User status changed to ${isActive ? 'ACTIVE' : 'INACTIVE'}` }
        });
        await auditLog.save();

        return res.status(200).json({ message: 'User status updated successfully', user });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

exports.getAgentActivities = async (req, res) => {
    try {
        const page  = parseInt(req.query.page)  || 1;
        const limit = parseInt(req.query.limit) || 20;

        const adminUsers = await User.find({ role: { $in: ['ADMIN_L1', 'ADMIN_L2'] } }).select('_id');
        const adminIds   = adminUsers.map(u => u._id);

        const logs = await AuditLog.find({ performedBy: { $in: adminIds } })
            .populate('performedBy', 'name role email')
            .populate('entityId', 'ticketId serviceType')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await AuditLog.countDocuments({ performedBy: { $in: adminIds } });

        return res.status(200).json({
            activities: logs,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
        });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
