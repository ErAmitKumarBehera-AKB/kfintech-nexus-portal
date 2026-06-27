import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/client';
import { User, Mail, Phone, Lock, FileText, Download, ShieldCheck, MapPin, Building, Map } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

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



    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-12">
            <div>
                <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Profile Settings</h1>
                <p className="text-sm text-zinc-500 mt-1">Manage your personal information, security, and KYC documents.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <Card className="border-zinc-200 shadow-sm bg-white">
                        <CardHeader className="border-b border-zinc-100 pb-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <User className="w-5 h-5 text-zinc-500" /> Personal Information
                            </CardTitle>
                            <CardDescription>Update your contact and address details.</CardDescription>
                        </CardHeader>
                        
                        <form onSubmit={handleProfileUpdate}>
                            <CardContent className="space-y-6 pt-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Full Name</Label>
                                        <Input 
                                            type="text" 
                                            value={profileData.name} 
                                            onChange={e => setProfileData({...profileData, name: e.target.value})}
                                            required
                                            className="bg-white border-zinc-200"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Email Address</Label>
                                        <Input 
                                            type="email" 
                                            value={user?.email || ''} 
                                            disabled
                                            className="bg-zinc-50 text-zinc-500 border-zinc-200"
                                        />
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <Label>Phone Number</Label>
                                    <Input 
                                        type="tel" 
                                        required
                                        value={profileData.phoneNumber} 
                                        onChange={e => setProfileData({...profileData, phoneNumber: e.target.value})}
                                        className="bg-white border-zinc-200 max-w-sm"
                                    />
                                </div>

                                <div className="space-y-4 pt-2">
                                    <h3 className="text-sm font-medium text-zinc-900 flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-zinc-500" /> Address Details
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Street Address</Label>
                                            <Input 
                                                type="text" 
                                                required
                                                value={profileData.street} 
                                                onChange={e => setProfileData({...profileData, street: e.target.value})}
                                                className="bg-white border-zinc-200"
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>City</Label>
                                                <Input 
                                                    type="text" 
                                                    required
                                                    value={profileData.city} 
                                                    onChange={e => setProfileData({...profileData, city: e.target.value})}
                                                    className="bg-white border-zinc-200"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>State</Label>
                                                <Input 
                                                    type="text" 
                                                    required
                                                    value={profileData.state} 
                                                    onChange={e => setProfileData({...profileData, state: e.target.value})}
                                                    className="bg-white border-zinc-200"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {!user?.profileCompleted && (
                                    <div className="space-y-4 pt-4 border-t border-zinc-100">
                                        <h3 className="text-sm font-medium text-zinc-900">Required Documents for KYC</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Aadhaar Card <span className="text-red-500">*</span></Label>
                                                <Input 
                                                    type="file" 
                                                    required={!user?.kyc?.aadhaar}
                                                    accept="image/jpeg, image/png"
                                                    onChange={(e) => setAadhaarDoc(e.target.files[0])}
                                                    className="bg-white border-zinc-200 file:text-zinc-700"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>PAN Card <span className="text-red-500">*</span></Label>
                                                <Input 
                                                    type="file" 
                                                    required={!user?.kyc?.pan}
                                                    accept="image/jpeg, image/png"
                                                    onChange={(e) => setPanDoc(e.target.files[0])}
                                                    className="bg-white border-zinc-200 file:text-zinc-700"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                {profileMessage.text && (
                                    <Alert variant={profileMessage.type === 'error' ? 'destructive' : 'default'} className={profileMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : ''}>
                                        <AlertDescription>{profileMessage.text}</AlertDescription>
                                    </Alert>
                                )}
                            </CardContent>
                            <CardFooter className="bg-zinc-50 border-t border-zinc-100 py-4 flex justify-end">
                                <Button type="submit" disabled={loadingProfile} className="bg-zinc-900 text-white hover:bg-zinc-800">
                                    {loadingProfile ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                </div>

                <div className="space-y-6">
                    {/* Security Card */}
                    <Card className="border-zinc-200 shadow-sm bg-white">
                        <CardHeader className="pb-3 border-b border-zinc-100">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Lock className="w-4 h-4 text-zinc-500" /> Security
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-zinc-900">Password</p>
                                <p className="text-xs text-zinc-500">Last changed 3 months ago</p>
                            </div>
                            <Button variant="outline" className="w-full text-zinc-600">Change Password</Button>
                        </CardContent>
                    </Card>

                    {/* KYC Documents */}
                    {user?.profileCompleted && (
                        <Card className="border-zinc-200 shadow-sm bg-white">
                            <CardHeader className="pb-3 border-b border-zinc-100">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                                        <ShieldCheck className="w-4 h-4 text-emerald-600" /> KYC Documents
                                    </CardTitle>
                                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Verified</Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-4">
                                <p className="text-xs text-zinc-500 leading-relaxed">
                                    Your KYC verification is complete. You can download the submitted documents below.
                                </p>
                                
                                <div className="space-y-3">
                                    {[
                                        { title: 'Aadhaar Card', icon: FileText, url: user?.kyc?.aadhaar },
                                        { title: 'PAN Card', icon: FileText, url: user?.kyc?.pan }
                                    ].filter(doc => doc.url).map((doc, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 border border-zinc-200 rounded-lg bg-zinc-50 hover:bg-zinc-100 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-white rounded shadow-sm shrink-0">
                                                    <doc.icon className="w-4 h-4 text-zinc-500" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-zinc-900">{doc.title}</p>
                                                    <p className="text-[10px] text-zinc-500">Submitted</p>
                                                </div>
                                            </div>
                                            <a 
                                                href={doc.url} 
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200 rounded-md transition-colors shrink-0">
                                                <Download className="w-4 h-4" />
                                            </a>
                                        </div>
                                    ))}
                                    {(!user?.kyc?.aadhaar && !user?.kyc?.pan) && (
                                        <p className="text-sm text-zinc-500 text-center py-2">No documents found.</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;
