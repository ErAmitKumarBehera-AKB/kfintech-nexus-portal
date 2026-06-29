import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authApi } from '../../api/auth.api';
import { Activity, Eye, EyeOff } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordRequirementsPopup, PasswordMatchPopup } from "@/components/common/PasswordPopups";

const ForgotPasswordPage = () => {
    const location = useLocation();
    const [email, setEmail] = useState(location.state?.email || '');
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const [isOtpStep, setIsOtpStep] = useState(false);
    const [timeLeft, setTimeLeft] = useState(30);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        let timer;
        if (isOtpStep && timeLeft > 0) {
            timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        }
        return () => clearInterval(timer);
    }, [isOtpStep, timeLeft]);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    const [isPasswordFocused, setIsPasswordFocused] = useState(false);
    const [isConfirmPasswordFocused, setIsConfirmPasswordFocused] = useState(false);

    const navigate = useNavigate();

    const handleSendOtp = async (e) => {
        e.preventDefault();
        if (!email) {
            setError('Please enter your email.');
            return;
        }
        setIsLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            await authApi.forgotPassword(email.trim().toLowerCase());
            setSuccessMessage('An OTP has been sent to your email.');
            setTimeLeft(30);
            setIsOtpStep(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to process request.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setIsLoading(true);
        setError('');
        setSuccessMessage('');
        try {
            await authApi.forgotPassword(email.trim().toLowerCase());
            setSuccessMessage('A new OTP has been sent to your email.');
            setTimeLeft(30);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to resend OTP.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (!otp || !password || !confirmPassword) {
            setError('Please fill in all fields.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setIsLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            await authApi.resetPassword(email.trim().toLowerCase(), otp, password);
            navigate('/login', { replace: true, state: { message: 'Password successfully reset! Please login with your new password.' } });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password. OTP may be invalid.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-zinc-50 selection:bg-zinc-200">
            <div className="w-full max-w-sm">
                <Card className="rounded-md border-zinc-200 bg-white shadow-sm">
                    <CardHeader className="space-y-1 text-center pb-6 pt-8">
                        <div className="flex justify-center mb-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded bg-zinc-900 text-zinc-50">
                                <Activity className="h-5 w-5 stroke-[2]" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl font-semibold tracking-tight text-zinc-900">
                            {isOtpStep ? 'Reset Password' : 'Forgot Password'}
                        </CardTitle>
                        <CardDescription className="text-sm text-zinc-500">
                            {isOtpStep 
                                ? 'Create a new password for your account' 
                                : 'Enter your email to receive a reset code'}
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="pb-8">
                        {error && (
                            <div className="mb-4 p-3 rounded-md bg-red-50 text-red-600 text-sm font-medium text-center border border-red-100">
                                {error}
                            </div>
                        )}
                        {successMessage && (
                            <div className="mb-4 p-3 rounded-md bg-green-50 text-green-700 text-sm font-medium text-center border border-green-100">
                                {successMessage}
                            </div>
                        )}

                        {!isOtpStep ? (
                            <form onSubmit={handleSendOtp} className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="email" className="text-zinc-700 font-medium">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="name@company.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="bg-transparent border-zinc-200 focus-visible:ring-zinc-900"
                                    />
                                </div>

                                <Button 
                                    type="submit" 
                                    className="w-full mt-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-50 rounded-md"
                                    disabled={isLoading}>
                                    {isLoading ? 'Sending...' : 'Send reset code'}
                                </Button>
                            </form>
                        ) : (
                            <form onSubmit={handleResetPassword} className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="otp" className="text-zinc-700 font-medium">6-Digit Code</Label>
                                    <Input
                                        id="otp"
                                        type="text"
                                        maxLength={6}
                                        placeholder="000000"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                        className="bg-transparent border-zinc-200 focus-visible:ring-zinc-900 text-center tracking-widest text-lg"
                                    />
                                    <div className="flex justify-end items-center text-xs mt-1">
                                        {timeLeft > 0 ? (
                                            <span className="text-zinc-500 font-medium">Resend code in <span className="text-zinc-900">{timeLeft}s</span></span>
                                        ) : (
                                            <button type="button" onClick={handleResendOtp} disabled={isLoading} className="text-zinc-900 font-semibold hover:underline disabled:opacity-50">
                                                Resend OTP
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="password" className="text-zinc-700 font-medium">New Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            onFocus={() => setIsPasswordFocused(true)}
                                            onBlur={() => setIsPasswordFocused(false)}
                                            onCopy={(e) => e.preventDefault()}
                                            className="bg-transparent border-zinc-200 focus-visible:ring-zinc-900 pr-10"
                                        />
                                        <Button 
                                            variant="ghost"
                                            size="sm"
                                            className="absolute right-0 top-0 h-9 px-3 py-2 text-zinc-500 hover:text-zinc-900 hover:bg-transparent"
                                            type="button" 
                                            onPointerDown={(e) => e.preventDefault()}
                                            onClick={() => setShowPassword(v => !v)}>
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                    <PasswordRequirementsPopup 
                                        passwordValue={password} 
                                        isVisible={isPasswordFocused} 
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="confirmPassword" className="text-zinc-700 font-medium">Confirm New Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="confirmPassword"
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            placeholder="••••••••"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            onFocus={() => setIsConfirmPasswordFocused(true)}
                                            onBlur={() => setIsConfirmPasswordFocused(false)}
                                            onCopy={(e) => e.preventDefault()}
                                            className="bg-transparent border-zinc-200 focus-visible:ring-zinc-900 pr-10"
                                        />
                                        <Button 
                                            variant="ghost"
                                            size="sm"
                                            className="absolute right-0 top-0 h-9 px-3 py-2 text-zinc-500 hover:text-zinc-900 hover:bg-transparent"
                                            type="button" 
                                            onPointerDown={(e) => e.preventDefault()}
                                            onClick={() => setShowConfirmPassword(v => !v)}>
                                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                    <PasswordMatchPopup 
                                        passwordValue={password} 
                                        confirmPasswordValue={confirmPassword} 
                                        isVisible={isConfirmPasswordFocused} 
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3 mt-2">
                                    <Button
                                        variant="outline"
                                        type="button"
                                        className="rounded-md border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                                        onClick={() => {
                                            setIsOtpStep(false);
                                            setSuccessMessage('');
                                            setError('');
                                        }}>
                                        Cancel
                                    </Button>
                                    <Button 
                                        type="submit"
                                        className="rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-50"
                                        disabled={isLoading || otp.length !== 6}>
                                        {isLoading ? 'Resetting...' : 'Reset password'}
                                    </Button>
                                </div>
                            </form>
                        )}

                        <div className="mt-6 text-center text-sm text-zinc-500">
                            Remembered it?{' '}
                            <Link to="/login" state={{ email }} className="font-medium text-zinc-900 hover:underline underline-offset-4">
                                Log in
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
