const Ticket = require('../models/Ticket');

/**
 * 1. Fetch tickets for a specific Investor
 * Endpoint: GET /api/dashboard/investor/:id
 */
exports.getInvestorTickets = async (req, res) => {
    try {
        const { id } = req.params;
        // Sort by newest first
        const tickets = await Ticket.find({ investorId: id })
            .sort({ createdAt: -1 })
            .lean();
            
        return res.status(200).json({
            message: "Successfully fetched investor tickets.",
            count: tickets.length,
            data: tickets
        });
    } catch (error) {
        console.error("Dashboard Fetch Error (Investor):", error);
        return res.status(500).json({ message: "Internal server error while fetching investor dashboard.", error: error.message });
    }
};

/**
 * 2. Fetch L1 Maker Queue
 * Endpoint: GET /api/dashboard/l1-queue
 */
exports.getL1Queue = async (req, res) => {
    try {
        // Fetch tickets in OPEN or L1_REVIEW status for the Maker desk
        const tickets = await Ticket.find({ status: { $in: ['OPEN', 'L1_REVIEW'] } })
            .sort({ createdAt: 1 }) // Oldest first for queue priority
            .lean();
            
        return res.status(200).json({
            message: "Successfully fetched L1 Maker Queue.",
            count: tickets.length,
            data: tickets
        });
    } catch (error) {
        console.error("Dashboard Fetch Error (L1):", error);
        return res.status(500).json({ message: "Internal server error while fetching L1 Queue.", error: error.message });
    }
};

/**
 * 3. Fetch L2 Checker Queue
 * Endpoint: GET /api/dashboard/l2-queue
 */
exports.getL2Queue = async (req, res) => {
    try {
        // Fetch tickets in L2_APPROVAL status for the Checker desk
        // Specifically including aiSentimentScore and assignedPriority for UI highlighting
        const tickets = await Ticket.find({ status: 'L2_APPROVAL' })
            .select('investorId investorName accountNumber documentName complaintText aiSentimentScore assignedPriority aiSummary ocrExtractedText ocrMatchVerified status createdAt updatedAt serviceType serviceMetadata isPotentialFraud l2ReturnNote')
            .sort({ createdAt: 1 })
            .lean();
            
        return res.status(200).json({
            message: "Successfully fetched L2 Checker Queue.",
            count: tickets.length,
            data: tickets
        });
    } catch (error) {
        console.error("Dashboard Fetch Error (L2):", error);
        return res.status(500).json({ message: "Internal server error while fetching L2 Queue.", error: error.message });
    }
};
