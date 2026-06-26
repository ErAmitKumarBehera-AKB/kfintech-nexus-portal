const mongoose = require('mongoose');
const axios = require('axios');
const Ticket = require('../models/Ticket');
const AuditLog = require('../models/AuditLog');
const { getServiceConfig, buildSlaTimeline } = require('../utils/serviceTypes');

const FormData = require('form-data');
const { v4: uuidv4 } = require("uuid");
const { uploadToS3 } = require('../services/s3Service');

exports.createTicket = async (req, res) => {
    // 1. Extract data
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
    
    // Check required fields
    for (const field of serviceConfig.requiredFields) {
        if (!serviceMetadata[field] && !req.body[field]) {
            return res.status(400).json({ message: `Missing required field for ${serviceConfig.label}: ${field}` });
        }
    }

    // Check required documents
    if (serviceConfig.requiredDocuments.length > 0 && files.length === 0) {
        return res.status(400).json({ message: `Missing required document for ${serviceConfig.label}: ${serviceConfig.requiredDocuments[0]}` });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';
        // User requested to ONLY run OCR on ticket submission to prevent timeouts.
        // We will assign default values for sentiment and summary.
        let aiPayload = { priority: 'NORMAL', score: 0.5, fraud_alert: false };
        let aiSummary = ["Pending AI Triage", "Awaiting Manual Review", "No summary available."];

        // --- C & D. Multi-Document S3 Upload & OCR ---
        const uploadedDocuments = [];
        
        for (const file of files) {
            // Validate file type
            const isPdf = file.mimetype === 'application/pdf';
            const isImage = file.mimetype.startsWith('image/');
            
            if (!isPdf && !isImage) {
                // Reject invalid file type
                throw new Error("Invalid file type. Only PDF and images (PNG/JPG) are allowed.");
            }

            // D. S3 Document Upload
            const fileName = `${uuidv4()}-${file.originalname}`;
            let documentUrl = null;
            try {
                await uploadToS3({
                    Key: fileName,
                    Body: file.buffer,
                    ContentType: file.mimetype,
                });
                
                const endpoint = process.env.AWS_ENDPOINT_URL || 'http://localhost:4566';
                const bucket = process.env.AWS_BUCKET_NAME || 'kfintech-bucket';
                documentUrl = `${endpoint}/${bucket}/${encodeURIComponent(fileName)}`;
            } catch (error) {
                console.error("LocalStack S3 Upload Error:", error.message);
                throw new Error("Failed to upload document to secure storage.");
            }

            let ocrExtractedText = null;
            let ocrMatchVerified = false;

            uploadedDocuments.push({
                name: file.originalname,
                fileType: file.mimetype,
                size: file.size,
                s3Key: documentUrl,
                status: 'PENDING',
                ocrExtraction: {
                    extractedText: ocrExtractedText,
                    matchVerified: ocrMatchVerified
                }
            });
        }
        // 4. Create Ticket Document with dynamic SLA
        const slaConfig = buildSlaTimeline(serviceType);
        
        const newTicket = new Ticket({
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
            slaTimeline: {
                slaDays: slaConfig.slaDays,
                deadline: slaConfig.deadline
            },
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
                hasOCR: uploadedDocuments.some(doc => doc.ocrExtraction && doc.ocrExtraction.extractedText && !doc.ocrExtraction.extractedText.includes("skipped")),
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

exports.getTickets = async (req, res) => {
    try {
        const query = {};
        if (req.user && req.user.role === 'INVESTOR') {
            query.investorId = req.user.id;
        }
        
        // Optional filters
        if (req.query.status) query.status = req.query.status;
        if (req.query.serviceType) query.serviceType = req.query.serviceType;

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const tickets = await Ticket.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
            
        const total = await Ticket.countDocuments(query);
        
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
        const ticket = await Ticket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({ message: "Ticket not found" });
        }

        if (
            req.user &&
            req.user.role === "INVESTOR" &&
            ticket.investorId.toString() !== req.user.id
        ) {
            return res.status(403).json({
                message: "Unauthorized access to this ticket",
            });
        }

        const timeline = await AuditLog.find({
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

        const ticket = await Ticket.findById(ticketId);
        if (!ticket) return res.status(404).json({ message: "Ticket not found." });

        if (req.user.role === 'INVESTOR' && ticket.investorId.toString() !== req.user.id) {
            return res.status(403).json({ message: "Unauthorized access to this ticket" });
        }

        ticket.comments.push({
            authorId: req.user.id,
            authorRole: req.user.role,
            message,
            visibility: req.user.role === 'INVESTOR' ? 'INVESTOR_ADMIN' : visibility
        });

        await ticket.save();
        
        await AuditLog.create({
            entityId: ticket._id,
            entityType: 'Ticket',
            action: 'COMMENT_ADDED',
            performedBy: req.user.id,
            details: { note: `Comment added by ${req.user.role}` }
        });

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

        const ticket = await Ticket.findById(ticketId);
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

        const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';

        for (const file of files) {
            const isPdf = file.mimetype === 'application/pdf';
            const isImage = file.mimetype.startsWith('image/');
            
            if (!isPdf && !isImage) {
                throw new Error("Invalid file type. Only PDF and images (PNG/JPG) are allowed.");
            }

            let documentUrl = null;
            const fileName = `${uuidv4()}-${file.originalname}`;
            try {
                await uploadToS3({
                    Key: fileName,
                    Body: file.buffer,
                    ContentType: file.mimetype,
                });
                const endpoint = process.env.AWS_ENDPOINT_URL || 'http://localhost:4566';
                const bucket = process.env.AWS_BUCKET_NAME || 'kfintech-bucket';
                documentUrl = `${endpoint}/${bucket}/${encodeURIComponent(fileName)}`;
            } catch (error) {
                console.error("LocalStack S3 Upload Error:", error.message);
                throw new Error("Failed to upload document to secure storage.");
            }

            let ocrExtractedText = null;
            let ocrMatchVerified = false;

            ticket.documents.push({
                name: file.originalname,
                fileType: file.mimetype,
                size: file.size,
                s3Key: documentUrl,
                status: 'PENDING',
                ocrExtraction: {
                    extractedText: ocrExtractedText,
                    matchVerified: ocrMatchVerified
                }
            });
        }

        // Reset status
        ticket.status = 'OPEN';
        ticket.l2ReturnNote = null;
        ticket.l1Notes = null;
        ticket.revisionReason = null;
        ticket.assignedL1 = null;
        ticket.assignedL2 = null;

        await ticket.save();

        await AuditLog.create({
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
        
        const ticket = await Ticket.findById(id);
        if (!ticket) return res.status(404).json({ message: "Ticket not found." });

        const document = ticket.documents.id(docId);
        if (!document) return res.status(404).json({ message: "Document not found in ticket." });

        if (document.fileType === 'application/pdf') {
            return res.status(400).json({ message: "OCR cannot be run on PDF files yet. Manual review required." });
        }

        if (!document.fileType.startsWith('image/')) {
            return res.status(400).json({ message: "OCR can only be run on images." });
        }

        const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';

        // 1. Fetch file from S3
        let fileBuffer;
        try {
            const s3Response = await axios.get(document.s3Key, { responseType: 'arraybuffer' });
            fileBuffer = s3Response.data;
        } catch (error) {
            console.error("Error downloading file from S3 for OCR:", error.message);
            return res.status(500).json({ message: "Failed to fetch document from storage." });
        }

        // 2. Run OCR Verification
        let ocrExtractedText = null;
        let ocrMatchVerified = false;

        try {
            const formData = new FormData();
            formData.append('account_number', ticket.accountNumber || "");
            formData.append('file', fileBuffer, {
                filename: document.name,
                contentType: document.fileType,
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

        // 3. Update the database
        document.ocrExtraction.extractedText = ocrExtractedText;
        document.ocrExtraction.matchVerified = ocrMatchVerified;
        
        await ticket.save();

        await AuditLog.create({
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
