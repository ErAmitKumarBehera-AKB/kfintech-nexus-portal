const { buildSlaTimeline } = require('../../utils/serviceTypes');

/**
 * Calculates the SLA deadline for a given service type.
 * Used by ticket.controller during ticket creation.
 */
exports.calculateSla = (serviceType) => {
    const slaConfig = buildSlaTimeline(serviceType);
    return {
        slaDays: slaConfig.slaDays,
        deadline: slaConfig.deadline
    };
};
