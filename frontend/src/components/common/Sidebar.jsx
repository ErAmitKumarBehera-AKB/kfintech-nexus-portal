import React from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, PlusCircle, User } from 'lucide-react';
import NotificationBell from './NotificationBell';

const Sidebar = ({ activeTab, onTabChange }) => {
    return (
        <div>
            <div>
                <h2>Investor Menu</h2>
                <nav>
                    <button
                        onClick={() => onTabChange('tickets')}>
                        <LayoutDashboard  />
                        My Tickets
                    </button>
                    <button
                        onClick={() => onTabChange('create')}>
                        <PlusCircle  />
                        Create Ticket
                    </button>
                </nav>
            </div>
            
            <div>
                <div>
                    <p>Alerts</p>
                    <NotificationBell />
                </div>
                
                <button 
                    onClick={() => onTabChange('profile')}>
                    <div>
                        <User  />
                    </div>
                    <div>
                        <p>Profile</p>
                        <p>Settings & KYC</p>
                    </div>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
