import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCircle2, Clock, AlertCircle, XCircle, Trash2, X } from 'lucide-react';
import { format } from 'date-fns';
import apiClient from '../../api/client';
import { Button } from "@/components/ui/button";

const getIcon = (type) => {
    switch (type) {
        case 'TICKET_RESOLVED': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
        case 'DOCUMENT_REJECTED': return <XCircle className="w-5 h-5 text-red-500" />;
        case 'STATUS_CHANGED': return <Clock className="w-5 h-5 text-blue-500" />;
        case 'SLA_WARNING': return <AlertCircle className="w-5 h-5 text-amber-500" />;
        default: return <Bell className="w-5 h-5 text-zinc-500" />;
    }
};

const getBgColor = (type) => {
    switch (type) {
        case 'TICKET_RESOLVED': return 'bg-emerald-50/50 dark:bg-emerald-950/30';
        case 'DOCUMENT_REJECTED': return 'bg-red-50/50 dark:bg-red-950/30';
        case 'STATUS_CHANGED': return 'bg-blue-50/50 dark:bg-blue-950/30';
        case 'SLA_WARNING': return 'bg-amber-50/50 dark:bg-amber-950/30';
        default: return 'bg-zinc-50/50 dark:bg-zinc-900/50';
    }
};

const NotificationsView = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get(`/notifications?_t=${Date.now()}`);
            setNotifications(response.data.notifications || []);
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const handleDelete = async (id) => {
        try {
            await apiClient.delete(`/notifications/${id}`);
            setNotifications(prev => prev.filter(n => n._id !== id));
        } catch (error) {
            console.error('Failed to delete notification', error);
        }
    };

    const handleClearAll = async () => {
        if (!window.confirm("Are you sure you want to clear all notifications?")) return;
        try {
            await apiClient.delete('/notifications');
            setNotifications([]);
        } catch (error) {
            console.error('Failed to clear notifications', error);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Your Notifications</h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Stay updated on your ticket journey</p>
                </div>
                {notifications.length > 0 && (
                    <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleClearAll}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 dark:border-red-900/50 dark:bg-[#131313]"
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clear All
                    </Button>
                )}
            </div>

            <div className="bg-white dark:bg-[#131313] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden min-h-[400px]">
                {notifications.length > 0 ? (
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        <AnimatePresence>
                            {notifications.map(notif => (
                                <motion.div 
                                    key={notif._id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className={`p-4 flex gap-4 items-start group transition-colors hover:bg-zinc-50 dark:hover:bg-[#1A1A1A] ${!notif.readAt ? getBgColor(notif.type) : 'bg-white dark:bg-[#131313]'}`}
                                >
                                    <div className="mt-1 shrink-0 p-2 bg-white dark:bg-[#1A1A1A] rounded-full shadow-sm border border-zinc-100 dark:border-zinc-800">
                                        {getIcon(notif.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-4 mb-1">
                                            <h4 className={`text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate ${!notif.readAt ? 'font-bold' : ''}`}>
                                                {notif.title}
                                            </h4>
                                            <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 shrink-0 uppercase tracking-wider">
                                                {format(new Date(notif.createdAt), 'MMM dd, HH:mm')}
                                            </span>
                                        </div>
                                        <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                                            {notif.message}
                                        </p>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            onClick={() => handleDelete(notif._id)}
                                            className="h-8 w-8 text-zinc-400 dark:text-zinc-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                                            title="Delete Notification"
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-[400px] text-zinc-500 dark:text-zinc-400">
                        <div className="h-16 w-16 bg-zinc-50 dark:bg-[#1A1A1A] rounded-full border border-zinc-200 dark:border-zinc-800 flex items-center justify-center mb-4">
                            <Bell className="h-8 w-8 text-zinc-300 dark:text-zinc-600" />
                        </div>
                        <p className="font-medium text-zinc-600 dark:text-zinc-300">No notifications yet</p>
                        <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">You're all caught up!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationsView;
