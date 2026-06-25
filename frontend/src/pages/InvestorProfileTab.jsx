import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCircle, RefreshCcw, ShieldCheck, MapPin, Building, Activity, FileText } from 'lucide-react';

const InvestorProfileTab = () => {
    const [profile, setProfile] = useState(null);
    const [nominees, setNominees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [message, setMessage] = useState('');

    const fetchProfile = async () => {
        try {
            const res = await apiClient.get('/profile');
            setProfile(res.data.profile);
            setNominees(res.data.nominees);
        } catch (error) {
            console.error("Error fetching profile", error);
            setMessage("Failed to load profile data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleSync = async () => {
        setSyncing(true);
        setMessage('');
        try {
            const res = await apiClient.post('/profile/sync');
            setProfile(res.data.profile);
            setNominees(res.data.nominees);
            setMessage(res.data.message);
        } catch (error) {
            console.error("Error syncing profile", error);
            setMessage("Failed to sync from Gov Database.");
        } finally {
            setSyncing(false);
            setTimeout(() => setMessage(''), 5000); // Clear message after 5s
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-kfintech-accent"></div>
            </div>
        );
    }

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 md:p-8 max-w-5xl mx-auto"
        >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight drop-shadow-lg">My Profile & KYC</h1>
                    <p className="text-gray-400 mt-2 text-lg font-medium">Manage your personal and nominee details.</p>
                </div>
                <button 
                    onClick={handleSync}
                    disabled={syncing}
                    className="flex items-center gap-2 bg-kfintech-primary hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.4)] hover:shadow-[0_0_25px_rgba(59,130,246,0.6)] transition-all disabled:opacity-50"
                >
                    <RefreshCcw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
                    {syncing ? 'Syncing securely...' : 'Sync from Gov Database'}
                </button>
            </div>

            <AnimatePresence>
                {message && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-6 p-4 bg-kfintech-accent/10 border border-kfintech-accent/50 text-emerald-400 rounded-xl flex items-center gap-3"
                    >
                        <ShieldCheck className="w-6 h-6" />
                        <span className="font-bold">{message}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Personal Information */}
                <div className="glass-panel p-6 rounded-2xl shadow-xl border border-kfintech-border/50">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                        <UserCircle className="w-8 h-8 text-kfintech-primary" />
                        <h2 className="text-2xl font-bold text-white">Personal Information</h2>
                    </div>
                    <div className="space-y-4">
                        <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                            <p className="text-xs text-kfintech-primary font-bold uppercase tracking-widest mb-1">Full Name</p>
                            <p className="text-white text-lg font-medium">{profile?.fullName || 'Not specified'}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                <p className="text-xs text-kfintech-primary font-bold uppercase tracking-widest mb-1">PAN Number</p>
                                <p className="text-white font-mono">{profile?.panNumber || 'Not synced'}</p>
                            </div>
                            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                <p className="text-xs text-kfintech-primary font-bold uppercase tracking-widest mb-1">Aadhaar</p>
                                <p className="text-white font-mono">{profile?.aadharNumber || 'Not synced'}</p>
                            </div>
                        </div>
                        <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                            <p className="text-xs text-kfintech-primary font-bold uppercase tracking-widest mb-1">Date of Birth</p>
                            <p className="text-white">{profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : 'Not specified'}</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Bank Details */}
                    <div className="glass-panel p-6 rounded-2xl shadow-xl border border-kfintech-border/50">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                            <Building className="w-8 h-8 text-emerald-400" />
                            <h2 className="text-2xl font-bold text-white">Bank Details</h2>
                        </div>
                        {profile?.bankDetails?.accountNumber ? (
                            <div className="space-y-4">
                                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                    <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest mb-1">Account Number</p>
                                    <p className="text-white font-mono text-lg">{profile.bankDetails.accountNumber}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                        <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest mb-1">Bank Name</p>
                                        <p className="text-white">{profile.bankDetails.bankName}</p>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                        <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest mb-1">IFSC Code</p>
                                        <p className="text-white font-mono">{profile.bankDetails.ifscCode}</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center p-6 bg-white/5 rounded-xl border border-white/5 text-gray-400">
                                Bank details not synced yet.
                            </div>
                        )}
                    </div>

                    {/* Nominee Information */}
                    <div className="glass-panel p-6 rounded-2xl shadow-xl border border-kfintech-border/50">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                            <FileText className="w-8 h-8 text-purple-400" />
                            <h2 className="text-2xl font-bold text-white">Nominees</h2>
                        </div>
                        {nominees.length > 0 ? (
                            <div className="space-y-4">
                                {nominees.map((nominee, idx) => (
                                    <div key={idx} className="bg-white/5 p-5 rounded-xl border border-white/5 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 bg-purple-500/20 text-purple-400 font-bold px-3 py-1 rounded-bl-lg text-sm border-b border-l border-purple-500/30">
                                            {nominee.allocationPercentage}% Allocation
                                        </div>
                                        <p className="text-xl font-bold text-white mb-2">{nominee.fullName}</p>
                                        <div className="flex items-center gap-4 text-sm text-gray-300">
                                            <span><span className="text-purple-400 font-bold">Rel:</span> {nominee.relationship}</span>
                                            <span><span className="text-purple-400 font-bold">PAN:</span> <span className="font-mono">{nominee.panNumber}</span></span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center p-6 bg-white/5 rounded-xl border border-white/5 text-gray-400">
                                No nominees registered.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default InvestorProfileTab;
