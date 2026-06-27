const { buildSlaTimeline } = require('../../utils/serviceTypes');
const notificationService = require('../notificationService');

exports.calculateSla = (serviceType) => {
    const slaConfig = buildSlaTimeline(serviceType);
    return {
        slaDays: slaConfig.slaDays,
        deadline: slaConfig.deadline
    };
};

exports.addComment = async (ticket, userId, role, message, session = null) => {
    ticket.comments.push({
        userId,
        role,
        message,
        createdAt: new Date()
    });

    const options = session ? { session } : {};
    await ticket.save(options);
    
    // Send Notification to investor if comment is from admin
    if (role.startsWith('ADMIN') && ticket.investorId.toString() !== userId.toString()) {
        await notificationService.createNotification({
            userId: ticket.investorId,
            ticketId: ticket._id,
            type: 'TICKET_UPDATED',
            title: 'New Comment on Ticket',
            message: `An admin has commented on your ticket: ${ticket.title}`,
            channels: { inApp: true, email: true }
        }, options);
    }
    
    return ticket;
};

exports.transitionStatus = async (ticket, newStatus, session = null) => {
    ticket.status = newStatus;
    
    if (newStatus === 'RESOLVED') {
        ticket.resolvedAt = new Date();
    }
    
    const options = session ? { session } : {};
    await ticket.save(options);
    return ticket;
};
