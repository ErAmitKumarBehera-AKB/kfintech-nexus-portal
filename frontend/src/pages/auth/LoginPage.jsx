import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Activity, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ThemeToggle from '../../components/common/ThemeToggle';
import DotBackgroundDemo from "@/components/ui/DotBackgroundDemo";
import { toast } from "sonner";

const DEMO_CREDENTIALS = [
    { email: 'investor@kfintech.com', role: 'INVESTOR' },
    { email: 'l1agent@kfintech.com',  role: 'ADMIN_L1' },
    { email: 'l2agent@kfintech.com',  role: 'ADMIN_L2' },
    { email: 'admin@kfintech.com',    role: 'ADMIN_SUPER' },
];

const DEMO_PASSWORD = 'KFintech@2026';

const LoginPage = () => {
    const { login, verifyOtp, getRoleDefaultRoute, updateSession } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [email, setEmail] = useState(location.state?.email || '');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    
    // UI States
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [showDemo, setShowDemo] = useState(false);
    const [isOtpStep, setIsOtpStep] = useState(false);
    const [authType, setAuthType] = useState('EMAIL'); // 'EMAIL' or 'GOOGLE'
    const [timeLeft, setTimeLeft] = useState(30);

    const from = location.state?.from?.pathname || null;

    useEffect(() => {
        let timer;
        if (isOtpStep && timeLeft > 0) {
            timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        }
        return () => clearInterval(timer);
    }, [isOtpStep, timeLeft]);

    useEffect(() => {
        if (location.state?.message) {
            toast.success(location.state.message);
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, []);

    // Shake password on error
    const [shakePassword, setShakePassword] = useState(false);
    const shakeTimeoutRef = useRef(null);
    const triggerShake = () => {
        setShakePassword(true);
        clearTimeout(shakeTimeoutRef.current);
        shakeTimeoutRef.current = setTimeout(() => setShakePassword(false), 600);
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            setError('Please enter your email and password.');
            return;
        }
        setIsLoading(true);
        setError('');

        try {
            const data = await login(email.trim().toLowerCase(), password);
            if (data.requiresOtp) {
                setIsOtpStep(true);
                setAuthType(data.type || 'EMAIL');
                setTimeLeft(30);
                setSuccessMessage(data.message || 'OTP sent successfully.');
            } else if (data.user) {
                // OTP bypassed, user returned directly
                updateSession(data.user);
                const destination = from || getRoleDefaultRoute(data.user.role);
                navigate(destination, { replace: true });
            }
        } catch (err) {
            const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
            setError(msg);
            setSuccessMessage('');
            triggerShake();
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setIsLoading(true);
        setError('');
        setSuccessMessage('');
        try {
            const data = await login(email.trim().toLowerCase(), password);
            if (data.requiresOtp) {
                setSuccessMessage('A new OTP has been sent to your email.');
                setTimeLeft(30);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to resend OTP.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOtpSubmit = async (e) => {
        e.preventDefault();
        if (!otp) {
            setError(authType === 'GOOGLE' ? 'Please enter the 6-digit code.' : 'Please enter the OTP.');
            return;
        }
        setIsLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            const user = await verifyOtp(email.trim().toLowerCase(), otp);
            const destination = from || getRoleDefaultRoute(user.role);
            navigate(destination, { replace: true });
        } catch (err) {
            const msg = err.response?.data?.message || 'Invalid OTP.';
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const fillDemo = (cred) => {
        setEmail(cred.email);
        setPassword(DEMO_PASSWORD);
        setError('');
        setSuccessMessage('');
        setIsOtpStep(false);
        setOtp('');
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-[#faf9f6] dark:bg-zinc-950 selection:bg-kfintech-primary/30 relative overflow-hidden transition-colors duration-500">
            <DotBackgroundDemo />
            {/* Background Glows for Glassmorphism */}
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-kfintech-primary/10 rounded-full blur-[120px] pointer-events-none z-0 hidden dark:block" />
            <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none z-0 hidden dark:block" />

            <div className="absolute top-6 left-6 sm:top-8 sm:left-8 z-20">
                <Link to="/" className="flex items-center text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to home
                </Link>
            </div>
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
                            {isOtpStep ? 'Check your email' : 'Welcome back'}
                        </CardTitle>
                        <CardDescription className="text-sm text-zinc-500 dark:text-zinc-400">
                            {isOtpStep 
                                ? 'Enter the 6-digit code sent to your email.' 
                                : 'Log in to your account'}
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
                            <form onSubmit={handleLoginSubmit} className="grid gap-4" noValidate>
                                <div className="grid gap-2">
                                    <Label htmlFor="login-email" className="text-zinc-700 dark:text-zinc-300 font-medium">Email</Label>
                                    <Input
                                        id="login-email"
                                        type="email"
                                        autoComplete="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="name@company.com"
                                        className="bg-white/50 dark:bg-black/50 border-zinc-200 dark:border-zinc-800 focus-visible:ring-kfintech-primary text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 transition-all"
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <div className="flex items-center">
                                        <Label htmlFor="login-password" className="text-zinc-700 dark:text-zinc-300 font-medium">Password</Label>
                                        <Link to="/forgot-password" state={{ email }} className="ml-auto inline-block text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                                            Forgot password?
                                        </Link>
                                    </div>
                                    <div className="relative">
                                        <Input
                                            id="login-password"
                                            type={showPassword ? 'text' : 'password'}
                                            autoComplete="current-password"
                                            value={password}
                                            onChange={(e) => { setPassword(e.target.value); if (error) setError(''); }}
                                            placeholder="••••••••••"
                                            className={`bg-white/50 dark:bg-black/50 border-zinc-200 dark:border-zinc-800 focus-visible:ring-kfintech-primary text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 transition-all pr-10 ${shakePassword ? 'animate-shake border-red-400 dark:border-red-500' : ''}`}
                                        />
                                        <Button 
                                            variant="ghost"
                                            size="sm"
                                            className="absolute right-0 top-0 h-9 px-3 py-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-transparent"
                                            type="button" 
                                            onClick={() => setShowPassword(v => !v)}>
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>

                                <Button 
                                    id="login-submit-btn" 
                                    type="submit" 
                                    className="w-full mt-2 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 text-zinc-50 dark:text-zinc-900 rounded-lg shadow-lg hover:shadow-xl transition-all"
                                    disabled={isLoading}>
                                    {isLoading ? 'Authenticating...' : 'Sign in'}
                                </Button>
                            </form>
                        ) : (
                            <form onSubmit={handleOtpSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="otp" className="text-zinc-700 dark:text-zinc-300 font-medium">
                                        {authType === 'GOOGLE' ? 'Authenticator App Code' : '6-Digit Code'}
                                    </Label>
                                    <Input
                                        id="otp"
                                        type="text"
                                        maxLength={6}
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                        placeholder={authType === 'GOOGLE' ? "6-digit code" : "000000"}
                                        className="bg-white/50 dark:bg-black/50 border-zinc-200 dark:border-zinc-800 focus-visible:ring-kfintech-primary text-zinc-900 dark:text-zinc-50 transition-all text-center tracking-widest text-lg"
                                    />
                                    
                                    {authType === 'EMAIL' && (
                                        <div className="flex justify-end items-center text-xs mt-1">
                                            {timeLeft > 0 ? (
                                                <span className="text-zinc-500 dark:text-zinc-400 font-medium">Resend code in <span className="text-zinc-900 dark:text-zinc-100">{timeLeft}s</span></span>
                                            ) : (
                                                <button type="button" onClick={handleResendOtp} disabled={isLoading} className="text-zinc-900 dark:text-zinc-100 font-semibold hover:underline disabled:opacity-50">
                                                    Resend OTP
                                                </button>
                                            )}
                                        </div>
                                    )}
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
                                        id="otp-submit-btn" 
                                        type="submit" 
                                        className="rounded-lg bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 text-zinc-50 dark:text-zinc-900 shadow-lg"
                                        disabled={isLoading || otp.length !== 6}>
                                        {isLoading ? 'Verifying...' : 'Verify'}
                                    </Button>
                                </div>
                            </form>
                        )}
                        
                        {!isOtpStep && (
                            <div className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
                                Don't have an account?{' '}
                                <Link to="/register" className="font-medium text-zinc-900 dark:text-zinc-100 hover:underline underline-offset-4">
                                    Sign up
                                </Link>
                            </div>
                        )}

                        {!isOtpStep && (
                            <div className="mt-8 grid gap-4">
                                <Button 
                                    variant="ghost"
                                    className="text-xs text-zinc-200 hover:text-zinc-50"
                                    id="toggle-demo-credentials" 
                                    type="button" 
                                    onClick={() => setShowDemo(v => !v)}>
                                    <span>Developer Demo Access</span>
                                    <span className="ml-1">{showDemo ? '▲' : '▼'}</span>
                                </Button>

                                {showDemo && (
                                    <div className="grid gap-2 text-xs">
                                        <p className="text-zinc-500 text-center mb-2">Password: <span className="font-medium text-zinc-400">{DEMO_PASSWORD}</span></p>
                                        <ul className="grid gap-2">
                                            {DEMO_CREDENTIALS.map((cred) => (
                                                <li key={cred.email}>
                                                    <Button 
                                                        variant="outline"
                                                        size="sm"
                                                        className="w-full justify-between h-8 rounded border-zinc-200 hover:bg-zinc-10 text-zinc-300 shadow-none"
                                                        type="button" 
                                                        id={`demo-${cred.role.toLowerCase()}`} 
                                                        onClick={() => fillDemo(cred)}>
                                                        <span>{cred.email}</span>
                                                        <span className="text-zinc-400">{cred.role}</span>
                                                    </Button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default LoginPage;