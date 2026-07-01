import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Activity, User, ShieldCheck, ShieldAlert, LogOut, Crown, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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

const Navbar = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login', { replace: true });
    };

    const navLinks = user ? (NAV_CONFIG[user.role] || []) : [];
    
    // Get initials for Avatar
    const getInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    };

    return (
        <nav className="sticky top-0 z-50 bg-white border-b border-zinc-200 shadow-sm">
            <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
                
                {/* Brand Logo */}
                <Link to="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
                    <div className="bg-zinc-900 p-1.5 rounded-md flex items-center justify-center">
                        <Activity className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-xl tracking-tight text-zinc-900 hidden sm:inline-block">
                        FinnovaX
                    </span>
                </Link>

                {/* Core Navigation Links */}
                {navLinks.length > 0 && (
                    <div className="flex items-center gap-1 md:gap-2">
                        {navLinks.map((link) => {
                            const isActive = location.pathname === link.path || location.pathname.startsWith(link.path + '/');
                            return (
                                <Link key={link.path} to={link.path}>
                                    <Button 
                                        variant={isActive ? "secondary" : "ghost"} 
                                        size="sm"
                                        className={`gap-2 ${isActive ? 'bg-zinc-100 text-zinc-900 font-semibold' : 'text-zinc-600 hover:text-zinc-900'}`}
                                    >
                                        {React.cloneElement(link.icon, { className: 'w-4 h-4' })}
                                        <span className="hidden sm:inline-block">{link.label}</span>
                                    </Button>
                                </Link>
                            );
                        })}
                    </div>
                )}

                {/* Right: User Profile Dropdown */}
                <div className="flex items-center gap-3">
                    {user && (
                        <DropdownMenu>
                            <DropdownMenuTrigger className="flex items-center h-9 gap-2 px-2 hover:bg-zinc-100 data-[state=open]:bg-zinc-100 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-zinc-950">
                                    <Avatar className="h-7 w-7 border border-zinc-200">
                                        <AvatarFallback className="bg-zinc-100 text-zinc-700 text-xs font-semibold">
                                            {getInitials(user.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="hidden md:flex flex-col items-start leading-none">
                                        <span className="text-sm font-medium text-zinc-900">{user.name}</span>
                                    </div>
                                    <ChevronDown className="h-4 w-4 text-zinc-500 ml-1" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" sideOffset={8} className="w-56 rounded-lg bg-white border border-zinc-200 shadow-md">
                                <div className="px-2 py-2">
                                    <div className="flex items-center gap-3 text-left text-sm">
                                        <Avatar className="h-8 w-8 border border-zinc-200">
                                            <AvatarFallback className="bg-zinc-100 text-zinc-700 text-xs font-semibold">
                                                {getInitials(user.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="grid flex-1 text-left text-sm leading-tight">
                                            <span className="truncate font-medium text-zinc-900">{user.name}</span>
                                            <span className="truncate text-xs text-zinc-500">{user.email}</span>
                                        </div>
                                    </div>
                                </div>
                                <DropdownMenuSeparator className="bg-zinc-100" />
                                <DropdownMenuItem className="text-xs font-mono text-zinc-500 uppercase cursor-default">
                                    Role: {user.role.replace('ADMIN_', 'L')}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-zinc-100" />
                                <DropdownMenuItem 
                                    onClick={handleLogout}
                                    className="cursor-pointer text-red-600 hover:bg-red-50 focus:bg-red-50 focus:text-red-600 flex items-center gap-2"
                                >
                                    <LogOut className="h-4 w-4" />
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
