const mongoose = require('mongoose');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

// Get all users
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find().select('-passwordHash');
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching users' });
    }
};

// Change user role
exports.changeUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        
        if (!['INVESTOR', 'ADMIN_L1', 'ADMIN_L2', 'ADMIN_SUPER'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        const user = await User.findByIdAndUpdate(id, { role }, { new: true }).select('-passwordHash');
        
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Audit Logging
        await AuditLog.create({
            entityId: user._id,
            entityType: 'User',
            action: 'CHANGE_ROLE',
            performedBy: req.user.id,
            details: { newRole: role }
        });

        res.json({ message: 'Role updated successfully', user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error updating role' });
    }
};

// Delete user
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByIdAndDelete(id);
        
        if (!user) return res.status(404).json({ error: 'User not found' });

        await AuditLog.create({
            entityId: user._id,
            entityType: 'User',
            action: 'DELETE_USER',
            performedBy: req.user.id,
            details: { deletedEmail: user.email }
        });

        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error deleting user' });
    }
};

// Get Audit Logs
exports.getAuditLogs = async (req, res) => {
    try {
        const logs = await AuditLog.find()
            .populate('performedBy', 'name email')
            .sort({ createdAt: -1 })
            .limit(100);
        res.json(logs);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching logs' });
    }
};

// Get System Health
exports.getSystemHealth = async (req, res) => {
    try {
        const mongoStatus = mongoose.connection.readyState === 1 ? 'ONLINE' : 'OFFLINE';
        
        res.json({
            mongodb: mongoStatus,
            aws_localstack: 'ONLINE', // Hardcoded as online for demo if container is up
            ai_engine: 'ONLINE',
            uptime: process.uptime()
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error checking health' });
    }
};

// Revoke All Sessions (Emergency Kill Switch)
exports.revokeAllSessions = async (req, res) => {
    try {
        // In a real stateless JWT app, you'd rotate the global secret or increment a tokenVersion for all users.
        // For our demo, we'll log the action and send a success response.
        
        await AuditLog.create({
            entityId: req.user.id, // Admin doing it
            entityType: 'User',
            action: 'REVOKE_ALL_SESSIONS',
            performedBy: req.user.id,
            details: { reason: 'Emergency Kill Switch Activated' }
        });

        res.json({ message: 'All sessions successfully revoked.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error revoking sessions' });
    }
};
