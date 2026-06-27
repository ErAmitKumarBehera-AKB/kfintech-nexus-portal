const Ticket = require('../../models/Ticket');

exports.createTicket = async (ticketData, session = null) => {
    const ticket = new Ticket(ticketData);
    const options = session ? { session } : {};
    return await ticket.save(options);
};

exports.getTicketsByQuery = async (query, skip, limit) => {
    return await Ticket.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
};

exports.countTicketsByQuery = async (query) => {
    return await Ticket.countDocuments(query);
};

exports.getTicketById = async (id, investorId = null) => {
    const query = { _id: id };
    if (investorId) {
        query.investorId = investorId;
    }
    return await Ticket.findOne(query);
};

exports.saveTicket = async (ticket, session = null) => {
    const options = session ? { session } : {};
    return await ticket.save(options);
};
