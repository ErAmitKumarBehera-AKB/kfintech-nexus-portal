import React, { useEffect, useState, useCallback } from 'react';
import apiClient from '../api/client';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, XCircle, CheckCircle, Cpu, AlertTriangle, ChevronLeft, FileText, User, Hash, RefreshCcw, Search, Clock, ShieldAlert, CheckCircle2 } from 'lucide-react';
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
    let colorClass = "text-zinc-600 bg-zinc-100/80 border-zinc-200";
    if (priority === 'CRITICAL') colorClass = "text-red-700 bg-red-50 border-red-200";
    else if (priority === 'HIGH') colorClass = "text-orange-700 bg-orange-50 border-orange-200";
    else if (priority === 'NORMAL') colorClass = "text-blue-700 bg-blue-50 border-blue-200";
    
    return (
        <Badge variant="outline" className={`font-medium h-5 px-1.5 text-[10px] shadow-sm ${colorClass}`}>
            {priority || 'NORMAL'}
        </Badge>
    );
};

const ServiceTypeBadge = ({ serviceType }) => {
    return (
        <Badge variant="outline" className="font-medium h-5 px-1.5 text-[10px] bg-white border-zinc-200 text-zinc-700 shadow-sm">
            {getServiceType(serviceType || 'COMPLAINT').label}
        </Badge>
    );
};

const stripPrefix = (text) => (text || '').replace(/^\[[A-Z_]+\]\s*/, '');

const calculateSLA = (dateString, priority) => {
    if (!dateString) return <span className="text-zinc-400">N/A</span>;
    
    let slaHours = 24;
    if (priority === 'CRITICAL') slaHours = 2;
    else if (priority === 'HIGH') slaHours = 4;
    
    const createdTime = new Date(dateString).getTime();
    const deadline = createdTime + (slaHours * 60 * 60 * 1000);
    const now = new Date().getTime();
    const diffMs = deadline - now;
    
    if (diffMs <= 0) {
        return <span className="text-red-600 font-semibold flex items-center gap-1"><Clock className="w-3 h-3" /> BREACHED</span>;
    }
    
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) {
        return <span className="text-amber-600 font-semibold flex items-center gap-1"><Clock className="w-3 h-3" /> {diffMins}m left</span>;
    }
    
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return <span className="text-zinc-500 font-medium flex items-center gap-1"><Clock className="w-3 h-3" /> {hours}h {mins}m left</span>;
};

