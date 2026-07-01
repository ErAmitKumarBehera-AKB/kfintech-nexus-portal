import React, { useEffect, useState, useCallback } from 'react';
import apiClient from '../api/client';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, XCircle, CheckCircle, Cpu, AlertTriangle, ChevronLeft, FileText, User, Hash, RefreshCcw, Search, Clock, ShieldAlert, CheckCircle2, Copy, Check } from 'lucide-react';
import { getServiceType } from '../config/serviceTypes';
import { format } from 'date-fns';

// Shadcn UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const PriorityBadge = ({ priority }) => {
    let colorClass = "text-zinc-600 dark:text-zinc-400 bg-zinc-100/80 dark:bg-zinc-800/80 border-zinc-200/80 dark:border-zinc-700";
    if (priority === 'CRITICAL') colorClass = "text-red-800 dark:text-red-300 bg-red-100/90 dark:bg-red-900/40 border-red-200/80 dark:border-red-900/50";
    else if (priority === 'HIGH') colorClass = "text-amber-800 dark:text-amber-300 bg-amber-100/90 dark:bg-amber-900/40 border-amber-200/80 dark:border-amber-900/50";
    else if (priority === 'NORMAL') colorClass = "text-blue-800 dark:text-blue-300 bg-blue-100/90 dark:bg-blue-900/40 border-blue-200/80 dark:border-blue-900/50";

    return (
        <Badge variant="outline" className={`font-semibold h-5 px-1.5 text-[10px] shadow-sm ${colorClass}`}>
            {priority || 'NORMAL'}
        </Badge>
    );
};

const ServiceTypeBadge = ({ serviceType }) => {
    return (
        <Badge variant="outline" className="font-semibold h-5 px-1.5 text-[10px] bg-white/80 dark:bg-zinc-900/80 text-zinc-700 dark:text-zinc-300 border-amber-200/60 dark:border-zinc-700">
            {getServiceType(serviceType || 'COMPLAINT').label}
        </Badge>
    );
};

const stripPrefix = (text) => (text || '').replace(/^\[[A-Z_]+\]\s*/, '');

const calculateSLA = (dateString, priority, status) => {
    if (!dateString) return <span className="text-zinc-400 dark:text-zinc-500 font-medium flex items-center gap-1">N/A</span>;
    if (['CLOSED', 'RESOLVED', 'REJECTED'].includes(status)) {
        return <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1"><Check className="w-3 h-3" /> SLA Met</span>;
    }

    let slaHours = 24;
    if (priority === 'CRITICAL') slaHours = 2;
    else if (priority === 'HIGH') slaHours = 4;

    const createdTime = new Date(dateString).getTime();
    const deadline = createdTime + (slaHours * 60 * 60 * 1000);
    const now = new Date().getTime();
    const diffMs = deadline - now;

    if (diffMs <= 0) {
        return <span className="text-red-600 dark:text-red-400 font-bold flex items-center gap-1"><Clock className="w-3 h-3" /> BREACHED</span>;
    }

    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) {
        return <span className="text-amber-600 dark:text-amber-500 font-bold flex items-center gap-1"><Clock className="w-3 h-3" /> {diffMins}m left</span>;
    }

    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return <span className="text-zinc-500 dark:text-zinc-400 font-semibold flex items-center gap-1"><Clock className="w-3 h-3" /> {hours}h {mins}m left</span>;
};

