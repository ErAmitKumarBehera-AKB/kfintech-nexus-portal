import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/client';
import { User, Mail, Phone, Lock, FileText, Download, ShieldCheck } from 'lucide-react';

const Profile = () => {
    const { user, updateSession } = useAuth();
    
    // Forms state
    const [profileData, setProfileData] = useState({
        name: user?.name || '',
        phoneNumber: user?.phoneNumber || '',
        street: user?.address?.street || '',
        city: user?.address?.city || '',
        state: user?.address?.state || ''
    });
    const [aadhaarDoc, setAadhaarDoc] = useState(null);
    const [panDoc, setPanDoc] = useState(null);

    const [loadingProfile, setLoadingProfile] = useState(false);
    const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setLoadingProfile(true);
        setProfileMessage({ type: '', text: '' });
        try {
            const formData = new FormData();
            formData.append('name', profileData.name);
            formData.append('phoneNumber', profileData.phoneNumber);
            formData.append('address', JSON.stringify({ 
                street: profileData.street, 
                city: profileData.city, 
                state: profileData.state 
            }));
            
            if (aadhaarDoc) formData.append('aadhaarDoc', aadhaarDoc);
            if (panDoc) formData.append('panDoc', panDoc);

            const res = await apiClient.put('/auth/profile', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setProfileMessage({ type: 'success', text: res.data.message || 'Profile updated successfully!' });
            
            // If the backend says the profile is completed, or returns updated user, refresh session
            if (res.data.user) {
                if (typeof updateSession === 'function') {
                    updateSession(res.data.user);
                } else {
                    window.location.reload(); 
                }
            }
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
        <div>
            <div>
                <h1>Profile Settings</h1>
                <p>Manage your personal information, security, and KYC documents.</p>
            </div>

            <div>
                {/* Personal Information */}
                <div>
                    <h2>
                        <User  /> Personal Information
                    </h2>
                    <form onSubmit={handleProfileUpdate}>
                        <div>
                            <label>Full Name</label>
                            <input 
                                type="text" 
                                value={profileData.name} 
                                onChange={e => setProfileData({...profileData, name: e.target.value})}
                                 
                                required
                            />
                        </div>
                        <div>
                            <label>Email Address</label>
                            <input 
                                type="email" 
                                value={user?.email || ''} 
                                disabled
                                 
                            />
                        </div>
                        <div>
                            <label>Phone Number</label>
                            <input 
                                type="tel" 
                                required
                                value={profileData.phoneNumber} 
                                onChange={e => setProfileData({...profileData, phoneNumber: e.target.value})}
                                 
                            />
                        </div>
                        <div>
                            <div>
                                <label>Street Address</label>
                                <input 
                                    type="text" 
                                    required
                                    value={profileData.street} 
                                    onChange={e => setProfileData({...profileData, street: e.target.value})}
                                     
                                />
                            </div>
                            <div>
                                <label>City</label>
                                <input 
                                    type="text" 
                                    required
                                    value={profileData.city} 
                                    onChange={e => setProfileData({...profileData, city: e.target.value})}
                                     
                                />
                            </div>
                            <div>
                                <label>State</label>
                                <input 
                                    type="text" 
                                    required
                                    value={profileData.state} 
                                    onChange={e => setProfileData({...profileData, state: e.target.value})}
                                     
                                />
                            </div>
                        </div>

                        {!user?.profileCompleted && (
                            <div>
                                <h3>Required Documents for KYC</h3>
                                <div>
                                    <div>
                                        <label>Aadhaar Card</label>
                                        <input 
                                            type="file" 
                                            required={!user?.kyc?.aadhaar}
                                            accept="image/jpeg, image/png"
                                            onChange={(e) => setAadhaarDoc(e.target.files[0])}
                                            
                                        />
                                    </div>
                                    <div>
                                        <label>PAN Card</label>
                                        <input 
                                            type="file" 
                                            required={!user?.kyc?.pan}
                                            accept="image/jpeg, image/png"
                                            onChange={(e) => setPanDoc(e.target.files[0])}
                                            
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {profileMessage.text && (
                            <div>
                                {profileMessage.text}
                            </div>
                        )}

                        <button 
                            type="submit" 
                            disabled={loadingProfile}>
                            {loadingProfile ? 'Saving...' : 'Save Changes'}
                        </button>
                    </form>
                </div>
            </div>

            {/* KYC Documents - Only show if profile is completed */}
            {user?.profileCompleted && (
                <div>
                    <div>
                        <h2>
                            <ShieldCheck  /> KYC Documents
                        </h2>
                        <span>
                            Verified
                        </span>
                    </div>
                    
                    <p>Your KYC verification is complete. You can download the submitted documents below.</p>
                    
                    <div>
                        {[
                            { title: 'Aadhaar Card', icon: FileText },
                            { title: 'PAN Card', icon: FileText },
                            { title: 'Bank Proof (Cancelled Cheque)', icon: FileText }
                        ].map((doc, idx) => (
                            <div key={idx}>
                                <div>
                                    <div>
                                        <doc.icon  />
                                    </div>
                                    <div>
                                        <h3>{doc.title}</h3>
                                        <p>PDF • Encrypted</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleDownloadKyc(doc.title.replace(/\s+/g, '_'))}>
                                    <Download  /> Download
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