const L2CheckerDesk = () => {
    const [queue, setQueue] = useState([]);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);
    const [notes, setNotes] = useState('');

    // Filtering State
    const [filterServiceType, setFilterServiceType] = useState('ALL');
    const [filterSearch, setFilterSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchQueue = useCallback(async (manual = false) => {
        if (manual) setIsRefreshing(true);
        else setLoading(true);
        setFetchError(null);
        
        try {
            const response = await apiClient.get(`/l2/tickets?_t=${new Date().getTime()}`, {
                params: {
                    serviceType: filterServiceType,
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
    }, [filterServiceType, filterSearch, page]);

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
        }
    };

    if (loading && queue.length === 0) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-zinc-50">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
            </div>
        );
    }

    return (
        <div className="flex flex-col md:flex-row h-[calc(100vh-4rem)] overflow-hidden bg-zinc-100 selection:bg-zinc-200">
            {/* Sidebar: L2 Queue (Zinc Background for Contrast) */}
            <aside className={`h-full w-full md:w-[340px] shrink-0 border-r border-zinc-200 bg-zinc-50/80 flex flex-col z-10 ${selectedTicket ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-5 border-b border-zinc-200 bg-zinc-50 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-semibold flex items-center gap-2 text-zinc-900">
                            <ShieldCheck className="h-4 w-4 text-zinc-500" />
                            L2 Verification
                        </h2>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => fetchQueue(true)} 
                            className={`h-7 w-7 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200 ${isRefreshing ? 'animate-spin' : ''}`} 
                            title="Refresh Queue"
                            disabled={loading || isRefreshing}
                        >
                            <RefreshCcw className="h-3 w-3" />
                        </Button>
                    </div>

                    <div className="space-y-3">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                            <Input 
                                type="text" placeholder="Search reference..." 
                                value={filterSearch} onChange={e => setFilterSearch(e.target.value)}
                                className="pl-8 h-8 text-xs bg-white border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus-visible:ring-1 focus-visible:ring-zinc-300 shadow-sm rounded-md transition-colors"
                            />
                        </div>
                        <Select value={filterServiceType} onValueChange={setFilterServiceType}>
                            <SelectTrigger className="h-8 text-xs bg-white border-zinc-200 text-zinc-900 focus:ring-1 focus:ring-zinc-300 shadow-sm rounded-md">
                                <SelectValue placeholder="All Services" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-zinc-200 shadow-lg rounded-md">
                                <SelectItem value="ALL" className="text-xs">All Services</SelectItem>
                                <SelectItem value="BANK_UPDATE" className="text-xs">Bank Update</SelectItem>
                                <SelectItem value="KYC_UPDATE" className="text-xs">KYC Update</SelectItem>
                                <SelectItem value="NOMINEE_UPDATE" className="text-xs">Nominee Update</SelectItem>
                                <SelectItem value="ADDRESS_UPDATE" className="text-xs">Address Update</SelectItem>
                                <SelectItem value="COMPLAINT" className="text-xs">Complaint</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <ScrollArea className="flex-1 min-h-0 overflow-hidden bg-zinc-50/50">
                    <div className="p-3">
                        <AnimatePresence>
                            {fetchError ? (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center p-8 text-red-500">
                                    <XCircle className="h-6 w-6 mb-2 mx-auto opacity-50" />
                                    <p className="text-xs font-medium">System Error</p>
                                    <Button variant="ghost" size="sm" onClick={() => fetchQueue(true)} className="mt-2 h-7 text-xs text-red-600 hover:bg-red-50 border border-red-100 bg-white shadow-sm">Retry</Button>
                                </motion.div>
                            ) : queue.length === 0 ? (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center p-12 text-zinc-400">
                                    <CheckCircle className="h-6 w-6 mb-3 mx-auto opacity-40 text-emerald-500" />
                                    <p className="text-sm text-zinc-600 font-medium">Inbox Zero</p>
                                </motion.div>
                            ) : (
                                queue.map((ticket, i) => (
                                    <motion.div 
                                        layout
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: i * 0.02, duration: 0.2 }}
                                        key={ticket._id} 
                                        onClick={() => { setSelectedTicket(ticket); setNotes(''); }}
                                        className={`group relative p-3 mb-2 cursor-pointer transition-all duration-200 rounded-lg border ${
                                            selectedTicket?._id === ticket._id 
                                                ? 'bg-white border-zinc-300 shadow-md ring-1 ring-zinc-900/5' 
                                                : 'bg-transparent border-transparent hover:bg-zinc-100 hover:border-zinc-200'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[11px] font-mono font-semibold text-zinc-500">#{ticket._id.substring(ticket._id.length - 8).toUpperCase()}</span>
                                            <div className="flex items-center gap-1">
                                                {ticket.isPotentialFraud && (
                                                    <Badge variant="destructive" className="h-4 px-1 text-[9px] bg-red-100 text-red-700 border border-red-200 shadow-sm"><ShieldAlert className="w-2.5 h-2.5 mr-0.5" /> FRAUD</Badge>
                                                )}
                                                <PriorityBadge priority={ticket.assignedPriority} />
                                            </div>
                                        </div>
                                        <h4 className="text-sm font-semibold text-zinc-800 mb-3 line-clamp-2 leading-snug">
                                            {stripPrefix(ticket.description || ticket.title)}
                                        </h4>
                                        <div className="flex items-center justify-between mt-auto">
                                            <ServiceTypeBadge serviceType={ticket.serviceType} />
                                            <div className="text-[10px]">
                                                {calculateSLA(ticket.createdAt, ticket.assignedPriority)}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </AnimatePresence>
                    </div>
                </ScrollArea>
                {totalPages > 1 && (
                    <div className="p-2 border-t border-zinc-200 bg-zinc-50 flex justify-between items-center text-[10px]">
                        <Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)} className="h-6 px-2 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900">PREV</Button>
                        <span className="font-medium text-zinc-500">{page} / {totalPages}</span>
                        <Button variant="ghost" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="h-6 px-2 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900">NEXT</Button>
                    </div>
                )}
            </aside>

            {/* Main Workspace */}
            <main className={`h-full flex-1 flex flex-col relative bg-zinc-50 min-h-0 overflow-hidden ${!selectedTicket ? 'hidden md:flex' : 'flex'}`}>
                {/* Mobile Back Button */}
                <div className="md:hidden border-b border-zinc-100 p-2 bg-zinc-50">
                     <Button variant="ghost" size="sm" onClick={() => setSelectedTicket(null)} className="text-zinc-600 h-8 hover:bg-zinc-200">
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
                        <ScrollArea className="flex-1 min-h-0 overflow-hidden w-full">
                            <div className="max-w-3xl mx-auto px-6 py-8 md:py-10 pb-10 space-y-10">
                                {/* Header */}
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <ServiceTypeBadge serviceType={selectedTicket.serviceType} />
                                        <span className="text-[11px] font-mono font-medium text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200 shadow-sm">ID: {selectedTicket._id}</span>
                                        <TooltipProvider delayDuration={200}>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-zinc-50 text-zinc-400 border border-zinc-200 shadow-sm cursor-not-allowed ml-auto transition-colors hover:bg-zinc-100">
                                                        <Cpu className="h-3.5 w-3.5" />
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent className="bg-zinc-900 text-zinc-50 border-none shadow-md text-xs font-medium">
                                                    AI Summary (Coming Soon)
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                    <h1 className="text-2xl font-bold text-zinc-900 tracking-tight leading-snug">
                                        {stripPrefix(selectedTicket.description || selectedTicket.title)}
                                    </h1>
                                </div>
                                
                                {selectedTicket.isPotentialFraud && (
                                    <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-900 shadow-sm rounded-lg">
                                        <AlertTriangle className="h-5 w-5 text-red-600" />
                                        <AlertTitle className="text-sm font-bold">Potential Fraud Risk</AlertTitle>
                                        <AlertDescription className="text-xs text-red-700 font-medium mt-1">Automated systems flagged this request for enhanced scrutiny.</AlertDescription>
                                    </Alert>
                                )}

                                {/* Details Grid */}
                                <div className="grid grid-cols-2 gap-x-8 gap-y-8 pt-6 border-t border-zinc-100">
                                    <div className="bg-zinc-50/50 p-4 rounded-lg border border-zinc-100">
                                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1.5"><User className="h-3 w-3" /> Investor</p>
                                        <p className="text-sm font-semibold text-zinc-900">{selectedTicket.investorName || 'Unknown Investor'}</p>
                                    </div>
                                    <div className="bg-zinc-50/50 p-4 rounded-lg border border-zinc-100">
                                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Hash className="h-3 w-3" /> Account</p>
                                        <p className="text-sm font-mono font-medium text-zinc-900">{selectedTicket.accountNumber || 'Not Provided'}</p>
                                    </div>
                                    
                                    {/* Service Metadata */}
                                    {selectedTicket.serviceMetadata && Object.keys(selectedTicket.serviceMetadata).length > 0 && (() => {
                                        const stConfig = getServiceType(selectedTicket.serviceType);
                                        return Object.entries(selectedTicket.serviceMetadata).map(([k, v]) => {
                                            const fieldDef = stConfig?.requiredFields?.find(f => f.name === k);
                                            return (
                                                <div key={k} className="bg-zinc-50/50 p-4 rounded-lg border border-zinc-100">
                                                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1.5"><FileText className="h-3 w-3" /> {fieldDef?.label || k}</p>
                                                    <p className="text-sm font-semibold text-zinc-900 break-words">{v || '—'}</p>
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>

                                {/* Documents Section */}
                                <div className="pt-6 border-t border-zinc-100">
                                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        Attached Documentation
                                    </h3>
                                    {selectedTicket.documents && selectedTicket.documents.length > 0 ? (
                                        <div className="flex flex-col gap-4">
                                            {selectedTicket.documents.map((doc, idx) => (
                                                <div key={doc._id || idx} className="group flex items-start gap-4 p-5 rounded-xl border border-zinc-200 bg-white shadow-sm hover:shadow-md transition-shadow">
                                                    <div className="h-10 w-10 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center justify-center shrink-0 mt-0.5 shadow-sm text-zinc-500">
                                                        <FileText className="h-5 w-5" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between gap-4 mb-2">
                                                            <p className="text-sm font-semibold text-zinc-900 truncate pr-4">{doc.name}</p>
                                                            {doc.s3Key && (
                                                                <a 
                                                                    href={doc.s3Key} 
                                                                    target="_blank" 
                                                                    rel="noreferrer"
                                                                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-50 px-2 py-1 rounded"
                                                                >
                                                                    View Source &rarr;
                                                                </a>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <Badge variant="secondary" className="bg-zinc-100 border-zinc-200 text-zinc-700 text-[10px] h-5 px-1.5 rounded-sm shadow-none font-medium">
                                                                {doc.status}
                                                            </Badge>
                                                        </div>
                                                        
                                                        {doc.ocrExtraction ? (
                                                            <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 mt-2 shadow-inner">
                                                                <p className={`text-xs font-bold flex items-center gap-1.5 mb-2 ${doc.ocrExtraction.matchVerified ? 'text-emerald-700' : 'text-red-700'}`}>
                                                                    {doc.ocrExtraction.matchVerified ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                                                                    {doc.ocrExtraction.matchVerified ? 'OCR Matches CRM Data' : 'OCR Verification Failed'}
                                                                </p>
                                                                <p className="text-xs font-mono text-zinc-600 line-clamp-3 leading-relaxed break-words bg-white border border-zinc-100 p-2 rounded">
                                                                    {doc.ocrExtraction.extractedText || "No text extracted."}
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            <p className="text-xs text-zinc-400 mt-2 font-medium">No automated extraction data available.</p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-8 border border-dashed border-zinc-200 rounded-xl text-center bg-zinc-50/50">
                                            <p className="text-sm font-medium text-zinc-500">No documents attached.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </ScrollArea>

                        {/* Minimal Action Footer */}
                        <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-zinc-200 p-4 pb-6 z-20 shadow-[0_-15px_40px_-15px_rgba(0,0,0,0.08)]">
                            <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-end gap-4">
                                <div className="flex-1 w-full">
                                    <Input 
                                        placeholder="Add mandatory checker comments for rejection or return..."
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        className="h-10 text-sm bg-white border-zinc-300 focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:border-transparent shadow-sm rounded-md placeholder:text-zinc-400 font-medium"
                                    />
                                </div>
                                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto bg-zinc-50 p-1 rounded-lg border border-zinc-200 shadow-inner">
                                    <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => handleAction('RETURN_TO_L1')} 
                                        className="h-9 px-4 text-xs font-bold text-amber-700 hover:text-amber-800 hover:bg-white hover:shadow-sm transition-all"
                                    >
                                        Return to L1
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => handleAction('REJECT')} 
                                        className="h-9 px-4 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-white hover:shadow-sm transition-all"
                                    >
                                        Reject
                                    </Button>
                                    <Button 
                                        size="sm"
                                        onClick={() => handleAction('APPROVE')} 
                                        className="h-9 px-5 text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-white rounded shadow-sm transition-all"
                                    >
                                        Approve
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-zinc-50/30 h-full">
                        <div className="h-16 w-16 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center mb-4 shadow-sm">
                            <ShieldCheck className="h-8 w-8 text-zinc-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-zinc-900 tracking-tight">Select a Ticket</h3>
                        <p className="text-sm text-zinc-500 mt-1 max-w-[250px] font-medium leading-relaxed">Choose an item from the verification queue to begin L2 review.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default L2CheckerDesk;