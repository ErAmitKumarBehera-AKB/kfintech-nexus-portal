import React, { useEffect, useState, useCallback } from 'react';
import apiClient from '../api/client';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, XCircle, CheckCircle2, Cpu, AlertTriangle, ChevronLeft, ChevronRight, FileText, RefreshCcw, Search, Clock, ShieldAlert, Check, Copy } from 'lucide-react';
import { getServiceType } from '../config/serviceTypes';
import { format } from 'date-fns';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PriorityBadge = ({ priority }) => {
    let cls = 'bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700';
    if (priority === 'CRITICAL') cls = 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50';
    else if (priority === 'HIGH') cls = 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50';
    else if (priority === 'NORMAL') cls = 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/50';
    return <Badge variant="outline" className={`${cls} text-[10px] h-4 px-1.5 font-semibold`}>{priority || 'NORMAL'}</Badge>;
};

const stripPrefix = (text) => (text || '').replace(/^\[[A-Z_]+\]\s*/, '');

const calcSLA = (dateString, priority, status) => {
    if (!dateString) return <span className="text-zinc-400 dark:text-zinc-500">N/A</span>;
    if (['CLOSED', 'RESOLVED', 'REJECTED'].includes(status)) {
        return <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1"><Check className="w-3 h-3" /> Met</span>;
    }
    const slaHours = priority === 'CRITICAL' ? 2 : priority === 'HIGH' ? 4 : 24;
    const diffMins = Math.floor((new Date(dateString).getTime() + slaHours * 3600000 - Date.now()) / 60000);
    if (diffMins < 0) return <span className="text-red-500 dark:text-red-400 font-medium flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Breached</span>;
    if (diffMins < 60) return <span className="text-amber-600 dark:text-amber-400">{diffMins}m left</span>;
    return <span className="text-zinc-500 dark:text-zinc-400">{Math.floor(diffMins / 60)}h {diffMins % 60}m</span>;
};

// ─── Main Component ───────────────────────────────────────────────────────────

