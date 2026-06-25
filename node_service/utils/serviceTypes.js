const SERVICE_TYPES = {
    COMPLAINT: {
        label: 'Complaint',
        slaDays: 7,
        requiredFields: [],
        requiredDocuments: []
    },
    BANK_UPDATE: {
        label: 'Bank Account Update',
        slaDays: 10,
        requiredFields: ['newBankName', 'newAccountNumber', 'ifscCode', 'accountType'],
        requiredDocuments: ['Cancelled cheque or bank passbook']
    },
    NOMINEE_UPDATE: {
        label: 'Nominee Update',
        slaDays: 7,
        requiredFields: ['nomineeName', 'nomineeRelationship', 'nomineeDob'],
        requiredDocuments: ['Nominee identity proof']
    },
    ADDRESS_UPDATE: {
        label: 'Address Update',
        slaDays: 7,
        requiredFields: ['addressLine1', 'city', 'state', 'pinCode'],
        requiredDocuments: ['Address proof']
    },
    EMAIL_UPDATE: {
        label: 'Email ID Update',
        slaDays: 2,
        requiredFields: ['newEmail', 'confirmEmail'],
        requiredDocuments: []
    },
    MOBILE_UPDATE: {
        label: 'Mobile Number Update',
        slaDays: 2,
        requiredFields: ['countryCode', 'newMobileNumber'],
        requiredDocuments: []
    },
    KYC_UPDATE: {
        label: 'KYC Update',
        slaDays: 15,
        requiredFields: ['kycDocumentType', 'documentNumber'],
        requiredDocuments: ['KYC document']
    }
};

const normalizeServiceType = (serviceType = 'COMPLAINT') => {
    const normalized = String(serviceType).toUpperCase();
    return SERVICE_TYPES[normalized] ? normalized : 'COMPLAINT';
};

const getServiceConfig = (serviceType) => SERVICE_TYPES[normalizeServiceType(serviceType)];

const buildSlaTimeline = (serviceType, startDate = new Date()) => {
    const config = getServiceConfig(serviceType);
    const deadline = new Date(startDate);
    deadline.setDate(deadline.getDate() + config.slaDays);
    return {
        slaDays: config.slaDays,
        deadline
    };
};

const getSlaStatus = (ticket) => {
    const deadline = ticket?.slaTimeline?.deadline ? new Date(ticket.slaTimeline.deadline) : null;
    if (!deadline || Number.isNaN(deadline.getTime())) {
        return { percentElapsed: 0, daysRemaining: null, breached: false };
    }

    const createdAt = ticket.createdAt ? new Date(ticket.createdAt) : new Date();
    const now = new Date();
    const totalMs = Math.max(deadline.getTime() - createdAt.getTime(), 1);
    const elapsedMs = Math.max(now.getTime() - createdAt.getTime(), 0);
    const daysRemaining = Math.ceil((deadline.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

    return {
        percentElapsed: Math.min(100, Math.round((elapsedMs / totalMs) * 100)),
        daysRemaining,
        breached: now > deadline
    };
};

module.exports = {
    SERVICE_TYPES,
    normalizeServiceType,
    getServiceConfig,
    buildSlaTimeline,
    getSlaStatus
};
