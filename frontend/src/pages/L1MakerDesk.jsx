import React, { useEffect, useState } from 'react';
import apiClient from '../api/client';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { Clock, ShieldAlert, Cpu, ChevronRight, ChevronLeft, FileText, XCircle, AlertTriangle, Sparkles, Filter, Search, BarChart2, RefreshCw, Copy, Check } from 'lucide-react';
import { getServiceType } from '../config/serviceTypes';
import { format } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

const PriorityBadge = ({ priority }) => {
    let colorClass = "bg-zinc-100/80 dark:bg-zinc-800/80 text-zinc-800 dark:text-zinc-200 border-zinc-200/80 dark:border-zinc-700";
    if (priority === 'CRITICAL') colorClass = "bg-red-100/90 dark:bg-red-900/40 text-red-800 dark:text-red-300 border-red-200/80 dark:border-red-900/50";
    else if (priority === 'HIGH') colorClass = "bg-amber-100/90 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border-amber-200/80 dark:border-amber-900/50";
    else if (priority === 'NORMAL') colorClass = "bg-blue-100/90 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 border-blue-200/80 dark:border-blue-900/50";

    return (
        <Badge variant="outline" className={`${colorClass} hover:${colorClass}`}>
            {priority || 'NORMAL'}
        </Badge>
    );
};

const ServiceTypeBadge = ({ serviceType }) => {
    return (
        <Badge variant="outline" className="h-5 px-1.5 text-[10px] bg-white/80 dark:bg-zinc-900/80 text-zinc-700 dark:text-zinc-300 border-amber-200/60 dark:border-zinc-700">
            {getServiceType(serviceType).label}
        </Badge>
    );
};

const stripPrefix = (text) => (text || '').replace(/^\[[A-Z_]+\]\s*/, '');

