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
        <div>
            <div>
                <h1>KFintech Nexus</h1>
                <p>Secure Investor & Operations Portal</p>
            </div>

            <div>
                <div>
                    <h2>
                        {isOtpStep ? 'Two-Factor Authentication' : 'Sign in to your account'}
                    </h2>
                    {!isOtpStep && (
                        <p>
                            Don't have an account?{' '}
                            <Link to="/register">
                                Register
                            </Link>
                        </p>
                    )}

                    {error && (
                        <div>
                            ⚠️ {error}
                        </div>
                    )}
                    {successMessage && (
                        <div>
                            ✅ {successMessage}
                        </div>
                    )}

                    {!isOtpStep ? (
                        <form onSubmit={handleLoginSubmit}  noValidate>
                            <div>
                                <label htmlFor="login-email">Email Address</label>
                                <input
                                    id="login-email"
                                    type="email"
                                    autoComplete="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@kfintech.com"
                                    
                                />
                            </div>

                            <div>
                                <div>
                                    <label htmlFor="login-password">Password</label>
                                    <Link to="/forgot-password">
                                        Forgot password?
                                    </Link>
                                </div>
                                <div>
                                    <input
                                        id="login-password"
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="current-password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••••"
                                        
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => setShowPassword(v => !v)}>
                                        {showPassword ? 'Hide' : 'Show'}
                                    </button>
                                </div>
                            </div>

                            <button 
                                id="login-submit-btn" 
                                type="submit" 
                                disabled={isLoading}>
                                {isLoading ? 'Authenticating...' : 'Sign In Securely'}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleOtpSubmit}  noValidate>
                            <div>
                                <label htmlFor="login-otp">6-Digit OTP</label>
                                <input
                                    id="login-otp"
                                    type="text"
                                    maxLength={6}
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                    placeholder="000000"
                                    
                                />
                            </div>

                            <div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsOtpStep(false);
                                        setSuccessMessage('');
                                        setError('');
                                    }}>
                                    Cancel
                                </button>
                                <button 
                                    id="otp-submit-btn" 
                                    type="submit" 
                                    disabled={isLoading || otp.length !== 6}>
                                    {isLoading ? 'Verifying...' : 'Verify & Login'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {!isOtpStep && (
                    <div>
                        <button 
                            id="toggle-demo-credentials" 
                            type="button" 
                            onClick={() => setShowDemo(v => !v)}>
                            <span>Demo Credentials</span>
                            <span>{showDemo ? '▲' : '▼'}</span>
                        </button>

                        {showDemo && (
                            <div>
                                <p>Password for all accounts: <span>{DEMO_PASSWORD}</span></p>
                                <ul>
                                    {DEMO_CREDENTIALS.map((cred) => (
                                        <li key={cred.email}>
                                            <button 
                                                type="button" 
                                                id={`demo-${cred.role.toLowerCase()}`} 
                                                onClick={() => fillDemo(cred)}>
                                                <span>{cred.email}</span>
                                                <span>{cred.role}</span>
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
