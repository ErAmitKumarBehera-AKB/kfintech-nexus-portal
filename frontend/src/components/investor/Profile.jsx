import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/client';
import { User, Lock, FileText, Download, ShieldCheck, MapPin, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { QRCodeSVG } from 'qrcode.react';
import { authApi } from '../../api/auth.api';
import { CometCard } from '../ui/comet-card';

const INDIAN_BANKS = [
    "HDFC Bank", "State Bank of India (SBI)", "ICICI Bank", "Axis Bank", 
    "Kotak Mahindra Bank", "IndusInd Bank", "Punjab National Bank (PNB)", 
    "Bank of Baroda", "Canara Bank", "Union Bank of India"
];

const Profile = () => {
    const { user, updateSession } = useAuth();
    const navigate = useNavigate();
    
    const [profileData, setProfileData] = useState({
        name: user?.name || '',
        dob: user?.dob ? user.dob.split('T')[0] : '',
        phoneNumber: user?.phoneNumber || '',
        street: user?.address?.street || '',
        city: user?.address?.city || '',
        state: user?.address?.state || '',
        bankName: user?.bankAccount?.bankName || '',
        accountNumber: user?.bankAccount?.accountNumber || '',
        ifscCode: user?.bankAccount?.ifsc || ''
    });
    const [loadingProfile, setLoadingProfile] = useState(false);
    const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });
    
    const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
    const [modalType, setModalType] = useState('GOOGLE'); // 'GOOGLE' or 'EMAIL'
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [timeLeft, setTimeLeft] = useState(30);
    const [isSettingUp2FA, setIsSettingUp2FA] = useState(false);
    const [is2FAEnabled, setIs2FAEnabled] = useState(user?.twoFactorEnabled || false);
    const [twoFactorType, setTwoFactorType] = useState(user?.twoFactorType || 'EMAIL');

    useEffect(() => {
        let timer;
        if (is2FAModalOpen && modalType === 'EMAIL' && timeLeft > 0) {
            timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        }
        return () => clearInterval(timer);
    }, [is2FAModalOpen, modalType, timeLeft]);

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setLoadingProfile(true);
        setProfileMessage({ type: '', text: '' });
        try {
            const formData = new FormData();
            formData.append('name', profileData.name);
            formData.append('dob', profileData.dob);
            formData.append('phoneNumber', profileData.phoneNumber);
            formData.append('address', JSON.stringify({ 
                street: profileData.street, 
                city: profileData.city, 
                state: profileData.state 
            }));
            formData.append('bankAccount', JSON.stringify({
                bankName: profileData.bankName,
                accountNumber: profileData.accountNumber,
                ifsc: profileData.ifscCode
            }));
            
            const res = await apiClient.put('/auth/profile', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            let messageText = res.data.message || 'Profile updated successfully!';
            toast.success(messageText);

            if (res.data.user) {
                if (typeof updateSession === 'function') {
                    updateSession(res.data.user);
                } else {
                    window.location.reload(); 
                }
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoadingProfile(false);
        }
    };

    const handleOpen2FASetup = async (type = 'GOOGLE') => {
        setIs2FAModalOpen(true);
        setModalType(type);
        setIsSettingUp2FA(true);
        try {
            if (type === 'GOOGLE') {
                const res = await authApi.generate2FA();
                if (res.data.success) {
                    setQrCodeUrl(res.data.otpauthUrl);
                }
            } else if (type === 'EMAIL') {
                await authApi.generateEmail2FA();
                setTimeLeft(30);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || `Failed to generate ${type} 2FA`);
            setIs2FAModalOpen(false);
        } finally {
            setIsSettingUp2FA(false);
        }
    };

    const handleResendEmail2FA = async () => {
        try {
            setIsSettingUp2FA(true);
            await authApi.generateEmail2FA();
            setTimeLeft(30);
            toast.success('A new OTP has been sent to your email.');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to resend OTP.');
        } finally {
            setIsSettingUp2FA(false);
        }
    };

    const handleVerify2FA = async (e) => {
        e.preventDefault();
        try {
            if (modalType === 'GOOGLE') {
                const res = await authApi.verify2FA(otpCode);
                if (res.data.success) {
                    toast.success('2FA Authenticator verified! OTP 2FA during login enabled.');
                    setIs2FAEnabled(true);
                    setTwoFactorType('GOOGLE');
                    setIs2FAModalOpen(false);
                    setOtpCode('');
                }
            } else if (modalType === 'EMAIL') {
                const res = await authApi.verifyEmail2FA(otpCode);
                if (res.data.success) {
                    toast.success('2FA preference updated to Email OTP');
                    setTwoFactorType('EMAIL');
                    setIs2FAModalOpen(false);
                    setOtpCode('');
                    if (res.data.user) {
                        updateSession(res.data.user);
                    }
                }
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Invalid verification code');
        }
    };

    const handle2FATypeChange = async (type) => {
        if (type === 'PHONE') return; // Disabled

        if (type === 'GOOGLE' && !is2FAEnabled) {
            handleOpen2FASetup('GOOGLE');
            return;
        }

        if (type === 'EMAIL') {
            // Trigger Email setup flow to verify their email can receive OTP
            handleOpen2FASetup('EMAIL');
            return;
        }

        // If they already have Google 2FA enabled and are just switching back to it
        try {
            setLoadingProfile(true);
            const res = await authApi.updateProfile({ twoFactorType: type });
            setTwoFactorType(type);
            toast.success(`2FA preference updated to ${type === 'GOOGLE' ? 'Authenticator App' : 'Email OTP'}`);
            updateSession(res.data.user);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update 2FA preference');
        } finally {
            setLoadingProfile(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-12">
            <div>
                <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">Profile Settings</h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Manage your personal information, security, and KYC documents.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-[#131313]">
                        <CardHeader className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
                            <CardTitle className="text-lg flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                                <User className="w-5 h-5 text-zinc-500 dark:text-zinc-400" /> Personal Information
                            </CardTitle>
                            <CardDescription className="text-zinc-500 dark:text-zinc-400">Update your contact and address details.</CardDescription>
                        </CardHeader>
                        
                        <form onSubmit={handleProfileUpdate}>
                            <CardContent className="space-y-6 pt-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-zinc-900 dark:text-zinc-100">Full Name</Label>
                                        <Input 
                                            type="text" 
                                            value={profileData.name} 
                                            onChange={e => setProfileData({...profileData, name: e.target.value})}
                                            required
                                            className="bg-white dark:bg-[#131313] border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-zinc-900 dark:text-zinc-100">Email Address</Label>
                                        <Input 
                                            type="email" 
                                            value={user?.email || ''} 
                                            disabled
                                            className="bg-zinc-50 dark:bg-[#1A1A1A] text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800"
                                        />
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-zinc-900 dark:text-zinc-100">Phone Number</Label>
                                        <Input 
                                            type="tel" 
                                            required
                                            value={profileData.phoneNumber} 
                                            onChange={e => setProfileData({...profileData, phoneNumber: e.target.value})}
                                            className="bg-white dark:bg-[#131313] border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-zinc-900 dark:text-zinc-100">Date of Birth</Label>
                                        <Input 
                                            type="date" 
                                            required
                                            value={profileData.dob} 
                                            onChange={e => setProfileData({...profileData, dob: e.target.value})}
                                            className="bg-white dark:bg-[#131313] border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 dark:[color-scheme:dark]"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4 pt-2">
                                    <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-zinc-500 dark:text-zinc-400" /> Address Details
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-zinc-900 dark:text-zinc-100">Street Address</Label>
                                            <Input 
                                                type="text" 
                                                required
                                                value={profileData.street} 
                                                onChange={e => setProfileData({...profileData, street: e.target.value})}
                                                className="bg-white dark:bg-[#131313] border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-zinc-900 dark:text-zinc-100">City</Label>
                                                <Input 
                                                    type="text" 
                                                    required
                                                    value={profileData.city} 
                                                    onChange={e => setProfileData({...profileData, city: e.target.value})}
                                                    className="bg-white dark:bg-[#131313] border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-zinc-900 dark:text-zinc-100">State</Label>
                                                <Input 
                                                    type="text" 
                                                    required
                                                    value={profileData.state} 
                                                    onChange={e => setProfileData({...profileData, state: e.target.value})}
                                                    className="bg-white dark:bg-[#131313] border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                                    <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                                        <Building2 className="w-4 h-4 text-zinc-500 dark:text-zinc-400" /> Bank Details
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-zinc-900 dark:text-zinc-100">Bank Name</Label>
                                            <Select value={profileData.bankName} onValueChange={(val) => setProfileData({...profileData, bankName: val})} required>
                                                <SelectTrigger className="w-full bg-white dark:bg-[#131313] border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100">
                                                    <SelectValue placeholder="Select Bank" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white dark:bg-[#131313] border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100">
                                                    {INDIAN_BANKS.map((b) => (
                                                        <SelectItem key={b} value={b} className="hover:bg-zinc-100 dark:hover:bg-zinc-800">{b}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-zinc-900 dark:text-zinc-100">Account Number</Label>
                                            <Input 
                                                type="text" 
                                                required
                                                value={profileData.accountNumber} 
                                                onChange={e => setProfileData({...profileData, accountNumber: e.target.value})}
                                                className="bg-white dark:bg-[#131313] border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2 max-w-xs">
                                        <Label className="text-zinc-900 dark:text-zinc-100">IFSC Code</Label>
                                        <Input 
                                            type="text" 
                                            required
                                            value={profileData.ifscCode} 
                                            onChange={e => setProfileData({...profileData, ifscCode: e.target.value})}
                                            className="bg-white dark:bg-[#131313] border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 uppercase"
                                            maxLength={11}
                                        />
                                    </div>
                                </div>

                            </CardContent>
                            <CardFooter className="bg-zinc-50 dark:bg-[#1A1A1A] border-t border-zinc-100 dark:border-zinc-800 py-4 flex justify-end">
                                <Button type="submit" disabled={loadingProfile} className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white">
                                    {loadingProfile ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-[#131313]">
                        <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
                            <CardTitle className="text-sm font-medium flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                                <Lock className="w-4 h-4 text-zinc-500 dark:text-zinc-400" /> Security
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Two-Factor Authentication (2FA)</p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                    Protect your account with an extra layer of security during login.
                                </p>
                            </div>
                            
                            <div className="space-y-3 pt-2">
                                <label className="flex items-center space-x-3 cursor-pointer group">
                                    <Checkbox 
                                        checked={twoFactorType === 'EMAIL'}
                                        onCheckedChange={(checked) => checked && handle2FATypeChange('EMAIL')}
                                        className="w-4 h-4 rounded-sm border-zinc-300 dark:border-zinc-700 data-[state=checked]:bg-zinc-900 data-[state=checked]:text-white dark:data-[state=checked]:bg-zinc-100 dark:data-[state=checked]:text-zinc-900 transition-colors"
                                    />
                                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">Email (OTP)</span>
                                </label>
                                
                                <label className="flex items-center space-x-3 cursor-pointer group">
                                    <Checkbox 
                                        checked={twoFactorType === 'GOOGLE'}
                                        onCheckedChange={(checked) => checked && handle2FATypeChange('GOOGLE')}
                                        className="w-4 h-4 rounded-sm border-zinc-300 dark:border-zinc-700 data-[state=checked]:bg-zinc-900 data-[state=checked]:text-white dark:data-[state=checked]:bg-zinc-100 dark:data-[state=checked]:text-zinc-900 transition-colors"
                                    />
                                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">Authenticator App</span>
                                </label>

                                <label className="flex items-center space-x-3 cursor-not-allowed opacity-50">
                                    <Checkbox 
                                        disabled
                                        className="w-4 h-4 rounded-sm border-zinc-200 dark:border-zinc-800"
                                    />
                                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                                        Phone (SMS)
                                        <span className="text-[10px] bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded-full">Coming Soon</span>
                                    </span>
                                </label>
                            </div>

                            {twoFactorType === 'GOOGLE' && !is2FAEnabled && (
                                <Button 
                                    variant="outline" 
                                    className="w-full mt-4 text-zinc-900 dark:text-zinc-100 dark:border-zinc-700 dark:hover:bg-[#1A1A1A]" 
                                    onClick={handleOpen2FASetup}
                                >
                                    Finish Setup
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* 2FA Setup Modal with Backdrop Blur and CometCard */}
            {is2FAModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIs2FAModalOpen(false)} />
                    <div className="relative z-10 w-full max-w-sm">
                        <CometCard>
                            <div className="flex flex-col items-center bg-white dark:bg-[#1F2121] p-8 rounded-2xl border border-zinc-200 dark:border-white/10 shadow-2xl">
                                <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
                                    {modalType === 'GOOGLE' ? 'Setup Authenticator App' : 'Verify Email 2FA'}
                                </h3>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center mb-6">
                                    {modalType === 'GOOGLE' 
                                        ? "Scan the QR code below with your preferred Authenticator app."
                                        : "We've sent a 6-digit OTP to your email. Please enter it below to confirm."}
                                </p>
                                
                                {isSettingUp2FA ? (
                                    <div className="w-48 h-48 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl animate-pulse flex items-center justify-center mb-6">
                                        <span className="text-zinc-400">Generating...</span>
                                    </div>
                                ) : (
                                    modalType === 'GOOGLE' && (
                                        <div className="p-3 bg-white rounded-xl shadow-sm border border-zinc-100 mb-6">
                                            {qrCodeUrl ? (
                                                <QRCodeSVG value={qrCodeUrl} size={180} />
                                            ) : (
                                                <div className="w-[180px] h-[180px] bg-zinc-50 flex items-center justify-center">Error</div>
                                            )}
                                        </div>
                                    )
                                )}

                                <form onSubmit={handleVerify2FA} className="w-full space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <Label className="text-zinc-900 dark:text-zinc-100">Confirmation Code</Label>
                                            {modalType === 'EMAIL' && (
                                                <div className="text-xs">
                                                    {timeLeft > 0 ? (
                                                        <span className="text-zinc-500 dark:text-zinc-400">Resend in {timeLeft}s</span>
                                                    ) : (
                                                        <button 
                                                            type="button" 
                                                            onClick={handleResendEmail2FA} 
                                                            className="text-zinc-900 dark:text-zinc-100 font-medium hover:underline"
                                                        >
                                                            Resend OTP
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <Input 
                                            type="text" 
                                            placeholder="Enter 6-digit code"
                                            value={otpCode}
                                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            className="text-center tracking-widest text-lg bg-zinc-50 dark:bg-black/50 border-zinc-200 dark:border-zinc-800"
                                            required
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button 
                                            type="button" 
                                            variant="outline" 
                                            className="w-1/2" 
                                            onClick={() => setIs2FAModalOpen(false)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button 
                                            type="submit" 
                                            className="w-1/2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                                            disabled={otpCode.length !== 6}
                                        >
                                            Verify
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </CometCard>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
