import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, User, ShieldCheck, ShieldAlert, LogOut, Crown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV_CONFIG = {
    INVESTOR: [
        { path: '/investor', label: 'Investor Portal', role: 'INVESTOR', icon: <User className="w-4 h-4" /> }
    ],
    ADMIN_L1: [
        { path: '/l1-maker', label: 'L1 Maker Desk', role: 'ADMIN_L1', icon: <ShieldAlert className="w-4 h-4" /> }
    ],
    ADMIN_L2: [
        { path: '/l2-checker', label: 'L2 Checker Desk', role: 'ADMIN_L2', icon: <ShieldCheck className="w-4 h-4" /> }
    ],
    ADMIN_SUPER: [
        { path: '/admin',      label: 'SuperAdmin Dashboard',    role: 'ADMIN_SUPER', icon: <Crown className="w-4 h-4" /> }
    ]
};

const ROLE_COLORS = {
    INVESTOR:    'text-blue-400',
    ADMIN_L1:    'text-amber-400',
    ADMIN_L2:    'text-purple-400',
    ADMIN_SUPER: 'text-emerald-400'
};

const Navbar = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const isLandingPage = location.pathname === "/";

    const handleLogout = async () => {
        await logout();
        navigate('/login', { replace: true });
    };

    // Determine nav links from role; fall back to empty if role unknown
    const navLinks = user ? (NAV_CONFIG[user.role] || []) : [];
    const roleColor = user ? (ROLE_COLORS[user.role] || 'text-gray-400') : 'text-gray-400';

    return (
        <nav className="glass-panel sticky top-0 z-50 border-b border-kfintech-border/50">
            <div className="container mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">

                {/* Brand Logo */}
                <div className="flex items-center gap-3">
                    <div className="bg-kfintech-primary/10 p-2 rounded-lg border border-kfintech-primary/30">
                        <Activity className="w-6 h-6 text-kfintech-primary" />
                    </div>
                    <span className="font-black text-2xl tracking-tighter text-white">KFintech Nexus</span>
                </div>

                {/* Core Navigation Links — filtered by role */}
                {!isLandingPage && navLinks.length > 0 && (
                    <div className="flex items-center gap-1 bg-kfintech-bg/50 p-1.5 rounded-xl border border-kfintech-border relative">
                        {navLinks.map((link) => {
                            const isActive = location.pathname === link.path || location.pathname.startsWith(link.path + '/');
                            return (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={`relative flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm uppercase tracking-wider transition-colors duration-200 z-10 ${
                                        isActive ? 'text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                                    }`}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="nav-pill"
                                            className="absolute inset-0 bg-kfintech-primary rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                                            initial={false}
                                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                            style={{ zIndex: -1 }}
                                        />
                                    )}
                                    <span className="relative z-10">{link.icon}</span>
                                    <span className="relative z-10">{link.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                )}

                {/* Right: Session Indicator + Logout */}
                {!isLandingPage && (
                <div className="flex items-center gap-3">
                    {user && (
                        <div className="bg-kfintech-bg border border-kfintech-border px-4 py-2 rounded-lg flex items-center gap-3 shadow-inner">
                            <div className="w-2 h-2 rounded-full bg-kfintech-accent shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
                            <div className="flex flex-col leading-tight">
                                <span className="text-xs font-bold text-white">{user.name}</span>
                                <span className={`text-[10px] font-black font-mono uppercase tracking-widest ${roleColor}`}>
                                    {user.role}
                                </span>
                            </div>
                        </div>
                    )}

                    {user && (
                        <motion.button
                            id="navbar-logout-btn"
                            onClick={handleLogout}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all text-sm font-bold uppercase tracking-wider"
                            title="Sign out"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="hidden sm:inline">Logout</span>
                        </motion.button>
                    )}
                </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
