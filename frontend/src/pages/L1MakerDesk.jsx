import React, { useEffect, useState, useCallback } from 'react';
import apiClient from '../api/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ShieldAlert, Cpu, ChevronRight, ChevronLeft, FileText, XCircle, AlertTriangle, Sparkles, Search, BarChart2, RefreshCw, Copy, Check, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { getServiceType } from '../config/serviceTypes';
import { format } from 'date-fns';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// ─── Sub-components ──────────────────────────────────────────────────────────

const PriorityDot = ({ priority }) => {
    const colors = {
        CRITICAL: 'bg-red-500',
        HIGH: 'bg-amber-500',
        NORMAL: 'bg-blue-500',
    };
    return <span className={`inline-block w-1.5 h-1.5 rounded-full ${colors[priority] || 'bg-zinc-400'} shrink-0`} />;
};

const PriorityBadge = ({ priority }) => {
    let colorClass = 'bg-zinc-100/80 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700';
    if (priority === 'CRITICAL') colorClass = 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50';
    else if (priority === 'HIGH') colorClass = 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50';
    else if (priority === 'NORMAL') colorClass = 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/50';
    return <Badge variant="outline" className={`${colorClass} text-[10px] h-4 px-1.5 font-semibold`}>{priority || 'NORMAL'}</Badge>;
};

const stripPrefix = (text) => (text || '').replace(/^\[[A-Z_]+\]\s*/, '');

