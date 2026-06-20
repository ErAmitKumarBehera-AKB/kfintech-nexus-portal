const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
    entityId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'entityType'
    },
    entityType: {
        type: String,
        required: true,
        enum: ['Ticket', 'User']
    },
    action: {
        type: String,
        required: true
    },
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    details: {
        type: Object
    }
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
