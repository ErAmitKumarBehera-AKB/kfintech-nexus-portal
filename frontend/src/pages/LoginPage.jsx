import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DEMO_CREDENTIALS = [
    { email: 'investor@kfintech.com', role: 'INVESTOR' },
    { email: 'l1agent@kfintech.com',  role: 'ADMIN_L1' },
    { email: 'l2agent@kfintech.com',  role: 'ADMIN_L2' },
    { email: 'admin@kfintech.com',    role: 'ADMIN_SUPER' },
];

const DEMO_PASSWORD = 'KFintech@2026';

const LoginPage = () => {
    const { login, verifyOtp, getRoleDefaultRoute } = useAuth();
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
            }
        } catch (err) {
            const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
            setError(msg);
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
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                <h1 className="text-3xl font-bold text-gray-900">KFintech Nexus</h1>
                <p className="mt-2 text-sm text-gray-600">Secure Investor & Operations Portal</p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-200">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800">
                        {isOtpStep ? 'Two-Factor Authentication' : 'Sign in to your account'}
                    </h2>
                    {!isOtpStep && (
                        <p className="text-sm text-gray-500 mb-6">
                            Don't have an account?{' '}
                            <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
                                Register
                            </Link>
                        </p>
                    )}

                    {error && (
                        <div className="mb-4 bg-red-50 text-red-600 p-3 rounded text-sm border border-red-200">
                            ⚠️ {error}
                        </div>
                    )}
                    {successMessage && (
                        <div className="mb-4 bg-green-50 text-green-600 p-3 rounded text-sm border border-green-200">
                            ✅ {successMessage}
                        </div>
                    )}

                    {!isOtpStep ? (
                        <form onSubmit={handleLoginSubmit} className="space-y-4" noValidate>
                            <div>
                                <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                <input
                                    id="login-email"
                                    type="email"
                                    autoComplete="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@kfintech.com"
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black"
                                />
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label htmlFor="login-password" className="block text-sm font-medium text-gray-700">Password</label>
                                    <Link to="/forgot-password" className="text-xs font-medium text-blue-600 hover:text-blue-500">
                                        Forgot password?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <input
                                        id="login-password"
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="current-password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••••"
                                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black"
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => setShowPassword(v => !v)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 text-blue-600 hover:text-blue-500"
                                    >
                                        {showPassword ? 'Hide' : 'Show'}
                                    </button>
                                </div>
                            </div>

                            <button 
                                id="login-submit-btn" 
                                type="submit" 
                                disabled={isLoading}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                                {isLoading ? 'Authenticating...' : 'Sign In Securely'}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleOtpSubmit} className="space-y-4" noValidate>
                            <div>
                                <label htmlFor="login-otp" className="block text-sm font-medium text-gray-700 mb-1">6-Digit OTP</label>
                                <input
                                    id="login-otp"
                                    type="text"
                                    maxLength={6}
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                    placeholder="000000"
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-center tracking-widest text-lg font-mono text-black"
                                />
                            </div>

                            <div className="flex space-x-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsOtpStep(false);
                                        setSuccessMessage('');
                                        setError('');
                                    }}
                                    className="w-1/3 flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    Cancel
                                </button>
                                <button 
                                    id="otp-submit-btn" 
                                    type="submit" 
                                    disabled={isLoading || otp.length !== 6}
                                    className="w-2/3 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                                >
                                    {isLoading ? 'Verifying...' : 'Verify & Login'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {!isOtpStep && (
                    <div className="mt-6">
                        <button 
                            id="toggle-demo-credentials" 
                            type="button" 
                            onClick={() => setShowDemo(v => !v)}
                            className="w-full flex items-center justify-between px-4 py-2 bg-white border border-gray-200 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            <span>Demo Credentials</span>
                            <span>{showDemo ? '▲' : '▼'}</span>
                        </button>

                        {showDemo && (
                            <div className="mt-2 bg-white border border-gray-200 rounded-md p-4 shadow-sm text-sm">
                                <p className="mb-3 text-gray-600">Password for all accounts: <span className="font-mono bg-gray-100 px-1 rounded">{DEMO_PASSWORD}</span></p>
                                <ul className="space-y-2">
                                    {DEMO_CREDENTIALS.map((cred) => (
                                        <li key={cred.email}>
                                            <button 
                                                type="button" 
                                                id={`demo-${cred.role.toLowerCase()}`} 
                                                onClick={() => fillDemo(cred)}
                                                className="w-full text-left px-3 py-2 border border-gray-200 rounded hover:bg-blue-50 hover:border-blue-300 flex justify-between items-center transition-colors"
                                            >
                                                <span className="font-medium text-gray-800">{cred.email}</span>
                                                <span className="text-xs text-gray-500">{cred.role}</span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LoginPage;
