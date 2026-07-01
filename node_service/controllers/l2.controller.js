const mongoose = require('mongoose');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { sendEmail } = require('../services/sesService');
const { sendSMS } = require('../services/snsService');
const notificationService = require('../services/notificationService');
const { escapeRegex } = require('../utils/escapeRegex');

exports.getL2Queue = async (req, res) => {
    try {
        const { search, page = 1, limit = 20, serviceType } = req.query;
        
        const query = { status: 'L2_APPROVAL' };

        if (serviceType && serviceType !== 'ALL') {
            query.serviceType = serviceType;
        }

        if (search) {
            const safeSearch = escapeRegex(search);
            query.$or = [
                { title: { $regex: safeSearch, $options: 'i' } },
                { investorName: { $regex: safeSearch, $options: 'i' } }
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

        return res.status(200).json({
            tickets,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching L2 queue:', error);
        return res.status(500).json({ message: 'Failed to fetch L2 queue' });
    }
};

exports.finalizeTicket = async (req, res) => {
    const { ticketId, action, notes } = req.body;
    const adminId = req.user?.id;

    if (!ticketId || !action) {
        return res.status(400).json({ message: 'ticketId and action are required fields.' });
    }

    if (!['APPROVE', 'REJECT', 'RETURN_TO_L1'].includes(action)) {
        return res.status(400).json({ message: "Invalid action. Must be 'APPROVE', 'REJECT', or 'RETURN_TO_L1'." });
    }

    let ticket;
    let previousStatus;
    let userProfileUpdated = false;

    try {
        // Step 1: Find the ticket (no session needed — Atlas free tier compatible)
        ticket = await Ticket.findOne({ _id: ticketId, status: 'L2_APPROVAL' }).populate('investorId');
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found or not in L2_APPROVAL status.' });
        }

        previousStatus = ticket.status;

        // Step 2: Determine the new status
        let newStatus;
        if (action === 'APPROVE') newStatus = 'RESOLVED';
        else if (action === 'REJECT') newStatus = 'REJECTED';
        else newStatus = 'L1_REVIEW'; // RETURN_TO_L1

        // Step 3: If APPROVE, apply the profile changes to the investor
        if (action === 'APPROVE') {
            ticket.resolvedAt = new Date();
            const investor = await User.findById(ticket.investorId._id);

            if (investor && ticket.serviceMetadata) {
                switch (ticket.serviceType) {
                    case 'BANK_ACCOUNT_UPDATE':
                    case 'BANK_UPDATE':
                        investor.bankAccount = {
                            ...investor.bankAccount,
                            accountNumber: ticket.serviceMetadata.newAccountNumber || ticket.serviceMetadata.accountNumber,
                            ifsc: ticket.serviceMetadata.newIfsc || ticket.serviceMetadata.ifsc,
                            bankName: ticket.serviceMetadata.newBankName || ticket.serviceMetadata.bankName
                        };
                        userProfileUpdated = true;
                        break;
                    case 'KYC_UPDATE':
                        investor.kyc = { ...investor.kyc, status: 'APPROVED' };
                        userProfileUpdated = true;
                        break;
                    case 'NOMINEE_UPDATE':
                        investor.nominee = {
                            ...investor.nominee,
                            name: ticket.serviceMetadata.nomineeName,
                            relation: ticket.serviceMetadata.nomineeRelation
                        };
                        userProfileUpdated = true;
                        break;
                    case 'ADDRESS_UPDATE':
                        investor.address = {
                            ...investor.address,
                            street: ticket.serviceMetadata.newAddress || ticket.serviceMetadata.street,
                            city: ticket.serviceMetadata.city,
                            state: ticket.serviceMetadata.state,
                            zip: ticket.serviceMetadata.zipCode || ticket.serviceMetadata.zip
                        };
                        userProfileUpdated = true;
                        break;
                }

                if (userProfileUpdated) {
                    await investor.save();

                    // Log the profile update
                    await AuditLog.create({
                        entityId: investor._id,
                        entityType: 'User',
                        action: 'USER_PROFILE_UPDATED',
                        performedBy: adminId,
                        details: {
                            ticketId: ticket._id,
                            serviceType: ticket.serviceType
                        }
                    });
                }
            }
        }

        // Step 4: Update ticket status
        ticket.status = newStatus;
        if (action === 'RETURN_TO_L1' && notes) {
            ticket.l2ReturnNote = notes;
        } else if (action !== 'RETURN_TO_L1') {
            ticket.l2ReturnNote = null;
        }
        await ticket.save();

        // Step 5: Write audit log
        await AuditLog.create({
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

        // Step 6: Send notifications (non-blocking — don't fail the response)
        try {
            const investor = ticket.investorId;
            const notificationType = action === 'APPROVE' ? 'TICKET_RESOLVED'
                                   : action === 'REJECT' ? 'TICKET_REJECTED'
                                   : 'RETURNED_TO_L1';

            await notificationService.createNotification({
                userId: investor?._id || ticket.investorId,
                ticketId: ticket._id,
                type: notificationType,
                title: action === 'APPROVE' ? 'Ticket Resolved' : action === 'REJECT' ? 'Ticket Rejected' : 'Ticket Update',
                message: `Your ticket has been ${action === 'APPROVE' ? 'approved and resolved' : action === 'REJECT' ? 'rejected' : 'returned to L1 for rework'} by our review team.`,
                channels: { inApp: true, email: true }
            });
        } catch (notifErr) {
            console.error('[L2] Non-critical notification error:', notifErr.message);
        }

        return res.status(200).json({
            message: `Ticket successfully ${action.toLowerCase()}d. Status: ${previousStatus} → ${newStatus}.`,
            ticket
        });

    } catch (error) {
        console.error('[L2] finalizeTicket error:', error);
        return res.status(500).json({
            message: 'Failed to finalize ticket.',
            error: error.message
        });
    }
};
