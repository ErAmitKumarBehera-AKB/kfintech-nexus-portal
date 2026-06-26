const mongoose = require('mongoose');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { sendEmail } = require('../services/sesService');
const { sendSMS } = require('../services/snsService');

exports.getL2Queue = async (req, res) => {
    try {
        const { search, page = 1, limit = 20, serviceType } = req.query;
        
        const query = { status: 'L2_APPROVAL' };

        if (serviceType && serviceType !== 'ALL') {
            query.serviceType = serviceType;
        }

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { investorName: { $regex: search, $options: 'i' } }
            ];
            if (mongoose.Types.ObjectId.isValid(search)) {
                query.$or.push({ _id: search });
            }
        }

        const tickets = await Ticket.find(query)
            .sort({ createdAt: 1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('investorId', 'name email bankAccount kyc nominee address');

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
        console.error("Error fetching L2 queue:", error);
        res.status(500).json({ message: "Failed to fetch L2 queue" });
    }
};

exports.finalizeTicket = async (req, res) => {
    const { ticketId, action, notes } = req.body;
    
    // Fallback mock ID for L2 Admin Checker
    const adminId = req.user ? req.user.id : new mongoose.Types.ObjectId('60d5ecb8b392d700153f3a02');

    if (!ticketId || !action) {
        return res.status(400).json({ message: "ticketId and action are required fields." });
    }

    if (!['APPROVE', 'REJECT', 'RETURN_TO_L1'].includes(action)) {
        return res.status(400).json({ message: "Invalid action. Must be 'APPROVE', 'REJECT', or 'RETURN_TO_L1'." });
    }

    // 1. Strict MongoDB ACID Multi-Document Transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 2. Safely find the ticket ensuring it's exactly in L2_APPROVAL state
        const ticket = await Ticket.findOne({ _id: ticketId, status: 'L2_APPROVAL' }).populate('investorId').session(session);
        if (!ticket) {
            throw new Error("Target Ticket not found or is not currently pending L2_APPROVAL status.");
        }

        const previousStatus = ticket.status;
        let newStatus;
        let userProfileUpdated = false;
        let updateDetails = {};

        if (action === 'APPROVE') {
            newStatus = 'RESOLVED';
            ticket.resolvedAt = new Date();
            
            // Phase 4: ACTUAL EXECUTION
            const user = await User.findById(ticket.investorId._id).session(session);
            if (user && ticket.serviceMetadata) {
                switch(ticket.serviceType) {
                    case 'BANK_ACCOUNT_UPDATE':
                    case 'BANK_UPDATE': // supporting both based on schema enum
                        user.bankAccount = {
                            ...user.bankAccount,
                            accountNumber: ticket.serviceMetadata.newAccountNumber || ticket.serviceMetadata.accountNumber,
                            ifsc: ticket.serviceMetadata.newIfsc || ticket.serviceMetadata.ifsc,
                            bankName: ticket.serviceMetadata.newBankName || ticket.serviceMetadata.bankName
                        };
                        userProfileUpdated = true;
                        updateDetails = { bankAccount: user.bankAccount };
                        break;
                    case 'KYC_UPDATE':
                        user.kyc = { ...user.kyc, status: 'APPROVED' };
                        userProfileUpdated = true;
                        updateDetails = { kycStatus: 'APPROVED' };
                        break;
                    case 'NOMINEE_UPDATE':
                        user.nominee = {
                            ...user.nominee,
                            name: ticket.serviceMetadata.nomineeName,
                            relation: ticket.serviceMetadata.nomineeRelation
                        };
                        userProfileUpdated = true;
                        updateDetails = { nominee: user.nominee };
                        break;
                    case 'ADDRESS_UPDATE':
                        user.address = {
                            ...user.address,
                            street: ticket.serviceMetadata.newAddress || ticket.serviceMetadata.street,
                            city: ticket.serviceMetadata.city,
                            state: ticket.serviceMetadata.state,
                            zip: ticket.serviceMetadata.zipCode || ticket.serviceMetadata.zip
                        };
                        userProfileUpdated = true;
                        updateDetails = { address: user.address };
                        break;
                }
                if (userProfileUpdated) {
                    await user.save({ session });
                    
                    // Log profile update in AuditLog
                    const profileAudit = new AuditLog({
                        entityId: user._id,
                        entityType: 'User',
                        action: 'USER_PROFILE_UPDATED',
                        performedBy: adminId,
                        details: {
                            ticketId: ticket._id,
                            serviceType: ticket.serviceType,
                            updatedFields: updateDetails
                        }
                    });
                    await profileAudit.save({ session });
                }
            }
        }
        else if (action === 'REJECT')    newStatus = 'REJECTED';
        else                             newStatus = 'L1_REVIEW'; // RETURN_TO_L1

        // 3. Update Status — and persist L2 return note if applicable
        ticket.status = newStatus;
        if (action === 'RETURN_TO_L1' && notes) {
            ticket.l2ReturnNote = notes;
        } else if (action !== 'RETURN_TO_L1') {
            ticket.l2ReturnNote = null; // clear on final resolution
        }
        await ticket.save({ session });

        // 4. Securely write final state to AuditLog
        const auditLog = new AuditLog({
            entityId: ticket._id,
            entityType: 'Ticket',
            action: action === 'APPROVE' ? 'L2_TICKET_APPROVED'
                  : action === 'REJECT'  ? 'L2_TICKET_REJECTED'
                  :                        'L2_RETURNED_TO_L1',
            performedBy: adminId,
            details: {
                previousStatus,
                newStatus,
                note: notes || `L2 Checker executed the ${action} action.`
            }
        });

        await auditLog.save({ session });

        // 5. Commit Transaction
        await session.commitTransaction();
        session.endSession();

        // 6. Send Notifications via LocalStack SES/SNS
        try {
            const investor = ticket.investorId;
            const userEmail = investor ? investor.email : null;
            const userPhone = investor ? investor.phoneNumber : null;
            const msgStatus = action === 'APPROVE' ? 'APPROVED and RESOLVED'
                            : action === 'REJECT'  ? 'REJECTED'
                            :                        'returned to L1 for rework';
            
            const subject = `Update on your Ticket: ${ticketId}`;
            const htmlMessage = `<h1>Hello ${ticket.investorName},</h1><p>Your ticket has been <strong>${msgStatus}</strong> by our L2 team.</p>`;
            const textMessage = `Hello ${ticket.investorName}, your ticket ${ticketId} has been ${msgStatus}.`;

            if (userEmail) {
                await sendEmail({
                    to: userEmail,
                    subject: subject,
                    message: htmlMessage
                });
            }

            if (userPhone) {
                await sendSMS({
                    phoneNumber: userPhone,
                    message: textMessage
                });
            }
        } catch (notificationError) {
            console.error("Non-critical error sending mock notification via LocalStack:", notificationError);
        }

        return res.status(200).json({
            message: `Ticket successfully finalized. Automated workflow advanced ticket from ${previousStatus} to ${newStatus}.`,
            ticket
        });

    } catch (error) {
        // 6. Transaction Rollback
        await session.abortTransaction();
        session.endSession();
        console.error("L2 Checker Transaction safely aborted:", error);
        
        const statusCode = error.message.includes("not found") ? 404 : 500;
        return res.status(statusCode).json({
            message: "Failed to finalize ticket. MongoDB Transaction aborted.",
            error: error.message
        });
    }
};
