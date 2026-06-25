const Notification = require('../models/Notification');

exports.listNotifications = async (req, res) => {
    try {
        const limit = Math.min(Number(req.query.limit) || 30, 100);
        const notifications = await Notification.find({ userId: req.user.id })
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();
        const unreadCount = await Notification.countDocuments({ userId: req.user.id, readAt: null });
        return res.status(200).json({ notifications, unreadCount });
    } catch (err) {
        return res.status(500).json({ message: 'Failed to load notifications.', error: err.message });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            { readAt: new Date() },
            { new: true }
        );
        if (!notification) return res.status(404).json({ message: 'Notification not found.' });
        return res.status(200).json({ notification });
    } catch (err) {
        return res.status(500).json({ message: 'Failed to update notification.', error: err.message });
    }
};

exports.markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { userId: req.user.id, readAt: null },
            { readAt: new Date() }
        );
        return res.status(200).json({ message: 'All notifications marked as read.' });
    } catch (err) {
        return res.status(500).json({ message: 'Failed to update notifications.', error: err.message });
    }
};
