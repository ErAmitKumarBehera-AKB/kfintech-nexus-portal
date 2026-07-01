const mongoose = require('mongoose');
const Ticket = require('../models/Ticket');
const AuditLog = require('../models/AuditLog');
const { getServiceConfig } = require('../utils/serviceTypes');
const notificationService = require('../services/notificationService');
const mlService = require('../services/mlService');
const { escapeRegex } = require('../utils/escapeRegex');
const axios = require('axios');

exports.getL1Queue = async (req, res) => {
    try {
        const { status, assigned, age, priority, search, page = 1, limit = 20 } = req.query;

        // Base query: L1 deals with OPEN and L1_REVIEW tickets typically
        // but we'll let the frontend request what it wants. Default to OPEN and IN_PROGRESS if not specified.
        const query = {};

        if (status && status !== 'ALL') {
            query.status = status;
        } else {
            query.status = { $in: ['OPEN', 'IN_PROGRESS', 'L1_REVIEW'] };
        }

        if (priority && priority !== 'ALL') {
            query.assignedPriority = priority;
        }

        if (assigned === 'ME') {
            query.assignedL1 = req.user.id;
        } else if (assigned === 'UNASSIGNED') {
            query.assignedL1 = null;
        }

        if (search) {
            const safeSearch = escapeRegex(search);
            query.$or = [
                { title: { $regex: safeSearch, $options: 'i' } },
                { investorName: { $regex: safeSearch, $options: 'i' } }
            ];

            // If it looks like an object ID, also search by exact _id
            if (mongoose.Types.ObjectId.isValid(search)) {
                query.$or.push({ _id: search });
            }
        }

        const sortObj = {};
        if (age === 'OLDEST') {
            sortObj.createdAt = 1; // oldest first
        } else {
            sortObj.createdAt = -1; // newest first
        }

        const tickets = await Ticket.find(query)
            .sort(sortObj)
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('assignedL1', 'name email');

        const total = await Ticket.countDocuments(query);

        res.status(200).json({
            tickets,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Error fetching L1 queue:", error);
        res.status(500).json({ message: "Failed to fetch L1 queue" });
    }
};

exports.assignTicket = async (req, res) => {
    try {
        const ticketId = req.params.id;
        const ticket = await Ticket.findById(ticketId);

        if (!ticket) return res.status(404).json({ message: "Ticket not found" });

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            ticket.assignedL1 = req.user.id;
            if (ticket.status === 'OPEN') {
                ticket.status = 'IN_PROGRESS';
            }

            await ticket.save({ session });

            const auditLog = new AuditLog({
                entityId: ticket._id,
                entityType: 'Ticket',
                action: 'ASSIGN_L1',
                performedBy: req.user.id,
                details: {
                    after: { assignedL1: req.user.id, status: ticket.status }
                }
            });
            await auditLog.save({ session });

            await session.commitTransaction();
            session.endSession();

            return res.status(200).json({ message: "Ticket assigned to you.", ticket });
        } catch (err) {
            await session.abortTransaction();
            session.endSession();
            throw err;
        }
    } catch (error) {
        console.error("Assign error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};



exports.escalateTicket = async (req, res) => {
    try {
        const ticketId = req.params.id;
        const { notes } = req.body;

        const ticket = await Ticket.findById(ticketId);
        if (!ticket) return res.status(404).json({ message: "Ticket not found" });



        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            if (!ticket.assignedL1) ticket.assignedL1 = req.user.id;

            const beforeStatus = ticket.status;
            ticket.status = 'L2_APPROVAL';
            ticket.l1Notes = notes || ticket.l1Notes;

            await ticket.save({ session });

            const auditLog = new AuditLog({
                entityId: ticket._id,
                entityType: 'Ticket',
                action: 'ESCALATE_TICKET',
                performedBy: req.user.id,
                details: {
                    before: { status: beforeStatus },
                    after: { status: ticket.status },
                    note: notes
                }
            });
            await auditLog.save({ session });

            await notificationService.createNotification({
                userId: ticket.investorId,
                ticketId: ticket._id,
                type: 'STATUS_CHANGED',
                title: 'Ticket Under Senior Review',
                message: `Your ticket "${ticket.title}" has been verified and escalated to our senior review team (L2). You will be notified once a final decision is made.`,
                channels: { inApp: true, email: true },
                meta: {
                    ticketTitle: ticket.title,
                    shortId: ticket._id.toString().slice(-8).toUpperCase(),
                    performedByRole: 'L1 Maker'
                }
            }, { session });

            await session.commitTransaction();
            session.endSession();

            return res.status(200).json({ message: "Ticket escalated to L2 successfully", ticket });
        } catch (err) {
            await session.abortTransaction();
            session.endSession();
            throw err;
        }
    } catch (error) {
        console.error("Escalate error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

exports.rejectTicket = async (req, res) => {
    try {
        const ticketId = req.params.id;
        const { reason } = req.body;

        if (!reason) return res.status(400).json({ message: "Revision reason is required for rejection." });

        const ticket = await Ticket.findById(ticketId);
        if (!ticket) return res.status(404).json({ message: "Ticket not found" });

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            if (!ticket.assignedL1) ticket.assignedL1 = req.user.id;

            const beforeStatus = ticket.status;
            ticket.status = 'REJECTED';
            ticket.revisionReason = reason;
            // Also update any PENDING documents to REJECTED
            ticket.documents.forEach(doc => {
                if (doc.status !== 'VERIFIED') doc.status = 'REJECTED';
            });

            await ticket.save({ session });

            const auditLog = new AuditLog({
                entityId: ticket._id,
                entityType: 'Ticket',
                action: 'REJECT_TICKET',
                performedBy: req.user.id,
                details: {
                    before: { status: beforeStatus },
                    after: { status: ticket.status, revisionReason: reason }
                }
            });
            await auditLog.save({ session });

            await notificationService.createNotification({
                userId: ticket.investorId,
                ticketId: ticket._id,
                type: 'TICKET_REJECTED',
                title: 'Action Required: Request Rejected',
                message: `Your ticket "${ticket.title}" has been reviewed and requires revision.`,
                channels: { inApp: true, email: true },
                meta: {
                    ticketTitle: ticket.title,
                    shortId: ticket._id.toString().slice(-8).toUpperCase(),
                    rejectionReason: reason,
                    performedByRole: 'L1 Maker'
                }
            }, { session });

            await session.commitTransaction();
            session.endSession();

            return res.status(200).json({ message: "Ticket rejected and investor notified", ticket });
        } catch (err) {
            await session.abortTransaction();
            session.endSession();
            throw err;
        }
    } catch (error) {
        console.error("Reject error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};



exports.summarizeTicket = async (req, res) => {
    try {
        const ticketId = req.params.id;
        const ticket = await Ticket.findById(ticketId);
        if (!ticket) return res.status(404).json({ message: "Ticket not found" });

        // Delegate to centralised ML service — respects ML_SERVICE_URL env var
        const aiData = await mlService.summarizeTicket({
            title: ticket.title,
            description: ticket.description,
            serviceType: ticket.serviceType,
            metadata: ticket.serviceMetadata
        });

        const summaryBullets = aiData.summary;
        ticket.aiSummary = summaryBullets;
        await ticket.save();

        return res.status(200).json({ message: "Summary generated", summary: summaryBullets });
    } catch (error) {
        console.error("Summarizer proxy error:", error);
        res.status(500).json({ message: "Failed to generate summary from AI engine" });
    }
};

/**
 * PATCH /api/l1/tickets/:id/priority
 * L1 Maker manually sets or overrides ticket priority.
 * Valid values: NORMAL | HIGH | CRITICAL
 */
exports.setPriority = async (req, res) => {
    try {
        const { id } = req.params;
        const { priority } = req.body;

        const VALID_PRIORITIES = ['NORMAL', 'HIGH', 'CRITICAL'];
        if (!priority || !VALID_PRIORITIES.includes(priority)) {
            return res.status(400).json({
                message: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}`
            });
        }

        const ticket = await Ticket.findById(id);
        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

        const previousPriority = ticket.assignedPriority;
        ticket.assignedPriority = priority;
        await ticket.save();

        await AuditLog.create({
            entityId: ticket._id,
            entityType: 'Ticket',
            action: 'PRIORITY_SET',
            performedBy: req.user.id,
            details: {
                before: { assignedPriority: previousPriority },
                after: { assignedPriority: priority },
                note: `L1 Maker manually set priority to ${priority}.`
            }
        });

        return res.status(200).json({
            message: `Priority updated to ${priority}.`,
            ticket
        });
    } catch (error) {
        console.error('[L1] setPriority error:', error);
        return res.status(500).json({ message: 'Failed to update priority.' });
    }
};
