import React, { useState } from 'react';
import { User, Shield, Key, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';

const ProfilePage = () => {
    const { user } = useAuth();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const [status, setStatus] = useState(null); // { type: 'success' | 'error', message: string }
    const [loading, setLoading] = useState(false);

    const handleChangePassword = async (e) => {
        e.preventDefault();
        
        if (newPassword !== confirmPassword) {
            setStatus({ type: 'error', message: 'New passwords do not match' });
            return;
        }

        if (newPassword.length < 6) {
            setStatus({ type: 'error', message: 'New password must be at least 6 characters' });
            return;
        }

        setLoading(true);
        setStatus(null);

        try {
            await apiClient.post('/auth/change-password', {
                currentPassword,
                newPassword
            });
            setStatus({ type: 'success', message: 'Password updated successfully' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            setStatus({ 
                type: 'error', 
                message: error.response?.data?.message || 'Failed to update password' 
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight mb-2">My Profile</h1>
                    <p className="text-gray-400">Manage your account settings and security preferences.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Profile Details Card */}
                <div className="md:col-span-2 bg-kfintech-bg p-6 md:p-8 rounded-2xl border border-kfintech-border shadow-xl">
                    <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/5">
                        <div className="p-3 rounded-xl bg-kfintech-primary/10 text-kfintech-primary">
                            <User className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Account Details</h2>
                            <p className="text-sm text-gray-400">Your personal information</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Full Name</label>
                            <div className="text-white bg-white/5 px-4 py-3 rounded-xl border border-white/5">
                                {user?.name}
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email Address</label>
                            <div className="text-white bg-white/5 px-4 py-3 rounded-xl border border-white/5">
                                {user?.email}
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Account Role</label>
                            <div className="text-white bg-white/5 px-4 py-3 rounded-xl border border-white/5">
                                {user?.role}
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">KYC Status</label>
                            <div className="flex items-center gap-2 bg-white/5 px-4 py-3 rounded-xl border border-white/5">
                                <Shield className="w-4 h-4 text-orange-400" />
                                <span className="text-orange-400 font-medium">Pending Update</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Password Change Card */}
                <div className="md:col-span-1 bg-kfintech-bg p-6 md:p-8 rounded-2xl border border-kfintech-border shadow-xl">
                    <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/5">
                        <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
                            <Key className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Security</h2>
                            <p className="text-sm text-gray-400">Update password</p>
                        </div>
                    </div>

                    <form onSubmit={handleChangePassword} className="space-y-4">
                        {status && (
                            <div className={`p-3 rounded-xl flex items-start gap-2 text-sm ${status.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                                {status.type === 'error' ? <AlertCircle className="w-4 h-4 mt-0.5" /> : <CheckCircle2 className="w-4 h-4 mt-0.5" />}
                                <span>{status.message}</span>
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Current Password</label>
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-kfintech-primary focus:ring-1 focus:ring-kfintech-primary transition-all"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">New Password</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-kfintech-primary focus:ring-1 focus:ring-kfintech-primary transition-all"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Confirm New Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-kfintech-primary focus:ring-1 focus:ring-kfintech-primary transition-all"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-4 bg-kfintech-primary hover:bg-opacity-90 disabled:opacity-50 text-white font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 mt-6"
                        >
                            {loading ? 'Updating...' : 'Change Password'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
