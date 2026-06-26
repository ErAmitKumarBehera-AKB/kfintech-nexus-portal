import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCircle2, Clock, AlertCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import apiClient from '../../api/client';

const getIcon = (type) => {
    switch (type) {
        case 'TICKET_RESOLVED': return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
        case 'DOCUMENT_REJECTED': return <XCircle className="w-4 h-4 text-red-400" />;
        case 'STATUS_CHANGED': return <Clock className="w-4 h-4 text-blue-400" />;
        case 'SLA_WARNING': return <AlertCircle className="w-4 h-4 text-amber-400" />;
        default: return <Bell className="w-4 h-4 text-kfintech-primary" />;
    }
};

const NotificationBell = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const fetchNotifications = async (isBackground = false) => {
        try {
            const response = await apiClient.get('/notifications');
            setNotifications(response.data.notifications);
            setUnreadCount(response.data.unreadCount);
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        }
    };

    useEffect(() => {
        // Initial fetch
        fetchNotifications();
        
        // Polling every 10 seconds
        const intervalId = setInterval(() => {
            fetchNotifications(true);
        }, 10000);
        
        return () => clearInterval(intervalId);
    }, []);

    // Handle Click Outside to close
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleDropdown = async () => {
        setIsOpen(!isOpen);
        
        // If opening and there are unread notifications, mark them all as read
        if (!isOpen && unreadCount > 0) {
            try {
                await apiClient.patch('/notifications/read-all');
                setUnreadCount(0); // Instantly clear badge
                // Refresh list to update specific item styling if needed
                fetchNotifications(true);
            } catch (error) {
                console.error('Failed to mark notifications as read', error);
            }
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={toggleDropdown}
                className={`relative p-2 rounded-xl transition-all ${isOpen ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-kfintech-card shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                    >
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </motion.div>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute bottom-full left-0 mb-4 w-80 bg-kfintech-card border border-kfintech-border rounded-2xl shadow-2xl overflow-hidden z-50 origin-bottom-left"
                    >
                        <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
                            <h3 className="text-sm font-black text-white uppercase tracking-widest">Notifications</h3>
                            <button 
                                onClick={() => setIsOpen(false)}
                                className="text-gray-500 hover:text-white transition-colors"
                            >
                                <XCircle className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                            {notifications.length > 0 ? (
                                <div className="divide-y divide-white/5">
                                    {notifications.map(notif => (
                                        <div key={notif._id} className={`p-4 transition-colors hover:bg-white/5 ${!notif.readAt ? 'bg-kfintech-primary/5' : ''}`}>
                                            <div className="flex gap-3">
                                                <div className="mt-1">
                                                    {getIcon(notif.type)}
                                                </div>
                                                <div>
                                                    <p className={`text-sm ${!notif.readAt ? 'text-white font-bold' : 'text-gray-300 font-medium'}`}>
                                                        {notif.title}
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-1">{notif.message}</p>
                                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-2">
                                                        {format(new Date(notif.createdAt), 'MMM dd, HH:mm')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center text-gray-500 text-sm">
                                    <Bell className="w-8 h-8 mx-auto mb-3 opacity-20" />
                                    <p>No notifications yet</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationBell;