// ─── Main Component ───────────────────────────────────────────────────────────

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
    const [isActionLoading, setIsActionLoading] = useState({ reject: false, escalate: false });

    const [filterStatus, setFilterStatus] = useState('ALL');
    const [filterPriority, setFilterPriority] = useState('ALL');
    const [filterSearch, setFilterSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchQueue = useCallback(async () => {
        setLoading(true);
        setFetchError(null);
        try {
            const response = await apiClient.get('/l1/tickets', {
                params: { status: filterStatus, priority: filterPriority, search: filterSearch, page, _t: Date.now() }
            });
            setQueue(response.data.tickets || []);
            setTotalPages(response.data.pagination?.pages || 1);
        } catch (error) {
            setFetchError(error.response?.data?.message || 'Failed to fetch tickets');
        } finally {
            setLoading(false);
        }
    }, [filterStatus, filterPriority, filterSearch, page]);

    useEffect(() => { fetchQueue(); }, [fetchQueue]);

    // Reset sentiment when ticket changes
    useEffect(() => { setTicketSentiment(null); }, [selectedTicket?._id]);

    const calculateSLA = (dateString, priority, status) => {
        if (!dateString) return <span className="text-zinc-400 dark:text-zinc-500">N/A</span>;
        if (['CLOSED', 'RESOLVED', 'REJECTED'].includes(status)) {
            return <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1"><Check className="w-3 h-3" /> Met</span>;
        }
        const slaHours = priority === 'CRITICAL' ? 2 : priority === 'HIGH' ? 4 : 24;
        const deadline = new Date(dateString).getTime() + slaHours * 3600000;
        const diffMins = Math.floor((deadline - Date.now()) / 60000);
        if (diffMins < 0) return <span className="text-red-500 dark:text-red-400 font-medium flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Breached</span>;
        if (diffMins < 60) return <span className="text-amber-600 dark:text-amber-400 font-medium">{diffMins}m left</span>;
        return <span className="text-zinc-500 dark:text-zinc-400">{Math.floor(diffMins / 60)}h {diffMins % 60}m</span>;
    };

    const handleRunOcr = async (docId) => {
        try {
            setRunningOcr(docId);
            const res = await apiClient.post(`/tickets/${selectedTicket._id}/documents/${docId}/ocr`);
            setSelectedTicket(prev => ({
                ...prev,
                documents: prev.documents.map(d => d._id === docId ? res.data.document : d)
            }));
        } catch (error) {
            alert(`OCR failed: ${error.response?.data?.message || error.message}`);
        } finally {
            setRunningOcr(null);
        }
    };

    const handleEscalate = async () => {
        if (!selectedTicket) return;
        setIsActionLoading(p => ({ ...p, escalate: true }));
        try {
            await apiClient.post(`/l1/tickets/${selectedTicket._id}/escalate`, { notes });
            setQueue(q => q.filter(t => t._id !== selectedTicket._id));
            setSelectedTicket(null);
            setNotes('');
        } catch (error) {
            alert(`Escalation failed: ${error.response?.data?.message || error.message}`);
        } finally {
            setIsActionLoading(p => ({ ...p, escalate: false }));
        }
    };

    const handleReject = async () => {
        if (!selectedTicket) return;
        if (!notes) { alert('Provide a reason before rejecting.'); return; }
        if (!window.confirm('Reject this ticket? This cannot be undone.')) return;
        setIsActionLoading(p => ({ ...p, reject: true }));
        try {
            await apiClient.post(`/l1/tickets/${selectedTicket._id}/reject`, { reason: notes });
            setQueue(q => q.filter(t => t._id !== selectedTicket._id));
            setSelectedTicket(null);
            setNotes('');
        } catch (error) {
            alert(`Reject failed: ${error.response?.data?.message || error.message}`);
        } finally {
            setIsActionLoading(p => ({ ...p, reject: false }));
        }
    };

    const handleSummarize = async () => {
        if (!selectedTicket?._id) return;
        setLoadingSummary(true);
        try {
            const res = await apiClient.post(`/l1/tickets/${selectedTicket._id}/summarize`);
            setSelectedTicket(prev => ({ ...prev, aiSummary: res.data.summary }));
        } catch (error) {
            alert('Failed to generate AI Summary');
        } finally {
            setLoadingSummary(false);
        }
    };

    const handleRunSentiment = async () => {
        if (!selectedTicket) return;
        setLoadingSentiment(true);
        try {
            const res = await apiClient.post('/tickets/sentiment', {
                title: selectedTicket.title || '',
                description: selectedTicket.description || ''
            });
            setTicketSentiment(res.data.sentiment);
        } catch (error) {
            alert(error.response?.data?.message || 'Sentiment analysis failed.');
        } finally {
            setLoadingSentiment(false);
        }
    };

    const handleSetPriority = async (priority) => {
        if (!selectedTicket) return;
        try {
            await apiClient.patch(`/l1/tickets/${selectedTicket._id}/priority`, { priority });
            setSelectedTicket(prev => ({ ...prev, assignedPriority: priority }));
            setQueue(q => q.map(t => t._id === selectedTicket._id ? { ...t, assignedPriority: priority } : t));
        } catch (error) {
            alert(`Priority update failed: ${error.response?.data?.message || error.message}`);
        }
    };

    const SentimentIcon = () => {
        if (!ticketSentiment?.sentiment) return null;
        if (ticketSentiment.sentiment === 'NEGATIVE') return <TrendingDown className="w-4 h-4 text-red-500" />;
        if (ticketSentiment.sentiment === 'POSITIVE') return <TrendingUp className="w-4 h-4 text-emerald-500" />;
        return <Minus className="w-4 h-4 text-zinc-400" />;
    };

    if (loading && queue.length === 0 && !selectedTicket) {
        return (
            <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center bg-[#faf9f6] dark:bg-[#0A0A0A]">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-200 dark:border-zinc-800 border-t-zinc-700 dark:border-t-zinc-400" />
                    <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">Loading workspace…</span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col md:flex-row h-[calc(100vh-3.5rem)] overflow-hidden bg-[#faf9f6] dark:bg-[#0A0A0A]">

            {/* ── Sidebar Queue ── */}
            <aside className={`w-full md:w-[340px] shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111111] flex-col ${selectedTicket ? 'hidden md:flex' : 'flex'}`}>

                {/* Sidebar Header */}
                <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0" />
                        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">L1 Queue</span>
                        {queue.length > 0 && (
                            <span className="text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-full px-1.5 py-0.5">{queue.length}</span>
                        )}
                    </div>
                    <Button variant="ghost" size="icon" onClick={fetchQueue} disabled={loading} className="h-7 w-7 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200">
                        <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>

                {/* Filters */}
                <div className="px-3 py-2.5 border-b border-zinc-100 dark:border-zinc-800/80 space-y-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-zinc-400" />
                        <Input
                            placeholder="Search…"
                            value={filterSearch}
                            onChange={e => setFilterSearch(e.target.value)}
                            className="pl-8 h-8 text-xs bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="h-7 text-[11px] bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-[#1A1A1A] border-zinc-200 dark:border-zinc-800">
                                <SelectItem value="ALL" className="text-xs">All Status</SelectItem>
                                <SelectItem value="OPEN" className="text-xs">Open</SelectItem>
                                <SelectItem value="IN_PROGRESS" className="text-xs">In Progress</SelectItem>
                                <SelectItem value="L1_REVIEW" className="text-xs">L1 Review</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={filterPriority} onValueChange={setFilterPriority}>
                            <SelectTrigger className="h-7 text-[11px] bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200">
                                <SelectValue placeholder="Priority" />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-[#1A1A1A] border-zinc-200 dark:border-zinc-800">
                                <SelectItem value="ALL" className="text-xs">All</SelectItem>
                                <SelectItem value="CRITICAL" className="text-xs text-red-600 dark:text-red-400">Critical</SelectItem>
                                <SelectItem value="HIGH" className="text-xs text-amber-600 dark:text-amber-400">High</SelectItem>
                                <SelectItem value="NORMAL" className="text-xs text-blue-600 dark:text-blue-400">Normal</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Queue List */}
                <ScrollArea className="flex-1 min-h-0">
                    <div className="p-2">
                        <AnimatePresence>
                            {fetchError ? (
                                <div className="text-center p-6 text-xs text-red-500 flex flex-col items-center gap-2">
                                    <XCircle className="h-5 w-5 opacity-60" />
                                    <p>{fetchError}</p>
                                    <Button variant="outline" size="sm" onClick={fetchQueue} className="h-7 text-xs mt-1">Retry</Button>
                                </div>
                            ) : loading ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="p-3 mb-1.5 rounded-lg border border-zinc-100 dark:border-zinc-800 animate-pulse bg-white dark:bg-zinc-900/50">
                                        <div className="flex justify-between mb-2">
                                            <div className="h-2.5 w-14 bg-zinc-100 dark:bg-zinc-800 rounded" />
                                            <div className="h-4 w-10 bg-zinc-100 dark:bg-zinc-800 rounded-full" />
                                        </div>
                                        <div className="h-3 w-3/4 bg-zinc-100 dark:bg-zinc-800 rounded mb-2" />
                                        <div className="h-3 w-1/2 bg-zinc-100 dark:bg-zinc-800 rounded" />
                                    </div>
                                ))
                            ) : queue.length === 0 ? (
                                <div className="p-8 text-center text-xs text-zinc-400 dark:text-zinc-500">
                                    <FileText className="mx-auto h-6 w-6 mb-2 opacity-30" />
                                    No tickets found
                                </div>
                            ) : (
                                queue.map((ticket) => (
                                    <motion.div
                                        key={ticket._id}
                                        layout
                                        initial={{ opacity: 0, y: -4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.97 }}
                                        onClick={() => { setSelectedTicket(ticket); setNotes(''); }}
                                        className={`relative mb-1.5 p-3 rounded-lg border cursor-pointer transition-all duration-150 ${
                                            selectedTicket?._id === ticket._id
                                                ? 'bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 shadow-sm'
                                                : 'bg-white/60 dark:bg-zinc-900/40 border-zinc-100 dark:border-zinc-800/80 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 hover:border-zinc-200 dark:hover:border-zinc-700'
                                        }`}
                                    >
                                        {selectedTicket?._id === ticket._id && (
                                            <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-amber-500 dark:bg-zinc-400 rounded-r" />
                                        )}
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
                                                #{ticket._id.slice(-8).toUpperCase()}
                                            </span>
                                            <div className="flex items-center gap-1">
                                                {ticket.isPotentialFraud && (
                                                    <span className="text-[9px] font-bold bg-red-500/10 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 rounded px-1 py-0.5">FRAUD</span>
                                                )}
                                                <PriorityBadge priority={ticket.assignedPriority} />
                                            </div>
                                        </div>
                                        <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 line-clamp-1 mb-1.5">
                                            {stripPrefix(ticket.description || ticket.title)}
                                        </p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 bg-zinc-50 dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-100 dark:border-zinc-700">
                                                {getServiceType(ticket.serviceType).label}
                                            </span>
                                            <span className="text-[10px] flex items-center gap-1 text-zinc-400 dark:text-zinc-500">
                                                <Clock className="h-2.5 w-2.5" />
                                                {calculateSLA(ticket.createdAt, ticket.assignedPriority, ticket.status)}
                                            </span>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </AnimatePresence>
                    </div>
                </ScrollArea>

                {/* Pagination */}
                <div className="px-3 py-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <Button variant="ghost" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="h-7 text-xs px-2 text-zinc-500 dark:text-zinc-400">
                        <ChevronLeft className="h-3 w-3 mr-0.5" /> Prev
                    </Button>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500">{page} / {totalPages}</span>
                    <Button variant="ghost" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="h-7 text-xs px-2 text-zinc-500 dark:text-zinc-400">
                        Next <ChevronRight className="h-3 w-3 ml-0.5" />
                    </Button>
                </div>
            </aside>

            {/* ── Main Workspace ── */}
            <main className={`flex-1 flex flex-col min-h-0 overflow-hidden ${!selectedTicket ? 'hidden md:flex' : 'flex'}`}>

                {/* Mobile back */}
                <div className="md:hidden border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111111] px-3 py-2">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedTicket(null)} className="h-7 text-xs text-zinc-500 dark:text-zinc-400">
                        <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Back
                    </Button>
                </div>

                {selectedTicket ? (
                    <motion.div key={selectedTicket._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full overflow-hidden">
                        <ScrollArea className="flex-1 min-h-0">
                            <div className="max-w-3xl mx-auto px-4 md:px-6 py-5 space-y-5 pb-28">

                                {/* Ticket Header */}
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-[10px] bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 px-2 py-0.5 rounded font-medium">
                                            {getServiceType(selectedTicket.serviceType).label}
                                        </span>
                                        <PriorityBadge priority={selectedTicket.assignedPriority} />
                                        <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 px-1.5 py-0.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded flex items-center gap-1">
                                            {selectedTicket._id}
                                            <button
                                                onClick={() => { navigator.clipboard.writeText(selectedTicket._id); setCopiedId(true); setTimeout(() => setCopiedId(false), 2000); }}
                                                className="hover:text-zinc-600 dark:hover:text-zinc-300 ml-0.5"
                                            >
                                                {copiedId ? <Check className="w-2.5 h-2.5 text-emerald-500" /> : <Copy className="w-2.5 h-2.5" />}
                                            </button>
                                        </span>
                                        {selectedTicket.isPotentialFraud && (
                                            <span className="text-[10px] font-bold bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 px-2 py-0.5 rounded">⚠ FRAUD</span>
                                        )}
                                    </div>
                                    <h1 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">
                                        {stripPrefix(selectedTicket.description || selectedTicket.title)}
                                    </h1>
                                    <div className="flex items-center gap-4 text-xs text-zinc-400 dark:text-zinc-500">
                                        <span>Investor: <span className="text-zinc-700 dark:text-zinc-300 font-medium">{selectedTicket.investorName || '—'}</span></span>
                                        <span>Account: <span className="font-mono text-zinc-700 dark:text-zinc-300">{selectedTicket.accountNumber || '—'}</span></span>
                                        <span>SLA: {calculateSLA(selectedTicket.createdAt, selectedTicket.assignedPriority, selectedTicket.status)}</span>
                                    </div>
                                </div>

                                {/* Alerts */}
                                {selectedTicket.l2ReturnNote && (
                                    <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 py-3">
                                        <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-500" />
                                        <AlertTitle className="text-xs font-semibold text-amber-800 dark:text-amber-400">Returned by L2</AlertTitle>
                                        <AlertDescription className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">{selectedTicket.l2ReturnNote}</AlertDescription>
                                    </Alert>
                                )}

                                {/* Service Metadata */}
                                {selectedTicket.serviceMetadata && Object.keys(selectedTicket.serviceMetadata).length > 0 && (() => {
                                    const stConfig = getServiceType(selectedTicket.serviceType);
                                    return (
                                        <div className="bg-white dark:bg-[#161616] border border-zinc-100 dark:border-zinc-800 rounded-lg p-4">
                                            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-3">{stConfig.label} — Details</p>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                                {Object.entries(selectedTicket.serviceMetadata).map(([k, v]) => {
                                                    const fieldDef = stConfig?.requiredFields?.find(f => f.name === k);
                                                    return (
                                                        <div key={k}>
                                                            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mb-0.5">{fieldDef?.label || k}</p>
                                                            <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{v || '—'}</p>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* AI Analysis Row */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">

                                    {/* AI Summary */}
                                    <div className="bg-white dark:bg-[#161616] border border-violet-100 dark:border-violet-900/30 rounded-lg overflow-hidden">
                                        <div className="flex items-center justify-between px-4 py-2.5 border-b border-violet-100 dark:border-violet-900/30 bg-violet-50/60 dark:bg-violet-950/20">
                                            <span className="text-xs font-semibold text-violet-800 dark:text-violet-300 flex items-center gap-1.5">
                                                <Sparkles className="h-3.5 w-3.5" /> AI Summary
                                            </span>
                                            <Button onClick={handleSummarize} disabled={loadingSummary} size="sm" variant="ghost"
                                                className="h-6 text-[10px] px-2 text-violet-700 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900/30">
                                                {loadingSummary ? <RefreshCw className="h-3 w-3 animate-spin" /> : (selectedTicket.aiSummary?.length > 0 ? 'Regenerate' : 'Generate')}
                                            </Button>
                                        </div>
                                        <div className="p-4 min-h-[100px]">
                                            {loadingSummary ? (
                                                <div className="space-y-2">
                                                    {[3, 4, 2.5].map((w, i) => <div key={i} className={`h-2.5 bg-violet-100 dark:bg-violet-900/30 rounded animate-pulse`} style={{ width: `${w * 25}%` }} />)}
                                                </div>
                                            ) : selectedTicket.aiSummary?.length > 0 && selectedTicket.aiSummary[0] !== 'Pending AI Triage' ? (
                                                <ul className="space-y-1.5">
                                                    {selectedTicket.aiSummary.map((b, i) => (
                                                        <li key={i} className="flex gap-2 text-xs text-zinc-700 dark:text-zinc-300">
                                                            <span className="text-violet-400 shrink-0 mt-0.5">•</span>
                                                            {b}
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="text-xs text-zinc-400 dark:text-zinc-500 italic">Click Generate to summarize this ticket.</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Sentiment */}
                                    <div className="bg-white dark:bg-[#161616] border border-zinc-100 dark:border-zinc-800 rounded-lg overflow-hidden">
                                        <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40">
                                            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                                                <BarChart2 className="h-3.5 w-3.5 text-blue-500" /> Sentiment
                                            </span>
                                            <Button onClick={handleRunSentiment} disabled={loadingSentiment} size="sm" variant="ghost"
                                                className="h-6 text-[10px] px-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                                                {loadingSentiment ? <RefreshCw className="h-3 w-3 animate-spin" /> : (ticketSentiment ? 'Re-run' : 'Analyse')}
                                            </Button>
                                        </div>
                                        <div className="p-4 min-h-[100px]">
                                            {loadingSentiment ? (
                                                <div className="space-y-2">
                                                    {[3, 2].map((w, i) => <div key={i} className={`h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse`} style={{ width: `${w * 25}%` }} />)}
                                                </div>
                                            ) : ticketSentiment ? (
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-2">
                                                        <SentimentIcon />
                                                        <span className={`text-xs font-bold ${
                                                            ticketSentiment.sentiment === 'NEGATIVE' ? 'text-red-600 dark:text-red-400' :
                                                            ticketSentiment.sentiment === 'POSITIVE' ? 'text-emerald-600 dark:text-emerald-400' :
                                                            'text-zinc-600 dark:text-zinc-400'
                                                        }`}>{ticketSentiment.sentiment}</span>
                                                        {ticketSentiment.fraud_alert && (
                                                            <span className="text-[10px] font-bold bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 px-1.5 py-0.5 rounded">⚠ Fraud Alert</span>
                                                        )}
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {[
                                                            { label: 'Priority', value: ticketSentiment.priority },
                                                            { label: 'Score', value: typeof ticketSentiment.score === 'number' ? ticketSentiment.score.toFixed(2) : ticketSentiment.score },
                                                            { label: 'Intent', value: ticketSentiment.intent },
                                                        ].map(({ label, value }) => (
                                                            <div key={label} className="bg-zinc-50 dark:bg-zinc-900 rounded p-2 border border-zinc-100 dark:border-zinc-800">
                                                                <p className="text-[9px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-0.5">{label}</p>
                                                                <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">{value || '—'}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-xs text-zinc-400 dark:text-zinc-500 italic">Click Analyse to run sentiment analysis.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Documents */}
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-3 flex items-center gap-1.5">
                                        <FileText className="h-3 w-3" /> Attached Documents
                                    </p>
                                    {selectedTicket.documents?.length > 0 ? (
                                        <div className="space-y-3">
                                            {selectedTicket.documents.map((doc, idx) => (
                                                <div key={doc._id || idx} className="bg-white dark:bg-[#161616] border border-zinc-100 dark:border-zinc-800 rounded-lg overflow-hidden">
                                                    <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800">
                                                        <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                                                            <FileText className="h-3.5 w-3.5 text-amber-500" />
                                                            {doc.name}
                                                        </span>
                                                        {doc.s3Key && (
                                                            <a href={doc.s3Key} target="_blank" rel="noreferrer"
                                                                className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                                                                View →
                                                            </a>
                                                        )}
                                                    </div>
                                                    <div className="p-4">
                                                        {doc.ocrExtraction?.extractedText ? (
                                                            <>
                                                                <p className={`text-[10px] font-semibold flex items-center gap-1 mb-2 ${doc.ocrExtraction.matchVerified ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                                                                    {doc.ocrExtraction.matchVerified ? <Check className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                                                                    {doc.ocrExtraction.matchVerified ? 'OCR Match Verified' : 'OCR Verification Failed'}
                                                                </p>
                                                                <pre className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded p-3 text-[11px] font-mono text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap max-h-36 overflow-y-auto">
                                                                    {doc.ocrExtraction.extractedText}
                                                                </pre>
                                                            </>
                                                        ) : (
                                                            <div className="flex items-center justify-between">
                                                                <p className="text-xs text-zinc-400 dark:text-zinc-500">No OCR data yet.</p>
                                                                <Button variant="outline" size="sm" onClick={() => handleRunOcr(doc._id)} disabled={runningOcr === doc._id}
                                                                    className="h-7 text-xs bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700">
                                                                    {runningOcr === doc._id ? <><RefreshCw className="h-3 w-3 animate-spin mr-1" />Processing…</> : <><Cpu className="h-3 w-3 mr-1" />Run OCR</>}
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg p-8 text-center text-xs text-zinc-400 dark:text-zinc-500">
                                            No documents attached.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </ScrollArea>

                        {/* Action Footer */}
                        <div className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111111] px-4 py-3 shrink-0 z-20">
                            <div className="max-w-3xl mx-auto space-y-2.5">
                                {/* Priority */}
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 shrink-0">Priority:</span>
                                    {['NORMAL', 'HIGH', 'CRITICAL'].map(p => (
                                        <button key={p} onClick={() => handleSetPriority(p)}
                                            className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all ${
                                                selectedTicket?.assignedPriority === p
                                                    ? p === 'CRITICAL' ? 'bg-red-500 text-white border-red-500'
                                                    : p === 'HIGH' ? 'bg-amber-500 text-white border-amber-500'
                                                    : 'bg-blue-500 text-white border-blue-500'
                                                    : 'bg-transparent text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500'
                                            }`}>
                                            {p}
                                        </button>
                                    ))}
                                </div>
                                {/* Notes + Actions */}
                                <div className="flex gap-2 items-end">
                                    <Textarea
                                        rows={2}
                                        placeholder="Maker notes / escalation reason…"
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                        className="resize-none flex-1 text-xs bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 min-h-0"
                                    />
                                    <div className="flex flex-col gap-1.5 shrink-0">
                                        <Button variant="outline" size="sm" onClick={handleReject} disabled={isActionLoading.reject}
                                            className="h-8 text-xs border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 bg-white dark:bg-transparent">
                                            {isActionLoading.reject ? <RefreshCw className="h-3 w-3 animate-spin" /> : <><XCircle className="h-3 w-3 mr-1" />Reject</>}
                                        </Button>
                                        <Button size="sm" onClick={handleEscalate} disabled={isActionLoading.escalate}
                                            className="h-8 text-xs bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-semibold">
                                            {isActionLoading.escalate ? <RefreshCw className="h-3 w-3 animate-spin" /> : <>Escalate <ChevronRight className="h-3 w-3 ml-0.5" /></>}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                        <div className="h-12 w-12 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center mb-3">
                            <Cpu className="h-5 w-5 text-zinc-400 dark:text-zinc-500" />
                        </div>
                        <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Select a ticket</p>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Choose an item from the queue to open the workspace.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default L1MakerDesk;