const L2CheckerDesk = () => {
    const [queue, setQueue] = useState([]);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);
    const [notes, setNotes] = useState('');

    // Filtering State
    const [filterServiceType, setFilterServiceType] = useState('ALL');
    const [filterPriority, setFilterPriority] = useState('ALL');
    const [filterSearch, setFilterSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    const [copiedId, setCopiedId] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(null); // 'APPROVE', 'REJECT', 'RETURN_TO_L1'

    const fetchQueue = useCallback(async (manual = false) => {
        if (manual) setIsRefreshing(true);
        else setLoading(true);
        setFetchError(null);

        try {
            const response = await apiClient.get(`/l2/tickets?_t=${new Date().getTime()}`, {
                params: {
                    serviceType: filterServiceType,
                    priority: filterPriority,
                    search: filterSearch,
                    page
                }
            });
            setQueue(response.data.tickets || []);
            setTotalPages(response.data.pagination?.pages || 1);
        } catch (err) {
            console.error("Error fetching L2 queue:", err);
            setFetchError("Failed to load L2 Checker Queue. Ensure the backend is active.");
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, [filterServiceType, filterPriority, filterSearch, page]);

    useEffect(() => {
        fetchQueue();
    }, [fetchQueue]);

    const handleAction = async (action) => {
        if (!selectedTicket) return;

        if ((action === 'RETURN_TO_L1' || action === 'REJECT') && !notes.trim()) {
            alert(`Please provide Checker Comments before choosing to ${action === 'REJECT' ? 'Reject' : 'Return to L1'}.`);
            return;
        }

        if (action === 'REJECT' && !window.confirm('Reject this request? This action will permanently close the ticket.')) {
            return;
        }

        setIsActionLoading(action);
        try {
            await apiClient.post('/l2/finalize', {
                ticketId: selectedTicket._id,
                action,
                notes
            });
            setQueue(current => current.filter(t => t._id !== selectedTicket._id));
            setSelectedTicket(null);
            setNotes('');
        } catch (err) {
            alert(`Failed to execute ${action}. ${err.response?.data?.message || err.message}`);
        } finally {
            setIsActionLoading(null);
        }
    };

    if (loading && queue.length === 0 && !selectedTicket) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-[#faf9f6] dark:bg-zinc-950">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 dark:border-zinc-800 border-t-zinc-800 dark:border-t-zinc-300" />
                    <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 animate-pulse">Loading L2 Workspace...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col md:flex-row h-[calc(100vh-4rem)] overflow-hidden bg-[#faf9f6] dark:bg-[#0A0A0A]">
            {/* Left Sidebar: Queue */}
            <aside className={`w-full md:w-[320px] shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#131313] flex flex-col shadow-sm z-10 ${selectedTicket ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#131313] flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100 tracking-tight">
                            <ShieldCheck className="h-5 w-5 text-amber-600 dark:text-amber-500" />
                            L2 Verification
                        </h2>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => fetchQueue(true)}
                            className={`h-7 w-7 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 ${isRefreshing ? 'animate-spin' : ''}`}
                            title="Refresh Queue"
                            disabled={loading || isRefreshing}
                        >
                            <RefreshCcw className="h-3.5 w-3.5" />
                        </Button>
                    </div>

                    <div className="space-y-3">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                            <Input
                                type="text" placeholder="Search reference..."
                                value={filterSearch} onChange={e => setFilterSearch(e.target.value)}
                                className="pl-8 h-8 text-xs bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus-visible:ring-1 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-600 shadow-sm rounded-md transition-colors"
                            />
                        </div>
                        <Select value={filterServiceType} onValueChange={setFilterServiceType}>
                            <SelectTrigger className="h-8 text-xs bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm rounded-md">
                                <SelectValue placeholder="All Services" />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 shadow-lg rounded-md">
                                <SelectItem value="ALL" className="text-xs font-medium">All Services</SelectItem>
                                <SelectItem value="BANK_UPDATE" className="text-xs font-medium">Bank Update</SelectItem>
                                <SelectItem value="KYC_UPDATE" className="text-xs font-medium">KYC Update</SelectItem>
                                <SelectItem value="NOMINEE_UPDATE" className="text-xs font-medium">Nominee Update</SelectItem>
                                <SelectItem value="ADDRESS_UPDATE" className="text-xs font-medium">Address Update</SelectItem>
                                <SelectItem value="COMPLAINT" className="text-xs font-medium">Complaint</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={filterPriority} onValueChange={setFilterPriority}>
                            <SelectTrigger className="h-8 text-xs bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm rounded-md">
                                <SelectValue placeholder="All Priorities" />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 shadow-lg rounded-md">
                                <SelectItem value="ALL" className="text-xs font-medium">All Priorities</SelectItem>
                                <SelectItem value="NORMAL" className="text-xs font-medium text-blue-600 dark:text-blue-400">Normal</SelectItem>
                                <SelectItem value="HIGH" className="text-xs font-medium text-amber-600 dark:text-amber-400">High</SelectItem>
                                <SelectItem value="CRITICAL" className="text-xs font-medium text-red-600 dark:text-red-400">Critical</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                
                <ScrollArea className="flex-1 min-h-0 custom-scrollbar">
                    <div className="p-3">
                        <AnimatePresence>
                            {fetchError ? (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center p-8 text-red-500 flex flex-col items-center">
                                    <XCircle className="h-6 w-6 mb-2 opacity-50" />
                                    <p className="text-xs font-bold">System Error</p>
                                    <Button variant="ghost" size="sm" onClick={() => fetchQueue(true)} className="mt-2 h-7 text-xs text-red-600 hover:bg-red-50 border border-red-200 bg-white shadow-sm dark:bg-red-950/40 dark:border-red-900/50 dark:hover:bg-red-900/50">Retry</Button>
                                </motion.div>
                            ) : loading ? (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                    {Array.from({ length: 4 }).map((_, i) => (
                                        <div key={`skel-${i}`} className="p-3 mb-2 rounded-xl border bg-white/60 dark:bg-zinc-900/40 border-amber-100/60 dark:border-zinc-800/60 shadow-sm animate-pulse">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="h-3 w-16 bg-amber-100/60 dark:bg-zinc-800/60 rounded"></div>
                                                <div className="h-4 w-12 bg-amber-100/60 dark:bg-zinc-800/60 rounded-full"></div>
                                            </div>
                                            <div className="h-4 w-3/4 bg-amber-100/60 dark:bg-zinc-800/60 rounded mb-3 mt-3"></div>
                                            <div className="flex justify-between items-center mt-auto pt-2 border-t border-amber-50/50 dark:border-zinc-800/50">
                                                <div className="h-4 w-16 bg-amber-100/60 dark:bg-zinc-800/60 rounded-full"></div>
                                                <div className="h-3 w-20 bg-amber-100/60 dark:bg-zinc-800/60 rounded"></div>
                                            </div>
                                        </div>
                                    ))}
                                </motion.div>
                            ) : queue.length === 0 ? (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center p-12">
                                    <CheckCircle className="h-6 w-6 mb-3 mx-auto opacity-40 text-emerald-600 dark:text-emerald-500" />
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400 font-bold">Inbox Zero</p>
                                </motion.div>
                            ) : (
                                <div className="space-y-2">
                                    {queue.map((ticket, i) => (
                                        <motion.div
                                            layout
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ delay: i * 0.02, duration: 0.2 }}
                                            key={ticket._id}
                                            onClick={() => { setSelectedTicket(ticket); setNotes(''); }}
                                            className={`
                                                relative overflow-hidden p-3 cursor-pointer transition-all duration-200 rounded-xl border 
                                                ${selectedTicket?._id === ticket._id 
                                                    ? 'bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 shadow-md' 
                                                    : 'bg-white/60 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 hover:border-zinc-300 dark:hover:bg-zinc-800 dark:hover:border-zinc-700'}
                                            `}
                                        >
                                            {selectedTicket?._id === ticket._id && (
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500 dark:bg-zinc-400 rounded-l-xl" />
                                            )}
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-[11px] font-mono font-bold text-zinc-400 dark:text-zinc-500">#{ticket._id.substring(ticket._id.length - 8).toUpperCase()}</span>
                                                <div className="flex items-center gap-1">
                                                    {ticket.isPotentialFraud && (
                                                        <Badge variant="destructive" className="h-4 px-1 text-[9px] bg-red-600 shadow-sm"><ShieldAlert className="w-2.5 h-2.5 mr-0.5" /> FRAUD</Badge>
                                                    )}
                                                    <PriorityBadge priority={ticket.assignedPriority} />
                                                </div>
                                            </div>
                                            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-3 line-clamp-2 leading-snug">
                                                {stripPrefix(ticket.description || ticket.title)}
                                            </h4>
                                            <div className="flex items-center justify-between mt-auto">
                                                <ServiceTypeBadge serviceType={ticket.serviceType} />
                                                <div className="flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-zinc-950 rounded border border-amber-100 dark:border-zinc-800">
                                                    {calculateSLA(ticket.createdAt, ticket.assignedPriority, ticket.status)}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </ScrollArea>
                {totalPages > 1 && (
                    <div className="p-2 border-t border-amber-200/60 dark:border-zinc-800/80 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md flex justify-between items-center text-[10px]">
                        <Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)} className="h-6 px-2 font-bold text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100">PREV</Button>
                        <span className="font-bold text-zinc-500">{page} / {totalPages}</span>
                        <Button variant="ghost" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="h-6 px-2 font-bold text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100">NEXT</Button>
                    </div>
                )}
            </aside>

            {/* Main Workspace */}
            <main className={`h-full flex-1 flex flex-col relative min-h-0 overflow-hidden ${!selectedTicket ? 'hidden md:flex' : 'flex'}`}>
                {/* Mobile Back Button */}
                <div className="md:hidden border-b border-zinc-200 dark:border-zinc-800 p-2 bg-white dark:bg-zinc-900 shadow-sm">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedTicket(null)} className="text-zinc-600 dark:text-zinc-300 font-bold h-8 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                        <ChevronLeft className="h-4 w-4 mr-1" /> Back
                    </Button>
                </div>

                {selectedTicket ? (
                    <motion.div
                        key={selectedTicket._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-col h-full overflow-hidden w-full"
                    >
                        <ScrollArea className="flex-1 min-h-0 overflow-hidden w-full custom-scrollbar">
                            <div className="max-w-3xl mx-auto px-6 py-8 md:py-10 pb-10 space-y-10">
                                {/* Header */}
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <ServiceTypeBadge serviceType={selectedTicket.serviceType} />
                                        <span className="text-[11px] font-mono font-bold text-zinc-500 dark:text-zinc-400 bg-white/60 dark:bg-zinc-900/60 px-2 py-0.5 rounded border border-amber-200/60 dark:border-zinc-800 shadow-sm flex items-center gap-1">
                                            ID: {selectedTicket._id}
                                            <button onClick={() => { navigator.clipboard.writeText(selectedTicket._id); setCopiedId(true); setTimeout(() => setCopiedId(false), 2000); }} className="hover:text-zinc-900 dark:hover:text-zinc-100 ml-1">
                                                {copiedId ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                            </button>
                                        </span>
                                        <TooltipProvider delayDuration={200}>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-white/60 dark:bg-zinc-900/60 text-amber-500 dark:text-zinc-400 border border-amber-200/60 dark:border-zinc-800 shadow-sm cursor-not-allowed ml-auto transition-colors hover:bg-amber-50 dark:hover:bg-zinc-800">
                                                        <Cpu className="h-3.5 w-3.5" />
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent className="bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 border-none shadow-xl text-xs font-bold">
                                                    AI Summary (Coming Soon)
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-snug">
                                        {stripPrefix(selectedTicket.description || selectedTicket.title)}
                                    </h1>
                                </div>

                                {selectedTicket.isPotentialFraud && (
                                    <Alert variant="destructive" className="bg-red-50/90 dark:bg-red-950/40 border-red-200 dark:border-red-900/50 backdrop-blur-sm shadow-sm rounded-xl">
                                        <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                                        <AlertTitle className="text-sm font-bold text-red-800 dark:text-red-300">Potential Fraud Risk</AlertTitle>
                                        <AlertDescription className="text-xs text-red-700 dark:text-red-400 font-medium mt-1">Automated systems flagged this request for enhanced scrutiny.</AlertDescription>
                                    </Alert>
                                )}

                                {/* Compliance & Fraud Risk Dashboard (SaaS Checker View) */}
                                {(() => {
                                    const ocrFailed = selectedTicket.documents?.some(d => d.ocrExtraction && !d.ocrExtraction.matchVerified);
                                    const ocrPassed = selectedTicket.documents?.some(d => d.ocrExtraction && d.ocrExtraction.matchVerified);
                                    return (
                                        <div className="bg-white/65 dark:bg-zinc-900/60 border border-amber-200/60 dark:border-zinc-800/80 rounded-xl overflow-hidden shadow-[0_2px_12px_rgba(120,80,30,0.04)] dark:shadow-[0_2px_16px_rgba(0,0,0,0.3)] backdrop-blur-sm">
                                            <div className="bg-amber-50/40 dark:bg-zinc-900/40 border-b border-amber-100/70 dark:border-zinc-800 px-4 py-3 flex items-center justify-between">
                                                <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                                                    <ShieldCheck className="h-4 w-4 text-amber-500" /> Compliance & Risk Assessment
                                                </h3>
                                            </div>
                                            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {/* L1 Maker Audit Trail */}
                                                <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-lg p-3">
                                                    <p className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider mb-2">L1 Maker Audit Trail</p>
                                                    <div className="space-y-2">
                                                        <p className="text-xs text-zinc-800 dark:text-zinc-300 font-medium leading-relaxed">
                                                            <span className="font-bold text-zinc-900 dark:text-zinc-100">Maker Notes:</span> {selectedTicket.l1Notes || <span className="italic text-zinc-400 dark:text-zinc-500">No notes provided by L1.</span>}
                                                        </p>
                                                        <Badge variant="outline" className="bg-white dark:bg-zinc-900 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800 text-[10px] h-5 shadow-sm font-bold">Verified by L1 Desk</Badge>
                                                    </div>
                                                </div>
                                                {/* Risk Indicators */}
                                                <div className="flex flex-col gap-2 justify-center">
                                                    {selectedTicket.isPotentialFraud ? (
                                                        <div className="flex items-center gap-2 text-xs font-bold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 p-2 rounded border border-red-200 dark:border-red-900/50 shadow-sm"><ShieldAlert className="h-4 w-4 shrink-0 text-red-600 dark:text-red-500" /> System Flag: Potential Fraud</div>
                                                    ) : (
                                                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded border border-emerald-200 dark:border-emerald-900/50 shadow-sm"><CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-500" /> No systemic fraud patterns detected</div>
                                                    )}

                                                    {ocrFailed ? (
                                                        <div className="flex items-center gap-2 text-xs font-bold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 p-2 rounded border border-red-200 dark:border-red-900/50 shadow-sm"><AlertTriangle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-500" /> OCR Verification Failed on Document</div>
                                                    ) : ocrPassed ? (
                                                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded border border-emerald-200 dark:border-emerald-900/50 shadow-sm"><CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-500" /> OCR Data Matches CRM Records</div>
                                                    ) : (
                                                        <div className="flex items-center gap-2 text-xs font-bold text-zinc-600 dark:text-zinc-400 bg-white/60 dark:bg-zinc-800/60 p-2 rounded border border-amber-200/60 dark:border-zinc-700 shadow-sm"><Cpu className="h-4 w-4 shrink-0 text-amber-500 dark:text-zinc-500" /> No automated extraction data processed</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* Details Grid */}
                                <div className="grid grid-cols-2 gap-x-8 gap-y-8 pt-8 border-t border-amber-200/40 dark:border-zinc-800">
                                    <div className="bg-white/65 dark:bg-zinc-900/60 p-4 rounded-xl border border-amber-200/60 dark:border-zinc-800/80 shadow-[0_2px_12px_rgba(120,80,30,0.04)] dark:shadow-sm backdrop-blur-sm">
                                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1.5"><User className="h-3 w-3" /> Investor</p>
                                        <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{selectedTicket.investorName || 'Unknown Investor'}</p>
                                    </div>
                                    <div className="bg-white/65 dark:bg-zinc-900/60 p-4 rounded-xl border border-amber-200/60 dark:border-zinc-800/80 shadow-[0_2px_12px_rgba(120,80,30,0.04)] dark:shadow-sm backdrop-blur-sm">
                                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Hash className="h-3 w-3" /> Account</p>
                                        <p className="text-sm font-mono font-bold text-zinc-900 dark:text-zinc-100">{selectedTicket.accountNumber || 'Not Provided'}</p>
                                    </div>

                                    {/* Service Metadata */}
                                    {selectedTicket.serviceMetadata && Object.keys(selectedTicket.serviceMetadata).length > 0 && (() => {
                                        const stConfig = getServiceType(selectedTicket.serviceType);
                                        return Object.entries(selectedTicket.serviceMetadata).map(([k, v]) => {
                                            const fieldDef = stConfig?.requiredFields?.find(f => f.name === k);
                                            return (
                                                <div key={k} className="bg-white/65 dark:bg-zinc-900/60 p-4 rounded-xl border border-amber-200/60 dark:border-zinc-800/80 shadow-[0_2px_12px_rgba(120,80,30,0.04)] dark:shadow-sm backdrop-blur-sm">
                                                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1.5"><FileText className="h-3 w-3" /> {fieldDef?.label || k}</p>
                                                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 break-words">{v || '—'}</p>
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>

                                {/* Documents Section */}
                                <div className="pt-6 border-t border-amber-200/40 dark:border-zinc-800">
                                    <h3 className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        Attached Documentation
                                    </h3>
                                    {selectedTicket.documents && selectedTicket.documents.length > 0 ? (
                                        <div className="flex flex-col gap-4">
                                            {selectedTicket.documents.map((doc, idx) => (
                                                <div key={doc._id || idx} className="group flex items-start gap-4 p-5 rounded-xl border border-amber-200/60 dark:border-zinc-800/80 bg-white/65 dark:bg-zinc-900/60 shadow-[0_2px_12px_rgba(120,80,30,0.04)] dark:shadow-[0_2px_16px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_20px_rgba(120,80,30,0.08)] dark:hover:shadow-[0_4px_20px_rgba(0,0,0,0.4)] transition-shadow backdrop-blur-sm">
                                                    <div className="h-10 w-10 rounded-lg bg-white dark:bg-zinc-950 border border-amber-200/60 dark:border-zinc-700 flex items-center justify-center shrink-0 mt-0.5 shadow-sm text-amber-500">
                                                        <FileText className="h-5 w-5" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between gap-4 mb-2">
                                                            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate pr-4">{doc.name}</p>
                                                            {doc.s3Key && (
                                                                <a
                                                                    href={doc.s3Key}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="text-xs font-bold text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 px-2 py-1 rounded shadow-sm"
                                                                >
                                                                    View Source &rarr;
                                                                </a>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <Badge variant="secondary" className="bg-white/80 dark:bg-zinc-800 border border-amber-200/60 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-[10px] h-5 px-1.5 rounded-sm shadow-none font-bold">
                                                                {doc.status}
                                                            </Badge>
                                                        </div>

                                                        {doc.ocrExtraction ? (
                                                            <div className="bg-white/50 dark:bg-zinc-950/50 border border-amber-200/60 dark:border-zinc-800 rounded-lg p-3 mt-2 shadow-sm">
                                                                <p className={`text-xs font-bold flex items-center gap-1.5 mb-2 ${doc.ocrExtraction.matchVerified ? 'text-emerald-700 dark:text-emerald-500' : 'text-red-700 dark:text-red-500'}`}>
                                                                    {doc.ocrExtraction.matchVerified ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                                                                    {doc.ocrExtraction.matchVerified ? 'OCR Matches CRM Data' : 'OCR Verification Failed'}
                                                                </p>
                                                                <pre className="text-xs font-mono font-medium text-zinc-700 dark:text-zinc-300 leading-relaxed break-words bg-white/80 dark:bg-zinc-900 border border-amber-100 dark:border-zinc-800 p-2 rounded shadow-inner custom-scrollbar whitespace-pre-wrap max-h-[150px] overflow-y-auto">
                                                                    {doc.ocrExtraction.extractedText || "No text extracted."}
                                                                </pre>
                                                            </div>
                                                        ) : (
                                                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 font-medium">No automated extraction data available.</p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-8 border border-dashed border-amber-200/70 dark:border-zinc-800 rounded-xl text-center bg-white/30 dark:bg-zinc-900/20 backdrop-blur-sm">
                                            <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400">No documents attached.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </ScrollArea>

                        {/* Standard Action Footer */}
                        <div className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm z-20 shrink-0">
                            <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center gap-4">
                                <div className="flex-1 w-full">
                                    <Input
                                        placeholder="Add mandatory checker comments for rejection or return..."
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        className="h-10 text-sm bg-white/90 dark:bg-zinc-950 border-amber-200/60 dark:border-zinc-800 focus-visible:ring-amber-400/40 dark:focus-visible:ring-zinc-700 shadow-sm rounded-md placeholder:text-zinc-400 font-medium w-full text-zinc-900 dark:text-zinc-100"
                                    />
                                </div>
                                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                                    <Button
                                        variant="outline"
                                        onClick={() => handleAction('RETURN_TO_L1')}
                                        disabled={!!isActionLoading}
                                        className="text-amber-700 dark:text-amber-400 border-amber-200 dark:border-zinc-700 hover:bg-amber-50 dark:hover:bg-zinc-800 hover:text-amber-800 dark:hover:text-amber-300 font-bold flex-1 sm:flex-none bg-white dark:bg-zinc-900"
                                    >
                                        {isActionLoading === 'RETURN_TO_L1' && <RefreshCcw className="h-4 w-4 animate-spin mr-2" />}
                                        Return to L1
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={() => handleAction('REJECT')}
                                        disabled={!!isActionLoading}
                                        className="flex-1 sm:flex-none font-bold bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600"
                                    >
                                        {isActionLoading === 'REJECT' && <RefreshCcw className="h-4 w-4 animate-spin mr-2" />}
                                        Reject
                                    </Button>
                                    <Button
                                        onClick={() => handleAction('APPROVE')}
                                        disabled={!!isActionLoading}
                                        className="bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 font-bold flex-1 sm:flex-none shadow-md"
                                    >
                                        {isActionLoading === 'APPROVE' && <RefreshCcw className="h-4 w-4 animate-spin mr-2" />}
                                        Approve
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-transparent h-full relative z-10">
                        <div className="h-16 w-16 rounded-2xl bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md border border-amber-200/60 dark:border-zinc-800 flex items-center justify-center mb-4 shadow-sm">
                            <ShieldCheck className="h-8 w-8 text-amber-400 dark:text-zinc-500" />
                        </div>
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Select a Ticket</h3>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-[250px] font-medium leading-relaxed">Choose an item from the verification queue to begin L2 review.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default L2CheckerDesk;
