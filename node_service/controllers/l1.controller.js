const mongoose = require('mongoose');
const Ticket = require('../models/Ticket');
const AuditLog = require('../models/AuditLog');
const { getServiceConfig } = require('../utils/serviceTypes');
const notificationService = require('../services/notificationService');
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
            query.status = { $in: ['OPEN', 'IN_PROGRESS', 'L1_REVIEW', 'ON_HOLD'] };
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
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { investorName: { $regex: search, $options: 'i' } }
            ];
            
            // If it looks like an object ID, also search by ID
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

exports.verifyDocument = async (req, res) => {
    try {
        const { id, docId } = req.params;
        const { verified } = req.body; // boolean

        const ticket = await Ticket.findById(id);
        if (!ticket) return res.status(404).json({ message: "Ticket not found" });

        const docIndex = ticket.documents.findIndex(d => d._id.toString() === docId);
        if (docIndex === -1) return res.status(404).json({ message: "Document not found on this ticket" });

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            if (!ticket.assignedL1) ticket.assignedL1 = req.user.id;
            if (ticket.status === 'OPEN') ticket.status = 'IN_PROGRESS';
            
            const beforeStatus = ticket.documents[docIndex].status;
            ticket.documents[docIndex].status = verified ? 'VERIFIED' : 'PENDING';
            
            await ticket.save({ session });

            const auditLog = new AuditLog({
                entityId: ticket._id,
                entityType: 'Ticket',
                action: 'VERIFY_DOCUMENT',
                performedBy: req.user.id,
                details: {
                    documentId: docId,
                    before: { status: beforeStatus },
                    after: { status: ticket.documents[docIndex].status }
                }
            });
            await auditLog.save({ session });

            await session.commitTransaction();
            session.endSession();

            return res.status(200).json({ message: "Document verification status updated", documents: ticket.documents });
        } catch (err) {
            await session.abortTransaction();
            session.endSession();
            throw err;
        }
    } catch (error) {
        console.error("Verify doc error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

exports.escalateTicket = async (req, res) => {
    try {
        const ticketId = req.params.id;
        const { notes } = req.body;
        
        const ticket = await Ticket.findById(ticketId);
        if (!ticket) return res.status(404).json({ message: "Ticket not found" });

        // Ensure all required docs are verified
        const serviceConfig = getServiceConfig(ticket.serviceType);
        if (serviceConfig.requiredDocuments.length > 0) {
            const allVerified = ticket.documents.every(doc => doc.status === 'VERIFIED');
            if (!allVerified && ticket.documents.length > 0) {
                return res.status(400).json({ message: "All attached documents must be verified before escalation." });
            }
        }

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
                title: 'Ticket Escalated',
                message: `Your ticket has been verified and moved to L2 Review.`,
                channels: { inApp: true, email: true }
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
                type: 'DOCUMENT_REJECTED',
                title: 'Action Required: Revision Needed',
                message: `L1 Admin: ${reason}`,
                channels: { inApp: true, email: true }
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

exports.holdTicket = async (req, res) => {
    try {
        const ticketId = req.params.id;
        const { reason } = req.body;

        const ticket = await Ticket.findById(ticketId);
        if (!ticket) return res.status(404).json({ message: "Ticket not found" });

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            if (!ticket.assignedL1) ticket.assignedL1 = req.user.id;
            
            const beforeStatus = ticket.status;
            ticket.status = 'ON_HOLD';
            ticket.isPotentialFraud = true;
            ticket.l1Notes = reason ? (ticket.l1Notes ? ticket.l1Notes + '\n[HOLD REASON]: ' + reason : '[HOLD REASON]: ' + reason) : ticket.l1Notes;
            
            await ticket.save({ session });

            const auditLog = new AuditLog({
                entityId: ticket._id,
                entityType: 'Ticket',
                action: 'HOLD_TICKET',
                performedBy: req.user.id,
                details: {
                    before: { status: beforeStatus, isPotentialFraud: false },
                    after: { status: ticket.status, isPotentialFraud: true },
                    note: reason
                }
            });
            await auditLog.save({ session });

            await session.commitTransaction();
            session.endSession();

            return res.status(200).json({ message: "Ticket placed on hold for investigation", ticket });
        } catch (err) {
            await session.abortTransaction();
            session.endSession();
            throw err;
        }
    } catch (error) {
        console.error("Hold error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

exports.summarizeTicket = async (req, res) => {
    try {
        const ticketId = req.params.id;
        const ticket = await Ticket.findById(ticketId);
        if (!ticket) return res.status(404).json({ message: "Ticket not found" });

        // Call Python AI Engine
        const aiResponse = await axios.post('http://127.0.0.1:8000/summarize/ticket', {
            ticket_data: {
                title: ticket.title,
                description: ticket.description,
                serviceType: ticket.serviceType,
                metadata: ticket.serviceMetadata
            }
        });

        const summaryBullets = aiResponse.data.summary;
        
        ticket.aiSummary = summaryBullets;
        await ticket.save();

        return res.status(200).json({ message: "Summary generated", summary: summaryBullets });
    } catch (error) {
        console.error("Summarizer proxy error:", error);
        res.status(500).json({ message: "Failed to generate summary from AI engine" });
    }
};
