import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Activity, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    
    // UI States
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [showDemo, setShowDemo] = useState(false);
    const [isOtpStep, setIsOtpStep] = useState(false);

    const from = location.state?.from?.pathname || null;

    useEffect(() => {
        if (location.state?.message) {
            setSuccessMessage(location.state.message);
            // Clear the message from location state so it doesn't show again on refresh
            navigate(location.pathname, { replace: true });
        }
    }, [location, navigate]);

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
        } finally {
            setIsLoading(false);
        }
    };

    const handleOtpSubmit = async (e) => {
        e.preventDefault();
        if (!otp) {
            setError('Please enter the OTP.');
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
        <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-zinc-50 selection:bg-zinc-200 relative">
            <Link to="/" className="absolute top-6 left-6 sm:top-8 sm:left-8 flex items-center text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to home
            </Link>
            <div className="w-full max-w-sm">
                <Card className="rounded-md border-zinc-200 bg-white shadow-sm">
                    <CardHeader className="space-y-1 text-center pb-6 pt-8">
                        <div className="flex justify-center mb-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded bg-zinc-900 text-zinc-50">
                                <Activity className="h-5 w-5 stroke-[2]" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl font-semibold tracking-tight text-zinc-900">
                            {isOtpStep ? 'Check your email' : 'Welcome back'}
                        </CardTitle>
                        <CardDescription className="text-sm text-zinc-500">
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
                                    <Label htmlFor="login-email" className="text-zinc-700 font-medium">Email</Label>
                                    <Input
                                        id="login-email"
                                        type="email"
                                        autoComplete="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="name@company.com"
                                        className="bg-transparent border-zinc-200 focus-visible:ring-zinc-900"
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <div className="flex items-center">
                                        <Label htmlFor="login-password" className="text-zinc-700 font-medium">Password</Label>
                                        <Link to="/forgot-password" className="ml-auto inline-block text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
                                            Forgot password?
                                        </Link>
                                    </div>
                                    <div className="relative">
                                        <Input
                                            id="login-password"
                                            type={showPassword ? 'text' : 'password'}
                                            autoComplete="current-password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••••"
                                            className="bg-transparent border-zinc-200 focus-visible:ring-zinc-900 pr-10"
                                        />
                                        <Button 
                                            variant="ghost"
                                            size="sm"
                                            className="absolute right-0 top-0 h-9 px-3 py-2 text-zinc-500 hover:text-zinc-900 hover:bg-transparent"
                                            type="button" 
                                            onClick={() => setShowPassword(v => !v)}>
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>

                                <Button 
                                    id="login-submit-btn" 
                                    type="submit" 
                                    className="w-full mt-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-50 rounded-md"
                                    disabled={isLoading}>
                                    {isLoading ? 'Authenticating...' : 'Sign in'}
                                </Button>
                            </form>
                        ) : (
                            <form onSubmit={handleOtpSubmit} className="grid gap-4" noValidate>
                                <div className="grid gap-2">
                                    <Label htmlFor="login-otp" className="text-zinc-700 font-medium">6-Digit Code</Label>
                                    <Input
                                        id="login-otp"
                                        type="text"
                                        maxLength={6}
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                        placeholder="000000"
                                        className="bg-transparent border-zinc-200 focus-visible:ring-zinc-900 text-center tracking-widest text-lg"
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
                                        id="otp-submit-btn" 
                                        type="submit" 
                                        className="rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-50"
                                        disabled={isLoading || otp.length !== 6}>
                                        {isLoading ? 'Verifying...' : 'Verify'}
                                    </Button>
                                </div>
                            </form>
                        )}
                        
                        {!isOtpStep && (
                            <div className="mt-6 text-center text-sm text-zinc-500">
                                Don't have an account?{' '}
                                <Link to="/register" className="font-medium text-zinc-900 hover:underline underline-offset-4">
                                    Sign up
                                </Link>
                            </div>
                        )}

                        {!isOtpStep && (
                            <div className="mt-8 grid gap-4">
                                <Button 
                                    variant="ghost"
                                    className="text-xs text-zinc-500 hover:text-zinc-900"
                                    id="toggle-demo-credentials" 
                                    type="button" 
                                    onClick={() => setShowDemo(v => !v)}>
                                    <span>Developer Demo Access</span>
                                    <span className="ml-1">{showDemo ? '▲' : '▼'}</span>
                                </Button>

                                {showDemo && (
                                    <div className="grid gap-2 text-xs">
                                        <p className="text-zinc-500 text-center mb-2">Password: <span className="font-medium text-zinc-900">{DEMO_PASSWORD}</span></p>
                                        <ul className="grid gap-2">
                                            {DEMO_CREDENTIALS.map((cred) => (
                                                <li key={cred.email}>
                                                    <Button 
                                                        variant="outline"
                                                        size="sm"
                                                        className="w-full justify-between h-8 rounded border-zinc-200 hover:bg-zinc-50 text-zinc-700 shadow-none"
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
