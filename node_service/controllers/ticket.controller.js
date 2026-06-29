const mongoose = require('mongoose');
const axios = require('axios'); // Still used for S3 file download in runOcr
const ticketService = require('../services/ticket/ticket.service');
const documentService = require('../services/ticket/document.service');
const workflowService = require('../services/ticket/workflow.service');
const auditService = require('../services/ticket/audit.service');
const notificationService = require('../services/notificationService');
const { getServiceConfig, buildSlaTimeline } = require('../utils/serviceTypes');
const mlService = require('../services/mlService');

exports.createTicket = async (req, res) => {
    const { title, description, complaintText, investorName = "Jane Doe", accountNumber = "123456789", serviceType = 'COMPLAINT' } = req.body;
    const finalDescription = description || complaintText || '';
    
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
    
    const files = req.files || [];
    const investorId = req.user ? req.user.id : new mongoose.Types.ObjectId('60d5ecb8b392d700153f3a00'); 

    if (!finalDescription) {
        return res.status(400).json({ message: "description is required." });
    }

    // Validate against Service Configuration
    const serviceConfig = getServiceConfig(serviceType);
    for (const field of serviceConfig.requiredFields) {
        if (!serviceMetadata[field] && !req.body[field]) {
            return res.status(400).json({ message: `Missing required field for ${serviceConfig.label}: ${field}` });
        }
    }

    if (serviceConfig.requiredDocuments.length > 0 && files.length === 0) {
        return res.status(400).json({ message: `Missing required document for ${serviceConfig.label}: ${serviceConfig.requiredDocuments[0]}` });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        let aiPayload = { priority: 'NORMAL', score: 0.5, fraud_alert: false };
        let aiSummary = [];

        if (serviceType === 'COMPLAINT') {
            try {
                aiPayload = await mlService.analyzeSentiment(title + ' ' + finalDescription);
            } catch (err) {
                console.error('Sentiment API failed:', err.message);
            }
        }

        const uploadedDocuments = await documentService.uploadDocuments(files);
        
        const slaConfig = workflowService.calculateSla(serviceType);
        
        const newTicket = await ticketService.createTicket({
            investorId,
            investorName,
            accountNumber,
            title: title || 'Service Request',
            description: finalDescription,
            documents: uploadedDocuments,
            aiSentimentScore: aiPayload.score || 0,
            assignedPriority: aiPayload.priority || 'NORMAL',
            aiSummary,
            isPotentialFraud: aiPayload.fraud_alert || false,
            serviceType: serviceType || 'COMPLAINT',
            serviceMetadata,
            slaTimeline: slaConfig,
            status: 'OPEN'
        }, session);

        await auditService.createAuditLog({
            entityId: newTicket._id,
            entityType: 'Ticket',
            action: 'TICKET_CREATED',
            performedBy: investorId,
            details: {
                assignedPriority: newTicket.assignedPriority,
                aiSentimentScore: newTicket.aiSentimentScore,
                hasOCR: false, // OCR happens later typically
                isPotentialFraud: newTicket.isPotentialFraud,
                note: 'Ticket created and initially triaged by AI.'
            }
        }, session);

        await notificationService.createNotification({
            userId: investorId,
            ticketId: newTicket._id,
            type: 'TICKET_CREATED',
            title: 'Ticket Created',
            message: `Your ticket has been successfully submitted and is under review.`,
            channels: { inApp: true, email: true }
        }, { session });

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

exports.getTickets = async (req, res) => {
    try {
        const query = {};
        if (req.user && req.user.role === 'INVESTOR') {
            query.investorId = req.user.id;
        }
        
        if (req.query.status) query.status = req.query.status;
        if (req.query.serviceType) query.serviceType = req.query.serviceType;

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const tickets = await ticketService.getTicketsByQuery(query, skip, limit);
        const total = await ticketService.countTicketsByQuery(query);
        
        return res.status(200).json({ 
            tickets,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("[Ticket] getTickets error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

exports.getTicketById = async (req, res) => {
    try {
        const investorId = (req.user && req.user.role === "INVESTOR") ? req.user.id : null;
        const ticket = await ticketService.getTicketById(req.params.id, investorId);

        if (!ticket) {
            return res.status(404).json({ message: "Ticket not found or unauthorized access." });
        }

        const timeline = await require('../models/AuditLog').find({
            entityId: ticket._id,
        }).sort({ createdAt: 1 });

        return res.status(200).json({ ticket, timeline });

    } catch (error) {
        console.error("Get Ticket Error:", error);
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

exports.addComment = async (req, res) => {
    try {
        const ticketId = req.params.id;
        const { message, visibility = 'INVESTOR_ADMIN' } = req.body;
        
        if (!message) return res.status(400).json({ message: "Comment message is required." });

        let ticket = await ticketService.getTicketById(ticketId);
        if (!ticket) return res.status(404).json({ message: "Ticket not found." });

        if (req.user.role === 'INVESTOR' && ticket.investorId.toString() !== req.user.id) {
            return res.status(403).json({ message: "Unauthorized access to this ticket" });
        }

        const finalVisibility = req.user.role === 'INVESTOR' ? 'INVESTOR_ADMIN' : visibility;
        
        ticket.comments.push({
            authorId: req.user.id,
            authorRole: req.user.role,
            message,
            visibility: finalVisibility
        });
        
        await ticketService.saveTicket(ticket);
        
        await auditService.createAuditLog({
            entityId: ticket._id,
            entityType: 'Ticket',
            action: 'COMMENT_ADDED',
            performedBy: req.user.id,
            details: { note: `Comment added by ${req.user.role}` }
        });

        // Use workflow service to notify user if admin commented
        if (req.user.role.startsWith('ADMIN') && ticket.investorId.toString() !== req.user.id.toString()) {
            await notificationService.createNotification({
                userId: ticket.investorId,
                ticketId: ticket._id,
                type: 'TICKET_UPDATED',
                title: 'New Comment on Ticket',
                message: `An admin has commented on your ticket: ${ticket.title}`,
                channels: { inApp: true, email: true }
            });
        }

        return res.status(200).json({ message: "Comment added", comments: ticket.comments });
    } catch (error) {
        console.error("[Ticket] addComment error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

exports.resubmitTicket = async (req, res) => {
    try {
        const ticketId = req.params.id;
        const files = req.files || [];

        const ticket = await ticketService.getTicketById(ticketId);
        if (!ticket) return res.status(404).json({ message: "Ticket not found." });

        if (req.user.role === 'INVESTOR' && ticket.investorId.toString() !== req.user.id) {
            return res.status(403).json({ message: "Unauthorized access to this ticket" });
        }

        if (ticket.status !== 'REJECTED') {
            return res.status(400).json({ message: "Only REJECTED tickets can be resubmitted." });
        }

        if (files.length === 0) {
            return res.status(400).json({ message: "New document is required for resubmission." });
        }

        const uploadedDocuments = await documentService.uploadDocuments(files);
        ticket.documents.push(...uploadedDocuments);

        // Reset status
        ticket.status = 'OPEN';
        ticket.l2ReturnNote = null;
        ticket.l1Notes = null;
        ticket.revisionReason = null;
        ticket.assignedL1 = null;
        ticket.assignedL2 = null;

        await ticketService.saveTicket(ticket);

        await auditService.createAuditLog({
            entityId: ticket._id,
            entityType: 'Ticket',
            action: 'TICKET_RESUBMITTED',
            performedBy: req.user.id,
            details: { note: 'Investor uploaded new document and resubmitted the ticket.' }
        });

        return res.status(200).json({ message: "Ticket resubmitted successfully.", ticket });
    } catch (error) {
        console.error("[Ticket] resubmitTicket error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

exports.runOcr = async (req, res) => {
    try {
        const { id, docId } = req.params;
        
        const ticket = await ticketService.getTicketById(id);
        if (!ticket) return res.status(404).json({ message: "Ticket not found." });

        const document = ticket.documents.id(docId);
        if (!document) return res.status(404).json({ message: "Document not found in ticket." });

        if (document.fileType === 'application/pdf') {
            return res.status(400).json({ message: "OCR cannot be run on PDF files yet. Manual review required." });
        }

        if (!document.fileType.startsWith('image/')) {
            return res.status(400).json({ message: "OCR can only be run on images." });
        }

        // 1. Fetch file from S3 (stored as a URL in document.s3Key)
        let fileBuffer;
        try {
            let downloadUrl = document.s3Key;
            // If running inside Docker, rewrite localhost to localstack (or whatever internal endpoint is set)
            if (process.env.AWS_ENDPOINT_URL && downloadUrl.includes('localhost')) {
                const internalHost = new URL(process.env.AWS_ENDPOINT_URL).hostname;
                downloadUrl = downloadUrl.replace('localhost', internalHost);
            }
            
            const s3Response = await axios.get(downloadUrl, { responseType: 'arraybuffer' });
            fileBuffer = Buffer.from(s3Response.data);
        } catch (error) {
            console.error('Error downloading file from S3 for OCR:', error.message);
            return res.status(500).json({ message: 'Failed to fetch document from storage.' });
        }

        // 2. Run OCR Verification via centralised ML service
        let ocrExtractedText = null;
        let ocrMatchVerified = false;

        try {
            const ocrData = await mlService.verifyAccount(
                fileBuffer,
                document.name,
                document.fileType,
                ticket.accountNumber || ''
            );
            ocrExtractedText = ocrData.extracted_text.join('\n');
            ocrMatchVerified = ocrData.account_found;
        } catch (error) {
            console.error('EasyOCR Error:', error.message);
            ocrExtractedText = 'OCR Processing Failed: ' + error.message;
        }

        // 3. Update the database
        document.ocrExtraction.extractedText = ocrExtractedText;
        document.ocrExtraction.matchVerified = ocrMatchVerified;
        
        await ticketService.saveTicket(ticket);

        await auditService.createAuditLog({
            entityId: ticket._id,
            entityType: 'Ticket',
            action: 'OCR_VERIFICATION_RUN',
            performedBy: req.user.id,
            details: { 
                note: `L1 Admin manually ran OCR verification. Match found: ${ocrMatchVerified}`,
                documentName: document.name
            }
        });

        return res.status(200).json({ message: "OCR verification completed.", document });

    } catch (error) {
        console.error("[Ticket] runOcr error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
