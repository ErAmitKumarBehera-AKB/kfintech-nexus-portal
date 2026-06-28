import React from 'react';
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, RefreshCw } from 'lucide-react';

const DashboardToolbar = ({ activeTab, setDateRange, setTicketStatus, setTicketPriority, setUserRole, handleExportCsv, fetchData, loading }) => {
    return (
        <div className="w-full max-w-[98%] xl:max-w-7xl mx-auto bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.08)] rounded-2xl px-4 h-16 flex items-center justify-between mb-8 mt-8">
            {/* Left: Tabs */}
            <TabsList className="bg-transparent h-full p-0 flex space-x-2 justify-start rounded-none pl-2 items-center shrink-0">
                    <TabsTrigger 
                        value="overview" 
                        className="rounded-xl data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md px-4 py-1.5 text-sm font-semibold text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 data-[state=active]:hover:bg-indigo-700 data-[state=active]:hover:text-white transition-all"
                    >
                        Overview
                    </TabsTrigger>
                    <TabsTrigger 
                        value="tickets" 
                        className="rounded-xl data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md px-4 py-1.5 text-sm font-semibold text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 data-[state=active]:hover:bg-indigo-700 data-[state=active]:hover:text-white transition-all"
                    >
                        Tickets
                    </TabsTrigger>
                    <TabsTrigger 
                        value="users" 
                        className="rounded-xl data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md px-4 py-1.5 text-sm font-semibold text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 data-[state=active]:hover:bg-indigo-700 data-[state=active]:hover:text-white transition-all"
                    >
                        Users
                    </TabsTrigger>
                    <TabsTrigger 
                        value="agents" 
                        className="rounded-xl data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md px-4 py-1.5 text-sm font-semibold text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 data-[state=active]:hover:bg-indigo-700 data-[state=active]:hover:text-white transition-all"
                    >
                        Agents
                    </TabsTrigger>
                    <TabsTrigger 
                        value="flagged" 
                        className="rounded-xl data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md px-4 py-1.5 text-sm font-semibold text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 data-[state=active]:hover:bg-indigo-700 data-[state=active]:hover:text-white transition-all"
                    >
                        Flagged
                    </TabsTrigger>
            </TabsList>

            {/* Right: Actions */}
            <div className="flex items-center gap-3 shrink-0">
                    
                    {activeTab === 'users' && (
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-zinc-500">Role:</span>
                            <Select onValueChange={setUserRole} defaultValue="ALL">
                                <SelectTrigger className="w-[120px] h-9 text-xs bg-white shadow-sm border-zinc-200 rounded-md">
                                    <SelectValue placeholder="Role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL" className="text-xs">All Roles</SelectItem>
                                    <SelectItem value="INVESTOR" className="text-xs">Investors</SelectItem>
                                    <SelectItem value="ADMIN_L1" className="text-xs">L1 Admins</SelectItem>
                                    <SelectItem value="ADMIN_L2" className="text-xs">L2 Admins</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {(activeTab === 'tickets' || activeTab === 'flagged') && (
                        <>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-zinc-500">Status:</span>
                                <Select onValueChange={setTicketStatus} defaultValue="ALL">
                                    <SelectTrigger className="w-[120px] h-9 text-xs bg-white shadow-sm border-zinc-200 rounded-md">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL" className="text-xs">All Statuses</SelectItem>
                                        <SelectItem value="OPEN" className="text-xs">Open</SelectItem>
                                        <SelectItem value="L1_REVIEW" className="text-xs">L1 Review</SelectItem>
                                        <SelectItem value="L2_APPROVAL" className="text-xs">L2 Approval</SelectItem>
                                        <SelectItem value="RESOLVED" className="text-xs">Resolved</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-zinc-500">Priority:</span>
                                <Select onValueChange={setTicketPriority} defaultValue="ALL">
                                    <SelectTrigger className="w-[120px] h-9 text-xs bg-white shadow-sm border-zinc-200 rounded-md">
                                        <SelectValue placeholder="Priority" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL" className="text-xs">All Priorities</SelectItem>
                                        <SelectItem value="CRITICAL" className="text-xs">Critical</SelectItem>
                                        <SelectItem value="HIGH" className="text-xs">High</SelectItem>
                                        <SelectItem value="NORMAL" className="text-xs">Normal</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </>
                    )}

                <div className="flex items-center gap-2 border-l border-zinc-200 pl-4 ml-2">
                    <Select onValueChange={setDateRange} defaultValue="ALL">
                        <SelectTrigger className="w-[120px] h-9 text-xs bg-white shadow-sm border-zinc-200 rounded-md font-medium">
                            <SelectValue placeholder="Date Range" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL" className="text-xs">All Time</SelectItem>
                            <SelectItem value="7d" className="text-xs">Last 7 Days</SelectItem>
                            <SelectItem value="30d" className="text-xs">Last 30 Days</SelectItem>
                        </SelectContent>
                    </Select>

                    <button 
                        onClick={fetchData} 
                        disabled={loading}
                        className="h-9 w-9 flex flex-shrink-0 items-center justify-center border border-zinc-200 rounded-md bg-white hover:bg-zinc-50 hover:border-zinc-300 transition-all text-zinc-600 disabled:opacity-50 shadow-sm"
                        title="Refresh Data"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
                    </button>

                    {activeTab !== 'overview' && (
                        <button 
                            onClick={handleExportCsv}
                            className="h-9 px-4 flex items-center justify-center bg-zinc-900 text-white rounded-md hover:bg-zinc-800 transition-all text-xs font-semibold shadow-sm hover:shadow-md"
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
