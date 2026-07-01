import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Activity, User, ShieldCheck, ShieldAlert, LogOut, Crown, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './common/ThemeToggle';

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const NAV_CONFIG = {
    INVESTOR: [
        { path: '/investor', label: 'Investor Portal', icon: <User className="w-4 h-4" /> }
    ],
    ADMIN_L1: [
        { path: '/l1-maker', label: 'L1 Maker Desk', icon: <ShieldAlert className="w-4 h-4" /> }
    ],
    ADMIN_L2: [
        { path: '/l2-checker', label: 'L2 Checker Desk', icon: <ShieldCheck className="w-4 h-4" /> }
    ],
    ADMIN_SUPER: [
        { path: '/admin', label: 'Super Admin', icon: <Crown className="w-4 h-4" /> }
    ]
};

const Navbar = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login', { replace: true });
    };

    const navLinks = user ? (NAV_CONFIG[user.role] || []) : [];

    const getInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    };

    return (
        <nav className="sticky top-0 z-50 bg-white dark:bg-[#131313] border-b border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="container mx-auto px-4 md:px-6 h-14 flex items-center justify-between gap-4">

                {/* Brand */}
                <Link to="/" className="flex items-center gap-2 shrink-0 transition-opacity hover:opacity-80">
                    <div className="bg-zinc-900 dark:bg-zinc-100 p-1.5 rounded-md flex items-center justify-center">
                        <Activity className="w-4 h-4 text-white dark:text-zinc-900" />
                    </div>
                    <span className="font-bold text-base tracking-tight text-zinc-900 dark:text-zinc-100 hidden sm:inline-block">
                        FinnovaX
                    </span>
                </Link>

                {/* Nav Links */}
                {navLinks.length > 0 && (
                    <div className="flex items-center gap-1">
                        {navLinks.map((link) => {
                            const isActive = location.pathname === link.path || location.pathname.startsWith(link.path + '/');
                            return (
                                <Link key={link.path} to={link.path}>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={`gap-2 text-xs font-semibold h-8 px-3 ${
                                            isActive
                                                ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                                                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                        }`}
                                    >
                                        {React.cloneElement(link.icon, { className: 'w-3.5 h-3.5' })}
                                        <span className="hidden sm:inline-block">{link.label}</span>
                                    </Button>
                                </Link>
                            );
                        })}
                    </div>
                )}

                {/* Right: Theme + Profile */}
                <div className="flex items-center gap-2 shrink-0">
                    <ThemeToggle />

                    {user && (
                        <DropdownMenu>
                            <DropdownMenuTrigger className="flex items-center h-8 gap-2 px-2 rounded-md outline-none hover:bg-zinc-100 dark:hover:bg-zinc-800 data-[state=open]:bg-zinc-100 dark:data-[state=open]:bg-zinc-800 transition-colors">
                                <Avatar className="h-6 w-6 border border-zinc-200 dark:border-zinc-700">
                                    <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[10px] font-bold">
                                        {getInitials(user.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="hidden md:flex flex-col items-start leading-none">
                                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 max-w-[100px] truncate">{user.name}</span>
                                </div>
                                <ChevronDown className="h-3 w-3 text-zinc-400 dark:text-zinc-500" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" sideOffset={6} className="w-52 rounded-lg bg-white dark:bg-[#1A1A1A] border border-zinc-200 dark:border-zinc-800 shadow-xl">
                                <div className="px-3 py-2.5 flex items-center gap-2.5">
                                    <Avatar className="h-7 w-7 border border-zinc-200 dark:border-zinc-700">
                                        <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold">
                                            {getInitials(user.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">{user.name}</p>
                                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">{user.email}</p>
                                    </div>
                                </div>
                                <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800" />
                                <div className="px-3 py-1.5">
                                    <span className="text-[10px] font-mono font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                                        {user.role.replace('ADMIN_', 'L')}
                                    </span>
                                </div>
                                <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800" />
                                <DropdownMenuItem
                                    onClick={handleLogout}
                                    className="cursor-pointer text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 focus:bg-red-50 dark:focus:bg-red-950/30 focus:text-red-600 dark:focus:text-red-400 flex items-center gap-2 text-xs mx-1 mb-1 rounded-md"
                                >
                                    <LogOut className="h-3.5 w-3.5" />
                                    <span>Log out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
