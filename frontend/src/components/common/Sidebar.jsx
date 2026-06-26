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
                <button 
                    onClick={() => onTabChange('profile')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                        activeTab === 'profile'
                            ? 'bg-kfintech-primary/10 border-kfintech-primary/30'
                            : 'bg-kfintech-bg border-kfintech-border hover:border-kfintech-primary/50'
                    }`}
                >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        activeTab === 'profile' ? 'bg-kfintech-primary text-white shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-kfintech-primary/20 text-kfintech-primary'
                    }`}>
                        <User className="w-4 h-4" />
                    </div>
                    <div>
                        <p className={`text-sm font-bold ${activeTab === 'profile' ? 'text-kfintech-primary' : 'text-white'}`}>Profile</p>
                        <p className="text-xs text-gray-500">Settings & KYC</p>
                    </div>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
