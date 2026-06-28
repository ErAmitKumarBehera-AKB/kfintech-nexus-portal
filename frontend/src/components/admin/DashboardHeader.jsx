import React from 'react';
import { ShieldCheck, Search, Bell, UserCircle, ChevronRight } from 'lucide-react';

const DashboardHeader = () => {
    return (
        <header className="bg-white border-b border-zinc-200">
            <div className="max-w-[1600px] mx-auto px-8 h-16 flex items-center justify-between">
                {/* Left: Logo & Breadcrumb */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 bg-black rounded flex items-center justify-center">
                            <ShieldCheck className="h-5 w-5 text-white" />
                        </div>
                        <h1 className="text-xl font-bold text-zinc-950 tracking-tight">Nexus</h1>
                    </div>
                    
                    <div className="hidden md:flex items-center text-sm font-medium text-zinc-500">
                        <ChevronRight className="h-4 w-4 mx-1 opacity-50" />
                        <span className="text-zinc-950">Admin Console</span>
                    </div>
                </div>

                {/* Center: Global Search */}
                <div className="hidden md:flex flex-1 max-w-md mx-8 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <input 
                        type="text" 
                        placeholder="Search tickets, users, or agents..." 
                        className="w-full h-9 pl-9 pr-4 text-sm bg-zinc-50 border border-zinc-200 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all"
                    />
                </div>

                {/* Right: Environment & Profile */}
                <div className="flex items-center gap-5">
                    <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md bg-zinc-100 border border-zinc-200">
                        <div className="h-2 w-2 rounded-full bg-black"></div>
                        <span className="text-xs font-semibold text-zinc-950">Production</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <button className="text-zinc-500 hover:text-zinc-950 transition-colors">
                            <Bell className="h-5 w-5" />
                        </button>
                        <button className="text-zinc-500 hover:text-zinc-950 transition-colors">
                            <UserCircle className="h-6 w-6" />
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default DashboardHeader;