const L1MakerDesk = () => {
    const [queue, setQueue] = useState([]);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notes, setNotes] = useState('');
    const [runningOcr, setRunningOcr] = useState(null);
    const [loadingSummary, setLoadingSummary] = useState(false);
    const [loadingSentiment, setLoadingSentiment] = useState(false);
    const [ticketSentiment, setTicketSentiment] = useState(null);
    const [fetchError, setFetchError] = useState(null);
    const [copiedId, setCopiedId] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState({ approve: false, reject: false, escalate: false });

    // Filtering State
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [filterPriority, setFilterPriority] = useState('ALL');
    const [filterAssigned, setFilterAssigned] = useState('ALL');
    const [filterAge, setFilterAge] = useState('NEWEST');
    const [filterSearch, setFilterSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchQueue = async () => {
        setLoading(true);
        setFetchError(null);
        try {
            const response = await apiClient.get('/l1/tickets', {
                params: {
                    status: filterStatus,
                    priority: filterPriority,
                    assigned: filterAssigned,
                    age: filterAge,
                    search: filterSearch,
                    page,
                    _t: Date.now()
                }
            });
            setQueue(response.data.tickets || []);
            setTotalPages(response.data.pagination?.pages || 1);
        } catch (error) {
            console.error("Queue Fetch Error:", error);
            setFetchError(error.response?.data?.message || error.message || "Failed to fetch tickets");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQueue();
    }, [filterStatus, filterPriority, filterAssigned, filterAge, filterSearch, page]);

    const calculateSLA = (dateString, priority, status) => {
        if (!dateString) return <span className="text-zinc-500 dark:text-zinc-400">N/A</span>;
        
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
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 0) {
            return <span className="text-red-500 dark:text-red-400 font-semibold flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Breached</span>;
        }

        if (diffMins < 60) {
            return <span className="text-amber-600 dark:text-amber-500 font-semibold">{diffMins}m remaining</span>;
        }

        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        return <span className="text-zinc-600 dark:text-zinc-400 font-medium">{hours}h {mins}m remaining</span>;
    };

    const handleRunOcr = async (docId) => {
        try {
            setRunningOcr(docId);
            const res = await apiClient.post(`/tickets/${selectedTicket._id}/documents/${docId}/ocr`);
            setSelectedTicket(prev => {
                const updatedDocs = prev.documents.map(d =>
                    d._id === docId ? res.data.document : d
                );
                return { ...prev, documents: updatedDocs };
            });
        } catch (error) {
            alert(`OCR Processing failed: ${error.response?.data?.message || error.message}`);
        } finally {
            setRunningOcr(null);
        }
    };

    const handleEscalate = async () => {
        if (!selectedTicket) return;
        setIsActionLoading(prev => ({ ...prev, escalate: true }));
        try {
            await apiClient.post(`/l1/tickets/${selectedTicket._id}/escalate`, { notes });
            setQueue(q => q.filter(t => t._id !== selectedTicket._id));
            setSelectedTicket(null);
            setNotes('');
        } catch (error) {
            alert(`Escalation failed: ${error.response?.data?.message || error.message}`);
        } finally {
            setIsActionLoading(prev => ({ ...prev, escalate: false }));
        }
    };

    const handleReject = async () => {
        if (!selectedTicket) return;
        if (!notes) { alert("Please provide notes/reason for rejection"); return; }
        if (!window.confirm('Reject this request? This action will permanently close the ticket.')) return;
        setIsActionLoading(prev => ({ ...prev, reject: true }));
        try {
            await apiClient.post(`/l1/tickets/${selectedTicket._id}/reject`, { reason: notes });
            setQueue(q => q.filter(t => t._id !== selectedTicket._id));
            setSelectedTicket(null);
            setNotes('');
        } catch (error) {
            alert(`Rejection failed: ${error.response?.data?.message || error.message}`);
        } finally {
            setIsActionLoading(prev => ({ ...prev, reject: false }));
        }
    };

    const handleSummarize = async () => {
        if (!selectedTicket || !selectedTicket._id) return;
        setLoadingSummary(true);
        try {
            const res = await apiClient.post(`/l1/tickets/${selectedTicket._id}/summarize`);
            setSelectedTicket(prev => ({ ...prev, aiSummary: res.data.summary }));
        } catch (error) {
            console.error("Summary error:", error);
            alert("Failed to generate AI Summary");
        } finally {
            setLoadingSummary(false);
        }
    };

    const handleRunSentiment = async () => {
        if (!selectedTicket) return;
        setLoadingSentiment(true);
        try {
            const text = `${selectedTicket.title || ''} ${selectedTicket.description || ''}`;
            const res = await apiClient.post('/tickets/sentiment', { text });
            setTicketSentiment(res.data.sentiment);
        } catch (error) {
            console.error('Sentiment error:', error);
            alert(error.response?.data?.message || "Sentiment Analysis failed.");
            setTicketSentiment(null);
        } finally {
            setLoadingSentiment(false);
        }
    };

    const handleSetPriority = async (priority) => {
        if (!selectedTicket) return;
        try {
            const res = await apiClient.patch(`/l1/tickets/${selectedTicket._id}/priority`, { priority });
            setSelectedTicket(prev => ({ ...prev, assignedPriority: priority }));
            setQueue(q => q.map(t => t._id === selectedTicket._id ? { ...t, assignedPriority: priority } : t));
        } catch (error) {
            alert(`Priority update failed: ${error.response?.data?.message || error.message}`);
        }
    };

    const criticalCount = queue.filter(t => t.assignedPriority === 'CRITICAL').length;
    const normalCount = queue.length - criticalCount;
    const chartData = [
        { name: 'Critical', value: criticalCount, color: '#ef4444' },
        { name: 'Normal', value: normalCount, color: '#3b82f6' }
    ];

    if (loading && queue.length === 0 && !selectedTicket) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-[#faf9f6] dark:bg-zinc-950">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 dark:border-zinc-800 border-t-zinc-800 dark:border-t-zinc-300" />
                    <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 animate-pulse">Loading Workspace...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col md:flex-row h-[calc(100vh-4rem)] overflow-hidden bg-[#faf9f6] dark:bg-[#0A0A0A]">
            <aside className={`w-full md:w-[380px] shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#131313] flex-col shadow-sm z-10 ${selectedTicket ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#131313] flex flex-col">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100 tracking-tight">
                            <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-500" />
                            L1 Maker Queue
                        </h2>
                        <div className="flex items-center gap-1">
                            {queue.length > 0 && (
                                <HoverCard>
                                    <HoverCardTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100" title="View Analytics">
                                            <BarChart2 className="h-4 w-4" />
                                        </Button>
                                    </HoverCardTrigger>
                                    <HoverCardContent className="w-max p-3 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md shadow-xl border-amber-200/60 dark:border-zinc-800" align="end">
                                        <div className="flex items-center gap-4">
                                            <div className="h-16 w-16 relative">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie data={chartData} innerRadius={20} outerRadius={30} paddingAngle={2} dataKey="value" stroke="none">
                                                            {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                                        </Pie>
                                                        <RechartsTooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '12px', padding: '4px 8px' }} />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>
                                            <div className="flex flex-col gap-1 text-xs font-medium">
                                                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500"></div>CRITICAL: <span className="text-zinc-900 dark:text-zinc-100">{criticalCount}</span></div>
                                                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div>NORMAL: <span className="text-zinc-900 dark:text-zinc-100">{normalCount}</span></div>
                                            </div>
                                        </div>
                                    </HoverCardContent>
                                </HoverCard>
                            )}
                            <Button variant="ghost" size="sm" onClick={fetchQueue} disabled={loading} className="h-8 w-8 p-0 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100" title="Refresh Queue">
                                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            </Button>
                        </div>
                    </div>

                    <div className="pt-4 space-y-3">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
                            <Input
                                placeholder="Search tickets..."
                                value={filterSearch}
                                onChange={e => setFilterSearch(e.target.value)}
                                className="pl-9 h-9 bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                                <SelectTrigger className="h-8 text-xs bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700">
                                    <SelectItem value="ALL">All Status</SelectItem>
                                    <SelectItem value="OPEN">Open</SelectItem>
                                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                    <SelectItem value="L1_REVIEW">L1 Review</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={filterAssigned} onValueChange={setFilterAssigned}>
                                <SelectTrigger className="h-8 text-xs bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100">
                                    <SelectValue placeholder="Assign" />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700">
                                    <SelectItem value="ALL">All</SelectItem>
                                    <SelectItem value="ME">Me</SelectItem>
                                    <SelectItem value="UNASSIGNED">Unassigned</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={filterPriority} onValueChange={setFilterPriority}>
                                <SelectTrigger className="h-8 text-xs bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100">
                                    <SelectValue placeholder="Priority" />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700">
                                    <SelectItem value="ALL">All</SelectItem>
                                    <SelectItem value="CRITICAL">Critical</SelectItem>
                                    <SelectItem value="HIGH">High</SelectItem>
                                    <SelectItem value="NORMAL">Normal</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={filterAge} onValueChange={setFilterAge}>
                                <SelectTrigger className="h-8 text-xs bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100">
                                    <SelectValue placeholder="Newest" />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700">
                                    <SelectItem value="NEWEST">Newest</SelectItem>
                                    <SelectItem value="OLDEST">Oldest</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <ScrollArea className="flex-1 min-h-0 custom-scrollbar">
                    <div className="p-3">
                        <AnimatePresence>
                            {fetchError ? (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center p-8 text-red-500 flex flex-col items-center">
                                    <XCircle className="h-8 w-8 mb-2 opacity-50" />
                                    <p className="text-sm font-semibold">Error loading queue</p>
                                    <p className="text-xs mt-1">{fetchError}</p>
                                    <Button variant="outline" size="sm" onClick={fetchQueue} className="mt-4 border-red-200/60 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-900/20">Retry</Button>
                                </motion.div>
                            ) : loading ? (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                    {Array.from({ length: 4 }).map((_, i) => (
                                        <div key={`skel-${i}`} className="p-3 mb-3 rounded-xl border bg-white/60 dark:bg-zinc-900/40 border-amber-100/60 dark:border-zinc-800/60 shadow-sm animate-pulse">
                                            <div className="h-3 w-16 bg-amber-100/60 dark:bg-zinc-800/60 rounded mb-2"></div>
                                            <div className="h-4 w-3/4 bg-amber-100/60 dark:bg-zinc-800/60 rounded mb-3"></div>
                                            <div className="h-5 w-24 bg-amber-100/60 dark:bg-zinc-800/60 rounded-full"></div>
                                        </div>
                                    ))}
                                </motion.div>
                            ) : queue.length === 0 ? (
                                <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">
                                    <FileText className="mx-auto h-8 w-8 mb-2 opacity-40 text-amber-600 dark:text-zinc-500" />
                                    <p className="text-sm font-medium">No tickets found</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {queue.map((ticket) => (
                                        <div
                                            key={ticket._id}
                                            onClick={() => setSelectedTicket(ticket)}
                                            className={`
                                                relative overflow-hidden p-4 rounded-xl border cursor-pointer transition-all duration-200
                                                ${selectedTicket?._id === ticket._id 
                                                    ? 'bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 shadow-md' 
                                                    : 'bg-white/60 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 hover:border-zinc-300 dark:hover:bg-zinc-800 dark:hover:border-zinc-700'}
                                            `}
                                        >
                                            {selectedTicket?._id === ticket._id && (
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500 dark:bg-zinc-400 rounded-l-xl" />
                                            )}
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-xs font-mono font-semibold text-zinc-400 dark:text-zinc-500">#{ticket._id.substring(18).toUpperCase()}</span>
                                                <div className="flex items-center gap-1">
                                                    {ticket.isPotentialFraud && (
                                                        <Badge variant="destructive" className="h-5 px-1.5 text-[10px] bg-red-600">FRAUD</Badge>
                                                    )}
                                                    <PriorityBadge priority={ticket.assignedPriority} />
                                                </div>
                                            </div>
                                            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2 line-clamp-1">
                                                {stripPrefix(ticket.description || ticket.title)}
                                            </h4>
                                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                <ServiceTypeBadge serviceType={ticket.serviceType} />
                                                <Badge variant="secondary" className="bg-amber-50/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-amber-100 dark:border-zinc-700 text-[10px] h-5">
                                                    {ticket.status.replace('_', ' ')}
                                                </Badge>
                                            </div>
                                            <div className="mt-3 flex items-center justify-between text-[11px]">
                                                <div className="flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-zinc-950 rounded border border-amber-100 dark:border-zinc-800">
                                                    <Clock className="h-3 w-3 text-amber-600 dark:text-zinc-400" />
                                                    {calculateSLA(ticket.createdAt, ticket.assignedPriority, ticket.status)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </ScrollArea>
                <div className="p-3 border-t border-amber-200/60 dark:border-zinc-800/80 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md flex items-center justify-between">
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} 
                        className="h-8 text-xs border-amber-200/70 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 bg-white/70 dark:bg-zinc-900/70">
                        <ChevronLeft className="h-3 w-3 mr-1" /> Prev
                    </Button>
                    <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Page {page} of {totalPages}</span>
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} 
                        className="h-8 text-xs border-amber-200/70 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 bg-white/70 dark:bg-zinc-900/70">
                        Next <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                </div>
            </aside>

            <main className={`flex-1 flex flex-col relative min-h-0 overflow-hidden ${!selectedTicket ? 'hidden md:flex' : 'flex'}`}>
                <div className="md:hidden border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedTicket(null)} className="text-zinc-600 dark:text-zinc-300">
                        <ChevronLeft className="h-4 w-4 mr-1" /> Back to Queue
                    </Button>
                </div>

                {selectedTicket ? (
                    <motion.div
                        key={selectedTicket._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col h-full overflow-hidden"
                    >
                        <ScrollArea className="flex-1 min-h-0 custom-scrollbar">
                            <div className="max-w-4xl mx-auto space-y-6 pb-24 p-4 md:p-6">
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                                            <ServiceTypeBadge serviceType={selectedTicket.serviceType} />
                                            <PriorityBadge priority={selectedTicket.assignedPriority} />
                                            <span className="text-xs font-mono font-bold text-zinc-500 dark:text-zinc-400 px-2 py-1 bg-white/60 dark:bg-[#1A1A1A]/60 border border-amber-200/60 dark:border-zinc-800 rounded-md shadow-sm flex items-center gap-1">
                                                ID: {selectedTicket._id}
                                                <button onClick={() => { navigator.clipboard.writeText(selectedTicket._id); setCopiedId(true); setTimeout(() => setCopiedId(false), 2000); }} className="hover:text-zinc-900 dark:hover:text-zinc-100 ml-1">
                                                    {copiedId ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                                </button>
                                            </span>
                                        </div>
                                        <h1 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                                            Ticket Processing Workspace
                                        </h1>
                                    </div>
                                    {selectedTicket.isPotentialFraud && (
                                        <Alert variant="destructive" className="md:w-64 bg-red-50/90 dark:bg-red-950/40 border-red-200 dark:border-red-900/50 backdrop-blur-sm">
                                            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                                            <AlertTitle className="text-red-800 dark:text-red-300 font-bold">Potential Fraud</AlertTitle>
                                            <AlertDescription className="text-xs text-red-700 dark:text-red-400 font-medium">High risk indicators detected.</AlertDescription>
                                        </Alert>
                                    )}
                                </div>

                                {selectedTicket.l2ReturnNote && (
                                    <Alert className="bg-amber-50/90 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50 backdrop-blur-sm shadow-sm">
                                        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                                        <AlertTitle className="text-amber-800 dark:text-amber-400 font-bold">Returned by L2 Checker</AlertTitle>
                                        <AlertDescription className="text-amber-700 dark:text-amber-300 mt-1 font-medium">
                                            {selectedTicket.l2ReturnNote}
                                        </AlertDescription>
                                    </Alert>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-white/65 dark:bg-zinc-900/60 border border-amber-200/60 dark:border-zinc-800/80 rounded-xl p-4 shadow-[0_2px_12px_rgba(120,80,30,0.04)] dark:shadow-[0_2px_16px_rgba(0,0,0,0.3)] backdrop-blur-sm">
                                        <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Investor Name</p>
                                        <p className="font-semibold text-zinc-900 dark:text-zinc-100">{selectedTicket.investorName || 'Unknown Investor'}</p>
                                    </div>
                                    <div className="bg-white/65 dark:bg-zinc-900/60 border border-amber-200/60 dark:border-zinc-800/80 rounded-xl p-4 shadow-[0_2px_12px_rgba(120,80,30,0.04)] dark:shadow-[0_2px_16px_rgba(0,0,0,0.3)] backdrop-blur-sm">
                                        <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Account Number</p>
                                        <p className="font-semibold font-mono text-zinc-900 dark:text-zinc-100">{selectedTicket.accountNumber || 'Not Provided'}</p>
                                    </div>
                                </div>

                                <div className="bg-white/65 dark:bg-zinc-900/60 border border-amber-200/60 dark:border-zinc-800/80 rounded-xl shadow-[0_2px_16px_rgba(120,80,30,0.06)] dark:shadow-[0_2px_20px_rgba(0,0,0,0.3)] backdrop-blur-sm overflow-hidden">
                                    <div className="px-5 py-4 border-b border-amber-100/70 dark:border-zinc-800 flex items-center gap-2 bg-amber-50/40 dark:bg-zinc-900/40">
                                        <FileText className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                                        <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Request Description</h3>
                                    </div>
                                    <div className="p-5 space-y-6">
                                        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 leading-relaxed">
                                            {stripPrefix(selectedTicket.description || selectedTicket.title)}
                                        </p>

                                        {selectedTicket.serviceMetadata && Object.keys(selectedTicket.serviceMetadata).length > 0 && (() => {
                                            const stConfig = getServiceType(selectedTicket.serviceType);
                                            return (
                                                <div className="bg-white/60 dark:bg-zinc-800/40 rounded-lg p-4 border border-amber-200/60 dark:border-zinc-700/60 shadow-sm">
                                                    <h5 className="text-xs font-bold text-amber-900/60 dark:text-zinc-400 uppercase tracking-wider mb-3">
                                                        {stConfig.label} — Submitted Details
                                                    </h5>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        {Object.entries(selectedTicket.serviceMetadata).map(([k, v]) => {
                                                            const fieldDef = stConfig?.requiredFields?.find(f => f.name === k);
                                                            return (
                                                                <div key={k} className="break-words">
                                                                    <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">{fieldDef?.label || k}</p>
                                                                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">{v || '—'}</p>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })()}

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                            <div className="border border-violet-200/60 dark:border-violet-500/20 bg-white/70 dark:bg-violet-900/10 rounded-lg overflow-hidden shadow-sm">
                                                <div className="bg-violet-50/60 dark:bg-violet-900/20 px-4 py-3 border-b border-violet-200/60 dark:border-violet-500/20 flex items-center justify-between">
                                                    <h4 className="text-sm font-bold text-violet-900 dark:text-violet-300 flex items-center gap-2">
                                                        <Sparkles className="h-4 w-4 text-violet-500" /> AI Executive Summary
                                                    </h4>
                                                    <Button
                                                        onClick={handleSummarize}
                                                        disabled={loadingSummary}
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-7 text-xs bg-white dark:bg-[#131313] border-violet-200 dark:border-violet-500/30 hover:bg-violet-50 dark:hover:bg-violet-900/30 text-violet-700 dark:text-violet-300"
                                                    >
                                                        {loadingSummary ? <RefreshCw className="h-3 w-3 mr-1 animate-spin" /> : <Cpu className="h-3 w-3 mr-1" />}
                                                        {loadingSummary ? 'Generating...' : (selectedTicket.aiSummary?.length > 0 ? 'Regenerate' : 'Generate')}
                                                    </Button>
                                                </div>
                                                <div className="p-4 bg-white/40 dark:bg-transparent min-h-[120px]">
                                                    {loadingSummary ? (
                                                        <div className="space-y-2">
                                                            <div className="h-3 bg-violet-100/60 dark:bg-violet-900/30 rounded animate-pulse w-3/4" />
                                                            <div className="h-3 bg-violet-100/60 dark:bg-violet-900/30 rounded animate-pulse w-full" />
                                                            <div className="h-3 bg-violet-100/60 dark:bg-violet-900/30 rounded animate-pulse w-2/3" />
                                                        </div>
                                                    ) : selectedTicket.aiSummary?.length > 0 && selectedTicket.aiSummary[0] !== 'Pending AI Triage' && !selectedTicket.aiSummary[0].includes('Failed') ? (
                                                        <ul className="space-y-2">
                                                            {selectedTicket.aiSummary.map((bullet, idx) => (
                                                                <li key={idx} className="flex gap-2 text-sm font-medium text-zinc-800 dark:text-zinc-300">
                                                                    <span className="text-violet-500 shrink-0">•</span>
                                                                    <span>{bullet}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    ) : (
                                                        <p className="text-sm font-medium text-zinc-400 dark:text-zinc-500 italic">No summary yet — click Generate.</p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="border border-amber-200/60 dark:border-zinc-700/60 bg-white/70 dark:bg-zinc-800/40 rounded-lg overflow-hidden shadow-sm">
                                                <div className="bg-amber-50/60 dark:bg-zinc-900/60 px-4 py-3 border-b border-amber-200/60 dark:border-zinc-700/60 flex items-center justify-between">
                                                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                                                        <BarChart2 className="h-4 w-4 text-blue-500" /> Sentiment
                                                    </h4>
                                                    <Button
                                                        onClick={handleRunSentiment}
                                                        disabled={loadingSentiment}
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-7 text-xs bg-white dark:bg-zinc-800 border-amber-200 dark:border-zinc-700 hover:bg-amber-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200"
                                                    >
                                                        {loadingSentiment ? <RefreshCw className="h-3 w-3 mr-1 animate-spin" /> : <BarChart2 className="h-3 w-3 mr-1 text-blue-500" />}
                                                        {loadingSentiment ? 'Analysing...' : (ticketSentiment ? 'Re-run' : 'Analyse')}
                                                    </Button>
                                                </div>
                                                <div className="p-4 min-h-[120px]">
                                                    {loadingSentiment ? (
                                                        <div className="space-y-2">
                                                            <div className="h-3 bg-amber-100/60 dark:bg-zinc-700/60 rounded animate-pulse w-3/4" />
                                                            <div className="h-3 bg-amber-100/60 dark:bg-zinc-700/60 rounded animate-pulse w-1/2" />
                                                        </div>
                                                    ) : ticketSentiment ? (
                                                        <div className="space-y-3">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold shadow-sm ${
                                                                    ticketSentiment.sentiment === 'NEGATIVE' ? 'bg-red-100 text-red-800 border border-red-200 dark:bg-red-900/50 dark:text-red-200 dark:border-red-800' :
                                                                    ticketSentiment.sentiment === 'POSITIVE' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-200 dark:border-emerald-800' :
                                                                    'bg-zinc-100 text-zinc-800 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700'
                                                                }`}>{ticketSentiment.sentiment}</span>
                                                                
                                                                {ticketSentiment.fraud_alert && (
                                                                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold shadow-sm bg-red-100 text-red-800 border border-red-200 dark:bg-red-900/50 dark:text-red-200 dark:border-red-800">
                                                                        ⚠ Fraud Alert
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-3 mt-2 bg-white/50 dark:bg-zinc-900/50 p-2 rounded border border-amber-100 dark:border-zinc-700/50">
                                                                <div>
                                                                    <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase">Priority:</span> 
                                                                    <div className="font-bold text-zinc-900 dark:text-zinc-100 text-sm mt-0.5">{ticketSentiment.priority}</div>
                                                                </div>
                                                                <div>
                                                                    <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase">Score:</span> 
                                                                    <div className="font-bold text-zinc-900 dark:text-zinc-100 text-sm mt-0.5">
                                                                        {typeof ticketSentiment.score === 'number' ? ticketSentiment.score.toFixed(2) : 'N/A'}
                                                                    </div>
                                                                </div>
                                                                <div className="col-span-2">
                                                                    <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase">Intent:</span> 
                                                                    <div className="font-bold text-zinc-900 dark:text-zinc-100 text-sm mt-0.5">{ticketSentiment.intent}</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm font-medium text-zinc-400 dark:text-zinc-500 italic">No analysis yet — click Analyse.</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Documents Section */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-amber-600 dark:text-amber-500" />
                                        Attached Documents
                                    </h3>
                                    {selectedTicket.documents && selectedTicket.documents.length > 0 ? (
                                        <div className="grid grid-cols-1 gap-4">
                                            {selectedTicket.documents.map((doc, idx) => (
                                                <div key={doc._id || idx} className="rounded-xl border border-amber-200/60 dark:border-zinc-800/80 bg-white/65 dark:bg-zinc-900/60 shadow-[0_2px_12px_rgba(120,80,30,0.04)] dark:shadow-[0_2px_16px_rgba(0,0,0,0.3)] backdrop-blur-sm overflow-hidden">
                                                    <div className="bg-amber-50/60 dark:bg-zinc-800/40 border-b border-amber-100/70 dark:border-zinc-800 px-4 py-3 flex items-center flex-wrap gap-2">
                                                        <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                                                            <Cpu className="h-4 w-4 text-amber-500 shrink-0" /> <span className="truncate max-w-[150px] sm:max-w-full">Document {idx + 1}: {doc.name}</span>
                                                        </span>
                                                    </div>

                                                    <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-amber-100/70 dark:divide-zinc-800">
                                                        <div className="p-5 flex flex-col items-center justify-center bg-white/40 dark:bg-transparent">
                                                            <div className="h-16 w-16 bg-white dark:bg-zinc-900 rounded-xl border border-amber-200/60 dark:border-zinc-700 flex items-center justify-center mb-3 shadow-sm">
                                                                <FileText className="h-8 w-8 text-amber-500 dark:text-amber-600" />
                                                            </div>
                                                            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 text-center break-words w-full px-2">{doc.name}</p>
                                                            <Badge variant="secondary" className="mt-2 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[10px]">
                                                                AES-256 Encrypted
                                                            </Badge>

                                                            {doc.s3Key && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="mt-4 w-full max-w-[200px] bg-white dark:bg-zinc-800 border-amber-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-amber-50 dark:hover:bg-zinc-700"
                                                                    onClick={() => window.open(doc.s3Key, '_blank')}>
                                                                    View Document <ChevronRight className="h-3 w-3 ml-1" />
                                                                </Button>
                                                            )}
                                                        </div>

                                                        <div className="p-5 bg-white/30 dark:bg-zinc-900/30">
                                                            <h5 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                                <Cpu className="h-4 w-4 text-amber-500" /> AI Extraction Result
                                                            </h5>

                                                            {doc.ocrExtraction?.extractedText ? (
                                                                <pre className="bg-white/80 dark:bg-[#1A1A1A] border border-amber-200/60 dark:border-zinc-800 rounded-md p-3 text-xs font-mono font-medium text-zinc-700 dark:text-zinc-300 max-h-[150px] overflow-y-auto whitespace-pre-wrap custom-scrollbar">
                                                                    {doc.ocrExtraction.extractedText}
                                                                </pre>
                                                            ) : (
                                                                <div className="flex flex-col items-center justify-center h-[150px] border border-dashed border-amber-300 dark:border-zinc-700 rounded-md bg-white/50 dark:bg-zinc-900/50">
                                                                    <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-3">No OCR data available.</p>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="bg-white dark:bg-zinc-800 border-amber-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-amber-50 dark:hover:bg-zinc-700"
                                                                        onClick={() => handleRunOcr(doc._id)}
                                                                        disabled={runningOcr === doc._id}>
                                                                        {runningOcr === doc._id ? (
                                                                            <><div className="h-3 w-3 mr-2 animate-spin rounded-full border-2 border-zinc-400 border-t-zinc-900 dark:border-zinc-600 dark:border-t-zinc-100" /> Processing...</>
                                                                        ) : (
                                                                            <><Cpu className="h-3 w-3 mr-2 text-amber-600 dark:text-amber-500" /> Run OCR</>
                                                                        )}
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="rounded-xl border border-dashed border-amber-200/70 dark:border-zinc-800 bg-white/30 dark:bg-zinc-900/20 backdrop-blur-sm p-12 text-center text-zinc-500 dark:text-zinc-400 text-sm font-medium">
                                            No documents attached to this ticket.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </ScrollArea>

                        {/* Sticky Action Footer */}
                        <div className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm z-20 shrink-0">
                            <div className="max-w-4xl mx-auto space-y-3">
                                {/* Priority Selector Row */}
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider shrink-0">Set Priority:</span>
                                    {['NORMAL', 'HIGH', 'CRITICAL'].map(p => (
                                        <button
                                            key={p}
                                            onClick={() => handleSetPriority(p)}
                                            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                                                selectedTicket?.assignedPriority === p
                                                    ? p === 'CRITICAL' ? 'bg-red-600 text-white border-red-600'
                                                    : p === 'HIGH'     ? 'bg-amber-500 text-white border-amber-500'
                                                    :                    'bg-blue-500 text-white border-blue-500'
                                                    : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500'
                                            }`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>

                                {/* Notes + Actions Row */}
                                <div className="flex flex-col sm:flex-row gap-3 items-end">
                                    <div className="flex-1 w-full">
                                        <Textarea
                                            rows={2}
                                            placeholder="Enter Maker Notes or findings here before escalation..."
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            className="resize-none bg-white/90 dark:bg-zinc-950 border-amber-200/60 dark:border-zinc-800 focus-visible:ring-amber-400/40 dark:focus-visible:ring-zinc-700 w-full text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <Button variant="destructive" onClick={handleReject} disabled={isActionLoading.reject} className="whitespace-nowrap bg-red-600 hover:bg-red-700 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 font-bold border dark:border-red-900/50">
                                            {isActionLoading.reject ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="mr-2 h-4 w-4" />} Reject
                                        </Button>
                                        <Button onClick={handleEscalate} disabled={isActionLoading.escalate} className="w-full sm:w-auto cursor-pointer bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 text-white font-bold whitespace-nowrap shadow-md backdrop-blur-sm">
                                            {isActionLoading.escalate ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : 'Escalate to L2'}
                                            {!isActionLoading.escalate && <ChevronRight className="ml-2 h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-transparent h-full relative z-10">
                        <div className="h-16 w-16 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md rounded-full flex items-center justify-center mb-4 border border-amber-200/60 dark:border-zinc-800 shadow-sm">
                            <Cpu className="h-8 w-8 text-amber-400 dark:text-zinc-500" />
                        </div>
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">No Ticket Selected</h3>
                        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-2 max-w-md">
                            Select a ticket from the queue to open the Maker Workspace and begin processing.
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default L1MakerDesk;
