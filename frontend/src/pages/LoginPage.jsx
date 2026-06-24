import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Eye, EyeOff, LogIn, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DEMO_CREDENTIALS = [
    { email: 'investor@kfintech.com', role: 'INVESTOR', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30' },
    { email: 'l1agent@kfintech.com',  role: 'ADMIN_L1',    color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' },
    { email: 'l2agent@kfintech.com',  role: 'ADMIN_L2',    color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30' },
    { email: 'admin@kfintech.com',    role: 'ADMIN_SUPER',  color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
];

const DEMO_PASSWORD = 'KFintech@2026';

const LoginPage = () => {
    const { login, getRoleDefaultRoute } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showDemo, setShowDemo] = useState(false);

    // After login, redirect to the page the user originally tried to visit
    const from = location.state?.from?.pathname || null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            setError('Please enter your email and password.');
            return;
        }
        setIsLoading(true);
        setError('');

        try {
            const user = await login(email.trim().toLowerCase(), password);
            const destination = from || getRoleDefaultRoute(user.role);
            navigate(destination, { replace: true });
        } catch (err) {
            const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const fillDemo = (cred) => {
        setEmail(cred.email);
        setPassword(DEMO_PASSWORD);
        setError('');
    };

    return (
        <div className="min-h-screen bg-kfintech-bg flex flex-col items-center justify-center px-4 relative overflow-hidden">

            {/* Ambient background glow orbs */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-900/5 rounded-full blur-3xl" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="w-full max-w-md relative z-10"
            >
                {/* Brand Header */}
                <div className="text-center mb-10">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                        className="inline-flex items-center justify-center w-16 h-16 bg-kfintech-primary/15 border border-kfintech-primary/40 rounded-2xl mb-5 shadow-[0_0_30px_rgba(59,130,246,0.25)]"
                    >
                        <Activity className="w-8 h-8 text-kfintech-primary" />
                    </motion.div>
                    <h1 className="text-3xl font-black text-white tracking-tight">KFintech Nexus</h1>
                    <p className="text-gray-500 mt-2 text-sm font-medium">Secure Investor & Operations Portal</p>
                </div>

                {/* Login Card */}
                <div className="glass-panel rounded-2xl p-8 shadow-2xl border border-kfintech-border/80">

                    <div className="mb-7">
                        <h2 className="text-xl font-extrabold text-white tracking-tight">Sign in to your account</h2>
                        <p className="text-gray-500 text-sm mt-1">Access is role-restricted. Unauthorised attempts are logged.</p>
                    </div>

                    {/* Error Banner */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mb-5 p-4 rounded-xl bg-red-500/10 border border-red-500/40 text-red-400 text-sm font-medium flex items-center gap-3"
                            >
                                <span className="text-lg shrink-0">⚠️</span>
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleSubmit} className="space-y-5" id="login-form" noValidate>

                        {/* Email Field */}
                        <div>
                            <label htmlFor="login-email" className="block text-xs font-extrabold text-kfintech-primary mb-2 uppercase tracking-widest">
                                Email Address
                            </label>
                            <input
                                id="login-email"
                                type="email"
                                autoComplete="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@kfintech.com"
                                className="w-full bg-kfintech-bg border border-kfintech-border rounded-xl px-4 py-3.5 text-white placeholder-gray-600 focus:ring-2 focus:ring-kfintech-primary/50 focus:border-kfintech-primary outline-none transition-all text-sm shadow-inner"
                            />
                        </div>

                        {/* Password Field */}
                        <div>
                            <label htmlFor="login-password" className="block text-xs font-extrabold text-kfintech-primary mb-2 uppercase tracking-widest">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    id="login-password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••••"
                                    className="w-full bg-kfintech-bg border border-kfintech-border rounded-xl px-4 py-3.5 pr-12 text-white placeholder-gray-600 focus:ring-2 focus:ring-kfintech-primary/50 focus:border-kfintech-primary outline-none transition-all text-sm shadow-inner"
                                />
                                <button
                                    type="button"
                                    id="toggle-password-visibility"
                                    onClick={() => setShowPassword(v => !v)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                                    aria-label="Toggle password visibility"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <motion.button
                            id="login-submit-btn"
                            type="submit"
                            disabled={isLoading}
                            whileHover={{ scale: isLoading ? 1 : 1.02 }}
                            whileTap={{ scale: isLoading ? 1 : 0.98 }}
                            className={`w-full flex items-center justify-center gap-2.5 py-4 rounded-xl font-extrabold text-sm uppercase tracking-widest transition-all shadow-lg ${
                                isLoading
                                    ? 'bg-kfintech-border text-gray-500 cursor-wait'
                                    : 'bg-kfintech-primary text-white hover:bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)]'
                            }`}
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Authenticating...
                                </>
                            ) : (
                                <>
                                    <LogIn className="w-4 h-4" />
                                    Sign In Securely
                                </>
                            )}
                        </motion.button>
                    </form>

                    {/* Security badge */}
                    <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-600">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>JWT · RBAC · AES-256 Encrypted · Session expires in 8h</span>
                    </div>
                </div>

                {/* Demo Credentials Panel */}
                <div className="mt-4">
                    <button
                        id="toggle-demo-credentials"
                        type="button"
                        onClick={() => setShowDemo(v => !v)}
                        className="w-full flex items-center justify-between px-5 py-3.5 glass-panel rounded-xl text-gray-400 hover:text-white text-sm font-semibold transition-colors border border-kfintech-border/60 hover:border-kfintech-primary/30"
                    >
                        <span className="flex items-center gap-2">
                            <span className="text-base">🔑</span> Demo Credentials
                        </span>
                        {showDemo ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    <AnimatePresence>
                        {showDemo && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="mt-2 glass-panel rounded-xl p-4 space-y-2 border border-kfintech-border/60">
                                    <p className="text-xs text-gray-500 font-mono mb-3">
                                        Password for all accounts: <span className="text-white font-bold bg-kfintech-bg px-2 py-0.5 rounded border border-kfintech-border ml-1">{DEMO_PASSWORD}</span>
                                    </p>
                                    {DEMO_CREDENTIALS.map((cred) => (
                                        <motion.button
                                            key={cred.email}
                                            id={`demo-${cred.role.toLowerCase()}`}
                                            type="button"
                                            whileHover={{ scale: 1.01 }}
                                            whileTap={{ scale: 0.99 }}
                                            onClick={() => fillDemo(cred)}
                                            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border text-left transition-all hover:brightness-110 ${cred.bg}`}
                                        >
                                            <span className="text-xs font-mono text-gray-300">{cred.email}</span>
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${cred.color}`}>{cred.role}</span>
                                        </motion.button>
                                    ))}
                                    <p className="text-xs text-gray-600 pt-1 text-center">Click a row to auto-fill credentials</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};

export default LoginPage;