const L2CheckerDesk = () => {
    const [queue, setQueue] = useState([]);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);
    const [notes, setNotes] = useState('');

    const [filterServiceType, setFilterServiceType] = useState('ALL');
    const [filterPriority, setFilterPriority] = useState('ALL');
    const [filterSearch, setFilterSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [copiedId, setCopiedId] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(null);

    const fetchQueue = useCallback(async (manual = false) => {
        if (manual) setIsRefreshing(true); else setLoading(true);
        setFetchError(null);
        try {
            const response = await apiClient.get(`/l2/tickets?_t=${Date.now()}`, {
                params: { serviceType: filterServiceType, priority: filterPriority, search: filterSearch, page }
            });
            setQueue(response.data.tickets || []);
            setTotalPages(response.data.pagination?.pages || 1);
        } catch (err) {
            setFetchError('Failed to load L2 queue.');
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, [filterServiceType, filterPriority, filterSearch, page]);

    useEffect(() => { fetchQueue(); }, [fetchQueue]);

    const handleAction = async (action) => {
        if (!selectedTicket) return;
        if ((action === 'RETURN_TO_L1' || action === 'REJECT') && !notes.trim()) {
            alert(`Provide checker comments before ${action === 'REJECT' ? 'rejecting' : 'returning to L1'}.`);
            return;
        }
        if (action === 'REJECT' && !window.confirm('Reject this ticket? This cannot be undone.')) return;
        setIsActionLoading(action);
        try {
            await apiClient.post('/l2/finalize', { ticketId: selectedTicket._id, action, notes });
            setQueue(q => q.filter(t => t._id !== selectedTicket._id));
            setSelectedTicket(null);
            setNotes('');
        } catch (err) {
            alert(`Failed to ${action}. ${err.response?.data?.message || err.message}`);
        } finally {
            setIsActionLoading(null);
        }
    };

    if (loading && queue.length === 0 && !selectedTicket) {
        return (
            <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center bg-[#faf9f6] dark:bg-[#0A0A0A]">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-200 dark:border-zinc-800 border-t-zinc-700 dark:border-t-zinc-400" />
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">Loading workspace…</span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col md:flex-row h-[calc(100vh-3.5rem)] overflow-hidden bg-[#faf9f6] dark:bg-[#0A0A0A]">

            {/* ── Queue Sidebar ── */}
            <aside className={`w-full md:w-[320px] shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111111] flex-col ${selectedTicket ? 'hidden md:flex' : 'flex'}`}>

                {/* Header */}
                <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-amber-500" />
                        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">L2 Verification</span>
                        {queue.length > 0 && (
                            <span className="text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-full px-1.5 py-0.5">{queue.length}</span>
                        )}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => fetchQueue(true)} disabled={loading || isRefreshing}
                        className={`h-7 w-7 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 ${isRefreshing ? 'animate-spin' : ''}`}>
                        <RefreshCcw className="h-3.5 w-3.5" />
                    </Button>
                </div>

                {/* Filters */}
                <div className="px-3 py-2.5 border-b border-zinc-100 dark:border-zinc-800 space-y-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-zinc-400" />
                        <Input placeholder="Search…" value={filterSearch} onChange={e => setFilterSearch(e.target.value)}
                            className="pl-8 h-8 text-xs bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400" />
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                        <Select value={filterServiceType} onValueChange={setFilterServiceType}>
                            <SelectTrigger className="h-7 text-[11px] bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200">
                                <SelectValue placeholder="Service" />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-[#1A1A1A] border-zinc-200 dark:border-zinc-800">
                                <SelectItem value="ALL" className="text-xs">All Services</SelectItem>
                                <SelectItem value="BANK_UPDATE" className="text-xs">Bank Update</SelectItem>
                                <SelectItem value="KYC_UPDATE" className="text-xs">KYC Update</SelectItem>
                                <SelectItem value="NOMINEE_UPDATE" className="text-xs">Nominee Update</SelectItem>
                                <SelectItem value="ADDRESS_UPDATE" className="text-xs">Address Update</SelectItem>
                                <SelectItem value="COMPLAINT" className="text-xs">Complaint</SelectItem>
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

                {/* List */}
                <ScrollArea className="flex-1 min-h-0">
                    <div className="p-2">
                        <AnimatePresence>
                            {fetchError ? (
                                <div className="text-center p-6 text-xs text-red-500 flex flex-col items-center gap-2">
                                    <XCircle className="h-5 w-5 opacity-60" />
                                    <p>{fetchError}</p>
                                    <Button variant="outline" size="sm" onClick={() => fetchQueue(true)} className="h-7 text-xs mt-1">Retry</Button>
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
                                    <CheckCircle2 className="mx-auto h-6 w-6 mb-2 opacity-30 text-emerald-500" />
                                    Inbox zero
                                </div>
                            ) : (
                                queue.map((ticket, i) => (
                                    <motion.div
                                        key={ticket._id}
                                        layout
                                        initial={{ opacity: 0, y: -4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.97 }}
                                        transition={{ delay: i * 0.02 }}
                                        onClick={() => { setSelectedTicket(ticket); setNotes(''); }}
                                        className={`relative mb-1.5 p-3 rounded-lg border cursor-pointer transition-all duration-150 ${
                                            selectedTicket?._id === ticket._id
                                                ? 'bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 shadow-sm'
                                                : 'bg-white/60 dark:bg-zinc-900/40 border-zinc-100 dark:border-zinc-800/80 hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
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
                                                    <span className="text-[9px] font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 rounded px-1 py-0.5">FRAUD</span>
                                                )}
                                                <PriorityBadge priority={ticket.assignedPriority} />
                                            </div>
                                        </div>
                                        <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 line-clamp-1 mb-1.5">
                                            {stripPrefix(ticket.description || ticket.title)}
                                        </p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 bg-zinc-50 dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-100 dark:border-zinc-700">
                                                {getServiceType(ticket.serviceType || 'COMPLAINT').label}
                                            </span>
                                            <span className="text-[10px] flex items-center gap-1 text-zinc-400 dark:text-zinc-500">
                                                <Clock className="h-2.5 w-2.5" />
                                                {calcSLA(ticket.createdAt, ticket.assignedPriority, ticket.status)}
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
                    <Button variant="ghost" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                        className="h-7 text-xs px-2 text-zinc-500 dark:text-zinc-400">
                        <ChevronLeft className="h-3 w-3 mr-0.5" /> Prev
                    </Button>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500">{page} / {totalPages}</span>
                    <Button variant="ghost" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                        className="h-7 text-xs px-2 text-zinc-500 dark:text-zinc-400">
                        Next <ChevronRight className="h-3 w-3 ml-0.5" />
                    </Button>
                </div>
            </aside>

            {/* ── Main Detail ── */}
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
                                            {getServiceType(selectedTicket.serviceType || 'COMPLAINT').label}
                                        </span>
                                        <PriorityBadge priority={selectedTicket.assignedPriority} />
                                        {selectedTicket.isPotentialFraud && (
                                            <span className="text-[10px] font-bold bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 px-2 py-0.5 rounded">⚠ FRAUD</span>
                                        )}
                                        <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 px-1.5 py-0.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded flex items-center gap-1">
                                            {selectedTicket._id}
                                            <button onClick={() => { navigator.clipboard.writeText(selectedTicket._id); setCopiedId(true); setTimeout(() => setCopiedId(false), 2000); }}
                                                className="hover:text-zinc-600 dark:hover:text-zinc-300 ml-0.5">
                                                {copiedId ? <Check className="w-2.5 h-2.5 text-emerald-500" /> : <Copy className="w-2.5 h-2.5" />}
                                            </button>
                                        </span>
                                    </div>
                                    <h1 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">
                                        {stripPrefix(selectedTicket.description || selectedTicket.title)}
                                    </h1>
                                    <div className="flex items-center gap-4 text-xs text-zinc-400 dark:text-zinc-500">
                                        <span>Investor: <span className="text-zinc-700 dark:text-zinc-300 font-medium">{selectedTicket.investorName || '—'}</span></span>
                                        <span>Account: <span className="font-mono text-zinc-700 dark:text-zinc-300">{selectedTicket.accountNumber || '—'}</span></span>
                                        <span>SLA: {calcSLA(selectedTicket.createdAt, selectedTicket.assignedPriority, selectedTicket.status)}</span>
                                    </div>
                                </div>

                                {/* Fraud Alert */}
                                {selectedTicket.isPotentialFraud && (
                                    <Alert className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40 py-3">
                                        <AlertTriangle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                                        <AlertTitle className="text-xs font-semibold text-red-800 dark:text-red-300">Potential Fraud Risk</AlertTitle>
                                        <AlertDescription className="text-xs text-red-700 dark:text-red-400 mt-0.5">Automated systems flagged this request for enhanced scrutiny.</AlertDescription>
                                    </Alert>
                                )}

                                {/* L1 Maker Notes + Risk Grid */}
                                <div className="bg-white dark:bg-[#161616] border border-zinc-100 dark:border-zinc-800 rounded-lg overflow-hidden">
                                    <div className="px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex items-center gap-2">
                                        <ShieldCheck className="h-3.5 w-3.5 text-amber-500" />
                                        <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Compliance & Risk</span>
                                    </div>
                                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">L1 Maker Notes</p>
                                            <p className="text-xs text-zinc-700 dark:text-zinc-300">{selectedTicket.l1Notes || <span className="italic text-zinc-400">No notes.</span>}</p>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            {selectedTicket.isPotentialFraud ? (
                                                <div className="flex items-center gap-2 text-xs text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/20 p-2 rounded border border-red-100 dark:border-red-900/30">
                                                    <ShieldAlert className="h-3.5 w-3.5 shrink-0" /> System Flag: Potential Fraud
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 p-2 rounded border border-emerald-100 dark:border-emerald-900/30">
                                                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> No fraud patterns detected
                                                </div>
                                            )}
                                            {(() => {
                                                const ocrFailed = selectedTicket.documents?.some(d => d.ocrExtraction && !d.ocrExtraction.matchVerified);
                                                const ocrPassed = selectedTicket.documents?.some(d => d.ocrExtraction?.matchVerified);
                                                if (ocrFailed) return (
                                                    <div className="flex items-center gap-2 text-xs text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/20 p-2 rounded border border-red-100 dark:border-red-900/30">
                                                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> OCR Verification Failed
                                                    </div>
                                                );
                                                if (ocrPassed) return (
                                                    <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 p-2 rounded border border-emerald-100 dark:border-emerald-900/30">
                                                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> OCR Matches CRM Records
                                                    </div>
                                                );
                                                return null;
                                            })()}
                                        </div>
                                    </div>
                                </div>

                                {/* Service Metadata */}
                                {selectedTicket.serviceMetadata && Object.keys(selectedTicket.serviceMetadata).length > 0 && (() => {
                                    const stConfig = getServiceType(selectedTicket.serviceType || 'COMPLAINT');
                                    return (
                                        <div className="bg-white dark:bg-[#161616] border border-zinc-100 dark:border-zinc-800 rounded-lg p-4">
                                            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-3">{stConfig.label} — Details</p>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                                {Object.entries(selectedTicket.serviceMetadata).map(([k, v]) => {
                                                    const fieldDef = stConfig?.requiredFields?.find(f => f.name === k);
                                                    return (
                                                        <div key={k}>
                                                            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mb-0.5">{fieldDef?.label || k}</p>
                                                            <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 break-words">{v || '—'}</p>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })()}

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
                                                            <FileText className="h-3.5 w-3.5 text-amber-500" />{doc.name}
                                                        </span>
                                                        {doc.s3Key && (
                                                            <a href={doc.s3Key} target="_blank" rel="noreferrer" className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline">View →</a>
                                                        )}
                                                    </div>
                                                    <div className="p-4">
                                                        {doc.ocrExtraction ? (
                                                            <>
                                                                <p className={`text-[10px] font-semibold flex items-center gap-1 mb-2 ${doc.ocrExtraction.matchVerified ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                                                                    {doc.ocrExtraction.matchVerified ? <Check className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                                                                    {doc.ocrExtraction.matchVerified ? 'OCR Match Verified' : 'OCR Verification Failed'}
                                                                </p>
                                                                <pre className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded p-3 text-[11px] font-mono text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap max-h-36 overflow-y-auto">
                                                                    {doc.ocrExtraction.extractedText || 'No text extracted.'}
                                                                </pre>
                                                            </>
                                                        ) : (
                                                            <p className="text-xs text-zinc-400 dark:text-zinc-500">No OCR data available.</p>
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
                            <div className="max-w-3xl mx-auto flex flex-col sm:flex-row gap-2 items-end">
                                <Input
                                    placeholder="Checker comments (required for rejection or return)…"
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    className="flex-1 h-9 text-xs bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                                />
                                <div className="flex items-center gap-1.5 shrink-0">
                                    <Button variant="outline" size="sm" onClick={() => handleAction('RETURN_TO_L1')} disabled={!!isActionLoading}
                                        className="h-8 text-xs border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20 bg-white dark:bg-transparent">
                                        {isActionLoading === 'RETURN_TO_L1' ? <RefreshCcw className="h-3 w-3 animate-spin mr-1" /> : null}
                                        Return to L1
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => handleAction('REJECT')} disabled={!!isActionLoading}
                                        className="h-8 text-xs border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 bg-white dark:bg-transparent">
                                        {isActionLoading === 'REJECT' ? <RefreshCcw className="h-3 w-3 animate-spin mr-1" /> : null}
                                        Reject
                                    </Button>
                                    <Button size="sm" onClick={() => handleAction('APPROVE')} disabled={!!isActionLoading}
                                        className="h-8 text-xs bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-semibold">
                                        {isActionLoading === 'APPROVE' ? <RefreshCcw className="h-3 w-3 animate-spin mr-1" /> : null}
                                        Approve
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                        <div className="h-12 w-12 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center mb-3">
                            <ShieldCheck className="h-5 w-5 text-zinc-400 dark:text-zinc-500" />
                        </div>
                        <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Select a ticket</p>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Choose an item from the L2 queue to begin verification.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default L2CheckerDesk;
