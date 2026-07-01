import React from 'react';
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, RefreshCw } from 'lucide-react';

const DashboardToolbar = ({ activeTab, setDateRange, setTicketStatus, setTicketPriority, setUserRole, handleExportCsv, fetchData, loading }) => {
    return (
        <div className="w-full max-w-[98%] xl:max-w-7xl mx-auto bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-amber-200/60 dark:border-zinc-800 shadow-[0_8px_32px_rgba(120,80,30,0.05)] dark:shadow-none rounded-2xl px-4 h-16 flex items-center justify-between mb-8 mt-8">
            {/* Left: Tabs */}
            <TabsList className="bg-transparent h-full p-0 flex space-x-2 justify-start rounded-none pl-2 items-center shrink-0">
                <TabsTrigger
                    value="overview"
                    className="rounded-xl data-[state=active]:bg-zinc-900 dark:data-[state=active]:bg-zinc-100 data-[state=active]:text-white dark:data-[state=active]:text-zinc-900 data-[state=active]:shadow-md px-4 py-1.5 text-sm font-bold text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-white/50 dark:hover:bg-zinc-800/50 data-[state=active]:hover:bg-zinc-800 dark:data-[state=active]:hover:bg-white transition-all"
                >
                    Overview
                </TabsTrigger>
                <TabsTrigger
                    value="tickets"
                    className="rounded-xl data-[state=active]:bg-zinc-900 dark:data-[state=active]:bg-zinc-100 data-[state=active]:text-white dark:data-[state=active]:text-zinc-900 data-[state=active]:shadow-md px-4 py-1.5 text-sm font-bold text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-white/50 dark:hover:bg-zinc-800/50 data-[state=active]:hover:bg-zinc-800 dark:data-[state=active]:hover:bg-white transition-all"
                >
                    Tickets
                </TabsTrigger>
                <TabsTrigger
                    value="users"
                    className="rounded-xl data-[state=active]:bg-zinc-900 dark:data-[state=active]:bg-zinc-100 data-[state=active]:text-white dark:data-[state=active]:text-zinc-900 data-[state=active]:shadow-md px-4 py-1.5 text-sm font-bold text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-white/50 dark:hover:bg-zinc-800/50 data-[state=active]:hover:bg-zinc-800 dark:data-[state=active]:hover:bg-white transition-all"
                >
                    Users
                </TabsTrigger>
                <TabsTrigger
                    value="agents"
                    className="rounded-xl data-[state=active]:bg-zinc-900 dark:data-[state=active]:bg-zinc-100 data-[state=active]:text-white dark:data-[state=active]:text-zinc-900 data-[state=active]:shadow-md px-4 py-1.5 text-sm font-bold text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-white/50 dark:hover:bg-zinc-800/50 data-[state=active]:hover:bg-zinc-800 dark:data-[state=active]:hover:bg-white transition-all"
                >
                    Agents
                </TabsTrigger>
                <TabsTrigger
                    value="flagged"
                    className="rounded-xl data-[state=active]:bg-zinc-900 dark:data-[state=active]:bg-zinc-100 data-[state=active]:text-white dark:data-[state=active]:text-zinc-900 data-[state=active]:shadow-md px-4 py-1.5 text-sm font-bold text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-white/50 dark:hover:bg-zinc-800/50 data-[state=active]:hover:bg-zinc-800 dark:data-[state=active]:hover:bg-white transition-all"
                >
                    Flagged
                </TabsTrigger>
            </TabsList>

            {/* Right: Actions */}
            <div className="flex items-center gap-3 shrink-0">

                {activeTab === 'users' && (
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Role:</span>
                        <Select onValueChange={setUserRole} defaultValue="ALL">
                            <SelectTrigger className="w-[120px] h-9 text-xs font-medium bg-white/80 dark:bg-zinc-950/80 shadow-sm border-amber-200/60 dark:border-zinc-800 rounded-md text-zinc-900 dark:text-zinc-100 focus:ring-amber-400/40 dark:focus:ring-zinc-700">
                                <SelectValue placeholder="Role" />
                            </SelectTrigger>
                            <SelectContent className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-amber-200/60 dark:border-zinc-800">
                                <SelectItem value="ALL" className="text-xs font-medium">All Roles</SelectItem>
                                <SelectItem value="INVESTOR" className="text-xs font-medium">Investors</SelectItem>
                                <SelectItem value="ADMIN_L1" className="text-xs font-medium">L1 Admins</SelectItem>
                                <SelectItem value="ADMIN_L2" className="text-xs font-medium">L2 Admins</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {(activeTab === 'tickets' || activeTab === 'flagged') && (
                    <>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Status:</span>
                            <Select onValueChange={setTicketStatus} defaultValue="ALL">
                                <SelectTrigger className="w-[120px] h-9 text-xs font-medium bg-white/80 dark:bg-zinc-950/80 shadow-sm border-amber-200/60 dark:border-zinc-800 rounded-md text-zinc-900 dark:text-zinc-100 focus:ring-amber-400/40 dark:focus:ring-zinc-700">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-amber-200/60 dark:border-zinc-800">
                                    <SelectItem value="ALL" className="text-xs font-medium">All Statuses</SelectItem>
                                    <SelectItem value="OPEN" className="text-xs font-medium">Open</SelectItem>
                                    <SelectItem value="L1_REVIEW" className="text-xs font-medium">L1 Review</SelectItem>
                                    <SelectItem value="L2_APPROVAL" className="text-xs font-medium">L2 Approval</SelectItem>
                                    <SelectItem value="RESOLVED" className="text-xs font-medium">Resolved</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Priority:</span>
                            <Select onValueChange={setTicketPriority} defaultValue="ALL">
                                <SelectTrigger className="w-[120px] h-9 text-xs font-medium bg-white/80 dark:bg-zinc-950/80 shadow-sm border-amber-200/60 dark:border-zinc-800 rounded-md text-zinc-900 dark:text-zinc-100 focus:ring-amber-400/40 dark:focus:ring-zinc-700">
                                    <SelectValue placeholder="Priority" />
                                </SelectTrigger>
                                <SelectContent className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-amber-200/60 dark:border-zinc-800">
                                    <SelectItem value="ALL" className="text-xs font-medium">All Priorities</SelectItem>
                                    <SelectItem value="CRITICAL" className="text-xs font-medium">Critical</SelectItem>
                                    <SelectItem value="HIGH" className="text-xs font-medium">High</SelectItem>
                                    <SelectItem value="NORMAL" className="text-xs font-medium">Normal</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </>
                )}

                <div className="flex items-center gap-2 border-l border-amber-200/40 dark:border-zinc-800 pl-4 ml-2">
                    <Select onValueChange={setDateRange} defaultValue="ALL">
                        <SelectTrigger className="w-[120px] h-9 text-xs bg-white/80 dark:bg-zinc-950/80 shadow-sm border-amber-200/60 dark:border-zinc-800 rounded-md font-bold text-zinc-900 dark:text-zinc-100 focus:ring-amber-400/40 dark:focus:ring-zinc-700">
                            <SelectValue placeholder="Date Range" />
                        </SelectTrigger>
                        <SelectContent className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-amber-200/60 dark:border-zinc-800">
                            <SelectItem value="ALL" className="text-xs font-medium">All Time</SelectItem>
                            <SelectItem value="7d" className="text-xs font-medium">Last 7 Days</SelectItem>
                            <SelectItem value="30d" className="text-xs font-medium">Last 30 Days</SelectItem>
                        </SelectContent>
                    </Select>

                    <button
                        onClick={fetchData}
                        disabled={loading}
                        className="h-9 w-9 flex flex-shrink-0 items-center justify-center border border-amber-200/60 dark:border-zinc-700 rounded-md bg-white/80 dark:bg-zinc-900 hover:bg-amber-50 dark:hover:bg-zinc-800 transition-all text-zinc-600 dark:text-zinc-300 disabled:opacity-50 shadow-sm"
                        title="Refresh Data"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-amber-600 dark:text-amber-500' : ''}`} />
                    </button>

                    {activeTab !== 'overview' && (
                        <button
                            onClick={handleExportCsv}
                            className="h-9 px-4 flex items-center justify-center bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-md hover:bg-zinc-800 dark:hover:bg-white transition-all text-xs font-bold shadow-[0_2px_8px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] dark:shadow-none"
                        >
                            <Download className="h-4 w-4 mr-1.5" />
                            Export as .CSV
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DashboardToolbar;
