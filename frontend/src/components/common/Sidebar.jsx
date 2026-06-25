import React from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, PlusCircle, User } from 'lucide-react';

const Sidebar = ({ activeTab, onTabChange }) => {
    return (
        <div className="w-64 bg-kfintech-card border-r border-kfintech-border flex flex-col pt-6">
            <div className="px-6 mb-6">
                <h2 className="text-xs font-extrabold text-gray-500 uppercase tracking-widest mb-4">Investor Menu</h2>
                <nav className="space-y-2">
                    <button
                        onClick={() => onTabChange('tickets')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                            activeTab === 'tickets'
                                ? 'bg-kfintech-primary/10 text-kfintech-primary border border-kfintech-primary/30 font-bold'
                                : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent font-medium'
                        }`}
                    >
                        <LayoutDashboard className="w-5 h-5" />
                        My Tickets
                    </button>
                    <button
                        onClick={() => onTabChange('create')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                            activeTab === 'create'
                                ? 'bg-kfintech-accent/10 text-kfintech-accent border border-kfintech-accent/30 font-bold'
                                : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent font-medium'
                        }`}
                    >
                        <PlusCircle className="w-5 h-5" />
                        Create Ticket
                    </button>
                </nav>
            </div>
            
            <div className="mt-auto px-6 pb-6">
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-kfintech-bg border border-kfintech-border">
                    <div className="w-8 h-8 rounded-full bg-kfintech-primary/20 flex items-center justify-center text-kfintech-primary">
                        <User className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-white">Profile</p>
                        <p className="text-xs text-gray-500">KYC Verified</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
