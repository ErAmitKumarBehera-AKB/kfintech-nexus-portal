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

// --- Indexes ---
// Ticket timeline view: all audit events for a given entity, oldest first
AuditLogSchema.index({ entityId: 1, createdAt: 1 });

// Agent activity report: actions performed by a given admin, newest first
AuditLogSchema.index({ performedBy: 1, createdAt: -1 });

// Admin 30-day agent performance aggregation
AuditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
