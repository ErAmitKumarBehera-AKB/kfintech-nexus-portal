import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/client';
import { User, Mail, Phone, Lock, FileText, Download, ShieldCheck } from 'lucide-react';

const Profile = () => {
    const { user, login } = useAuth(); // We might use login to refresh context if needed
    
    // Forms state
    const [profileData, setProfileData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phoneNumber: user?.phoneNumber || ''
    });

    const [loadingProfile, setLoadingProfile] = useState(false);
    const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setLoadingProfile(true);
        setProfileMessage({ type: '', text: '' });
        try {
            const res = await apiClient.put('/auth/profile', profileData);
            setProfileMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (error) {
            setProfileMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update profile' });
        } finally {
            setLoadingProfile(false);
        }
    };

    const handleDownloadKyc = (docName) => {
        // Mock download logic
        const link = document.createElement('a');
        link.href = 'data:application/pdf;base64,JVBERi0xLjQKJcOkw7zDtsOfCjIgMCBvYmoKPDwvTGVuZ3RoIDMgMCBSL0ZpbHRlci9GbGF0ZURlY29kZT4+CnN0cmVhbQp4nDPQM1Qo5ypUMFAwALJMLU31jBQsTAz1LBSKihQK0vMUMvNzU4FygRzNJL+sVMNSM6+M0sy0/GSFkvyi4pKkRDC3SjFBoQC0vE8/CmVuZHN0cmVhbQplbmRvYmoKCjMgMCBvYmoKMzEKZW5kb2JqCgo0IDAgb2JqCjw8L1R5cGUvUGFnZS9NZWRpYUJveFswIDAgNTk1IDg0Ml0vUmVzb3VyY2VzPDwvRm9udDw8L0YxIDEgMCBSPj4+Pi9Db250ZW50cyAyIDAgUi9QYXJlbnQgNSAwIFI+PgplbmRvYmoKCjEgMCBvYmoKPDwvVHlwZS9Gb250L1N1YnR5cGUvVHlwZTEvQmFzZUZvbnQvSGVsdmV0aWNhPj4KZW5kb2JqCgo1IDAgb2JqCjw8L1R5cGUvUGFnZXMvQ291bnQgMS9LaWRzWzQgMCBSXT4+CmVuZG9iagoKNiAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgNSAwIFI+PgplbmRvYmoKCjcgMCBvYmoKPDwvUHJvZHVjZXIoTW9jayBQREYgR2VuZXJhdG9yKS9DcmVhdGlvbkRhdGUoRDoyMDIzMTAyNzEyMDAwMFopPj4KZW5kb2JqCgp4cmVmCjAgOAowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAyMjUgMDAwMDAgbiAKMDAwMDAwMDAxOSAwMDAwMCBuIAowMDAwMDAwMTE1IDAwMDAwIG4gCjAwMDAwMDAxMzYgMDAwMDAgbiAKMDAwMDAwMDI3MyAwMDAwMCBuIAowMDAwMDAwMzE4IDAwMDAwIG4gCjAwMDAwMDAzNjIgMDAwMDAgbiAKdHJhaWxlcgo8PC9TaXplIDgvUm9vdCA2IDAgUi9JbmZvIDcgMCBSPj4Kc3RhcnR4cmVmCjQ1NQolJUVPRgo=';
        link.download = `${docName}_Mock.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const inputClass = "w-full bg-kfintech-card border border-kfintech-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-kfintech-primary/50 focus:border-kfintech-primary transition-all";

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
            <div>
                <h1 className="text-2xl font-black text-white">Profile Settings</h1>
                <p className="text-gray-400 text-sm">Manage your personal information, security, and KYC documents.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Personal Information */}
                <div className="bg-kfintech-card border border-kfintech-border rounded-2xl p-6 shadow-lg">
                    <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <User className="w-5 h-5 text-kfintech-primary" /> Personal Information
                    </h2>
                    <form onSubmit={handleProfileUpdate} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Full Name</label>
                            <input 
                                type="text" 
                                value={profileData.name} 
                                onChange={e => setProfileData({...profileData, name: e.target.value})}
                                className={inputClass} 
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Email Address</label>
                            <input 
                                type="email" 
                                value={profileData.email} 
                                onChange={e => setProfileData({...profileData, email: e.target.value})}
                                className={inputClass} 
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Phone Number</label>
                            <input 
                                type="tel" 
                                value={profileData.phoneNumber} 
                                onChange={e => setProfileData({...profileData, phoneNumber: e.target.value})}
                                className={inputClass} 
                            />
                        </div>
                        
                        {profileMessage.text && (
                            <div className={`p-3 rounded-lg text-sm font-medium ${profileMessage.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/30' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'}`}>
                                {profileMessage.text}
                            </div>
                        )}

                        <button 
                            type="submit" 
                            disabled={loadingProfile}
                            className="w-full bg-kfintech-primary hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)] disabled:opacity-50 mt-4"
                        >
                            {loadingProfile ? 'Saving...' : 'Save Changes'}
                        </button>
                    </form>
                </div>
            </div>

            {/* KYC Documents */}
            <div className="bg-kfintech-card border border-kfintech-border rounded-2xl p-6 shadow-lg">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-emerald-500" /> KYC Documents
                    </h2>
                    <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 px-3 py-1 rounded text-xs font-bold uppercase tracking-wider">
                        Verified
                    </span>
                </div>
                
                <p className="text-sm text-gray-400 mb-6">Your KYC verification is complete. You can download the submitted documents below.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        { title: 'Aadhaar Card', icon: FileText },
                        { title: 'PAN Card', icon: FileText },
                        { title: 'Bank Proof (Cancelled Cheque)', icon: FileText }
                    ].map((doc, idx) => (
                        <div key={idx} className="bg-kfintech-bg/50 border border-kfintech-border rounded-xl p-4 flex flex-col justify-between group hover:border-kfintech-primary/40 transition-colors">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                                    <doc.icon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-sm">{doc.title}</h3>
                                    <p className="text-xs text-gray-500 font-mono mt-0.5">PDF • Encrypted</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleDownloadKyc(doc.title.replace(/\s+/g, '_'))}
                                className="w-full flex justify-center items-center gap-2 text-xs font-bold uppercase tracking-wider bg-white/5 hover:bg-white/10 text-white py-2 rounded-lg transition-colors border border-transparent group-hover:border-white/10"
                            >
                                <Download className="w-3 h-3" /> Download
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Profile;
