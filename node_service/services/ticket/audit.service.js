const AuditLog = require('../../models/AuditLog');

exports.createAuditLog = async (logData, session = null) => {
    const auditLog = new AuditLog(logData);
    const options = session ? { session } : {};
    return await auditLog.save(options);
};
