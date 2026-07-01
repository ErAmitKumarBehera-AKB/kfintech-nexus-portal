import React from 'react';
import { ShieldCheck, Search, Bell, UserCircle, ChevronRight } from 'lucide-react';

const DashboardHeader = () => {
    return (
        <header className="bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-amber-200/60 dark:border-zinc-800 sticky top-0 z-40">
            <div className="max-w-[1600px] mx-auto px-8 h-16 flex items-center justify-between">
                {/* Left: Logo & Breadcrumb */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 bg-zinc-900 dark:bg-zinc-100 rounded flex items-center justify-center shadow-sm border border-zinc-800 dark:border-zinc-200">
                            <ShieldCheck className="h-5 w-5 text-amber-500 dark:text-zinc-900" />
                        </div>
                        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">FinnovaX</h1>
                    </div>

                    <div className="hidden md:flex items-center text-sm font-bold text-zinc-500 dark:text-zinc-400">
                        <ChevronRight className="h-4 w-4 mx-1 opacity-50" />
                        <span className="text-zinc-900 dark:text-zinc-100">Admin Console</span>
                    </div>
                </div>

                {/* Center: Global Search */}
                <div className="hidden md:flex flex-1 max-w-md mx-8 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Search tickets, users, or agents..."
                        className="w-full h-9 pl-9 pr-4 text-sm font-medium bg-white/60 dark:bg-zinc-900/60 border border-amber-200/60 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-400/40 dark:focus:ring-zinc-600 focus:border-amber-400 dark:focus:border-zinc-500 transition-all text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                    />
                </div>

                {/* Right: Environment & Profile */}
                <div className="flex items-center gap-5">
                    <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md bg-white dark:bg-zinc-900 border border-amber-200/60 dark:border-zinc-700 shadow-sm">
                        <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Production</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <button className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                            <Bell className="h-5 w-5" />
                        </button>
                        <button className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                            <UserCircle className="h-6 w-6" />
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default DashboardHeader;
