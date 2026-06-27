import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCircle2, Clock, AlertCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import apiClient from '../../api/client';

const getIcon = (type) => {
    switch (type) {
        case 'TICKET_RESOLVED': return <CheckCircle2  />;
        case 'DOCUMENT_REJECTED': return <XCircle  />;
        case 'STATUS_CHANGED': return <Clock  />;
        case 'SLA_WARNING': return <AlertCircle  />;
        default: return <Bell  />;
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
        if (!isOpen && unreadCount> 0) {
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
        <div  ref={dropdownRef}>
            <button 
                onClick={toggleDropdown}>
                <Bell  />
                {unreadCount> 0 && (
                    <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}>
                        {unreadCount> 99 ? '99+' : unreadCount}
                    </motion.div>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}>
                        <div>
                            <h3>Notifications</h3>
                            <button 
                                onClick={() => setIsOpen(false)}>
                                <XCircle  />
                            </button>
                        </div>

                        <div>
                            {notifications.length> 0 ? (
                                <div>
                                    {notifications.map(notif => (
                                        <div key={notif._id}>
                                            <div>
                                                <div>
                                                    {getIcon(notif.type)}
                                                </div>
                                                <div>
                                                    <p>
                                                        {notif.title}
                                                    </p>
                                                    <p>{notif.message}</p>
                                                    <p>
                                                        {format(new Date(notif.createdAt), 'MMM dd, HH:mm')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div>
                                    <Bell  />
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
