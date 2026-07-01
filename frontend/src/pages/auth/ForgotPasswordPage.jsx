import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authApi } from '../../api/auth.api';
import { Activity, Eye, EyeOff } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordRequirementsPopup, PasswordMatchPopup } from "@/components/common/PasswordPopups";
import ThemeToggle from '../../components/common/ThemeToggle';
import DotBackgroundDemo from "@/components/ui/DotBackgroundDemo";
import { toast } from "sonner";

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
            toast.success('An OTP has been sent to your email.');
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
            toast.success('A new OTP has been sent to your email.');
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

        try {
            await authApi.resetPassword(email.trim().toLowerCase(), otp, password);
            toast.success('Password successfully reset! Please login with your new password.');
            navigate('/login', { replace: true });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password. OTP may be invalid.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-[#faf9f6] dark:bg-zinc-950 selection:bg-kfintech-primary/30 relative overflow-hidden transition-colors duration-500">
            <DotBackgroundDemo />
            {/* Background Glows for Glassmorphism */}
            <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none z-0 hidden dark:block" />
            <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-kfintech-primary/10 rounded-full blur-[120px] pointer-events-none z-0 hidden dark:block" />

            <div className="absolute top-6 right-6 sm:top-8 sm:right-8 z-20">
                <ThemeToggle />
            </div>

            <div className="w-full max-w-sm relative z-10">
                <Card className="rounded-2xl border border-black/5 dark:border-white/5 bg-white/95 dark:bg-[#111111]/95 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)]">
                    <CardHeader className="space-y-1 text-center pb-6 pt-8">
                        <div className="flex justify-center mb-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 dark:bg-white text-zinc-50 dark:text-zinc-900 shadow-inner">
                                <Activity className="h-6 w-6 stroke-[2]" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                            {isOtpStep ? 'Reset Password' : 'Forgot Password'}
                        </CardTitle>
                        <CardDescription className="text-sm text-zinc-500 dark:text-zinc-400">
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

                        {!isOtpStep ? (
                            <form onSubmit={handleSendOtp} className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="email" className="text-zinc-700 dark:text-zinc-300 font-medium">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="name@company.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="bg-white/50 dark:bg-black/50 border-zinc-200 dark:border-zinc-800 focus-visible:ring-kfintech-primary text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 transition-all"
                                    />
                                </div>

                                <Button 
                                    type="submit" 
                                    className="w-full mt-2 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 text-zinc-50 dark:text-zinc-900 rounded-lg shadow-lg hover:shadow-xl transition-all"
                                    disabled={isLoading}>
                                    {isLoading ? 'Sending...' : 'Send reset code'}
                                </Button>
                            </form>
                        ) : (
                            <form onSubmit={handleResetPassword} className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="otp" className="text-zinc-700 dark:text-zinc-300 font-medium">6-Digit Code</Label>
                                    <Input
                                        id="otp"
                                        type="text"
                                        maxLength={6}
                                        placeholder="000000"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                        className="bg-white/50 dark:bg-black/50 border-zinc-200 dark:border-zinc-800 focus-visible:ring-kfintech-primary text-zinc-900 dark:text-zinc-50 transition-all text-center tracking-widest text-lg"
                                    />
                                    <div className="flex justify-end items-center text-xs mt-1">
                                        {timeLeft > 0 ? (
                                            <span className="text-zinc-500 dark:text-zinc-400 font-medium">Resend code in <span className="text-zinc-900 dark:text-zinc-100">{timeLeft}s</span></span>
                                        ) : (
                                            <button type="button" onClick={handleResendOtp} disabled={isLoading} className="text-zinc-900 dark:text-zinc-100 font-semibold hover:underline disabled:opacity-50">
                                                Resend OTP
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="password" className="text-zinc-700 dark:text-zinc-300 font-medium">New Password</Label>
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
                                            className="bg-white/50 dark:bg-black/50 border-zinc-200 dark:border-zinc-800 focus-visible:ring-kfintech-primary text-zinc-900 dark:text-zinc-50 transition-all pr-10"
                                        />
                                        <Button 
                                            variant="ghost"
                                            size="sm"
                                            className="absolute right-0 top-0 h-9 px-3 py-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-transparent"
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
                                    <Label htmlFor="confirmPassword" className="text-zinc-700 dark:text-zinc-300 font-medium">Confirm New Password</Label>
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
                                            className="bg-white/50 dark:bg-black/50 border-zinc-200 dark:border-zinc-800 focus-visible:ring-kfintech-primary text-zinc-900 dark:text-zinc-50 transition-all pr-10"
                                        />
                                        <Button 
                                            variant="ghost"
                                            size="sm"
                                            className="absolute right-0 top-0 h-9 px-3 py-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-transparent"
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
                                        className="rounded-lg border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 bg-transparent"
                                        onClick={() => {
                                            setIsOtpStep(false);
                                            setSuccessMessage('');
                                            setError('');
                                        }}>
                                        Cancel
                                    </Button>
                                    <Button 
                                        type="submit"
                                        className="rounded-lg bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 text-zinc-50 dark:text-zinc-900 shadow-lg"
                                        disabled={isLoading || otp.length !== 6}>
                                        {isLoading ? 'Resetting...' : 'Reset password'}
                                    </Button>
                                </div>
                            </form>
                        )}

                        <div className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
                            Remembered it?{' '}
                            <Link to="/login" state={{ email }} className="font-medium text-zinc-900 dark:text-zinc-100 hover:underline underline-offset-4">
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
