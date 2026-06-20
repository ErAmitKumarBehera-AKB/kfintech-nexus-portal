const mongoose = require('mongoose');
const axios = require('axios');
const Ticket = require('../models/Ticket');
const AuditLog = require('../models/AuditLog');

exports.createTicket = async (req, res) => {
    // 1. Extract complaint text
    const { complaintText } = req.body;
    
    // Assuming user ID is injected by auth middleware. Fallback to a mock ObjectId for demo.
    const investorId = req.user ? req.user.id : new mongoose.Types.ObjectId('60d5ecb8b392d700153f3a00'); 

    if (!complaintText) {
        return res.status(400).json({ message: "complaintText is required." });
    }

    // 2. Start ACID Transaction session
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 3. AI Server-to-Server Request
        // Hitting the internal FastAPI route running on port 8000
        let aiPayload;
        try {
            const aiResponse = await axios.post('http://localhost:8000/sentiment/analyze', {
                text: complaintText
            });
            aiPayload = aiResponse.data;
        } catch (aiError) {
            console.error("AI Engine Error:", aiError.message);
            throw new Error("Failed to communicate with AI Triage Engine.");
        }

        // Map the payload to requested variables
        // We map the model's confidence 'score' to 'frustration_index'
        const assigned_priority = aiPayload.priority || 'NORMAL';
        const frustration_index = aiPayload.score || 0; 

        // 4. Create Ticket Document (inside transaction)
        const newTicket = new Ticket({
            investorId,
            complaintText,
            aiSentimentScore: frustration_index,
            assignedPriority: assigned_priority,
            status: 'OPEN'
        });

        await newTicket.save({ session });

        // 5. Create AuditLog Entry (inside transaction)
        const auditLog = new AuditLog({
            entityId: newTicket._id,
            entityType: 'Ticket',
            action: 'TICKET_CREATED',
            performedBy: investorId,
            details: {
                assignedPriority: assigned_priority,
                aiSentimentScore: frustration_index,
                note: 'Ticket created and initially triaged by AI.'
            }
        });

        await auditLog.save({ session });

        // 6. Commit Transaction
        await session.commitTransaction();
        session.endSession();

        return res.status(201).json({
            message: "Ticket created and triaged successfully.",
            ticket: newTicket
        });

    } catch (error) {
        // 7. Abort Transaction on failure to prevent orphan records
        await session.abortTransaction();
        session.endSession();
        console.error("Transaction aborted safely. Error:", error);
        
        return res.status(500).json({ 
            message: "Failed to create ticket. Transaction aborted.", 
            error: error.message 
        });
    }
};
