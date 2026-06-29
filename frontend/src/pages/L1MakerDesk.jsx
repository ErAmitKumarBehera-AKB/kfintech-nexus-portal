import React, { useEffect, useState } from 'react';
import apiClient from '../api/client';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { Clock, ShieldAlert, Cpu, ChevronRight, ChevronLeft, FileText, XCircle, AlertTriangle, Sparkles, Filter, Search, BarChart2 } from 'lucide-react';
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
    let colorClass = "bg-zinc-100 text-zinc-800";
    if (priority === 'CRITICAL') colorClass = "bg-red-100 text-red-800 border-red-200";
    else if (priority === 'HIGH') colorClass = "bg-orange-100 text-orange-800 border-orange-200";
    else if (priority === 'NORMAL') colorClass = "bg-blue-100 text-blue-800 border-blue-200";
    
    return (
        <Badge variant="outline" className={`${colorClass} hover:${colorClass}`}>
            {priority || 'NORMAL'}
        </Badge>
    );
};

const ServiceTypeBadge = ({ serviceType }) => {
    return (
        <Badge variant="outline" className="h-5 px-1.5 text-[10px] bg-white text-zinc-700">
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
    const [fetchError, setFetchError] = useState(null);
    
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

    const calculateSLA = (dateString, priority) => {
        if (!dateString) return <span className="text-zinc-500">N/A</span>;
        
        let slaHours = 24;
        if (priority === 'CRITICAL') slaHours = 2;
        else if (priority === 'HIGH') slaHours = 4;
        
        const createdTime = new Date(dateString).getTime();
        const deadline = createdTime + (slaHours * 60 * 60 * 1000);
        const now = new Date().getTime();
        const diffMs = deadline - now;
        
        if (diffMs <= 0) {
            return <span className="text-red-600 font-medium">SLA BREACHED</span>;
        }
        
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 60) {
            return <span className="text-amber-600 font-medium">{diffMins}m remaining</span>;
        }
        
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        return <span className="text-zinc-600">{hours}h {mins}m remaining</span>;
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
        try {
            await apiClient.post(`/l1/tickets/${selectedTicket._id}/escalate`, { notes });
            setQueue(q => q.filter(t => t._id !== selectedTicket._id));
            setSelectedTicket(null);
            setNotes('');
        } catch (error) {
            alert(`Escalation failed: ${error.response?.data?.message || error.message}`);
        }
    };

    const handleReject = async () => {
        if (!selectedTicket) return;
        if (!notes) { alert("Please provide notes/reason for rejection"); return; }
        if (!window.confirm('Reject this request? This action will permanently close the ticket.')) return;
        try {
            await apiClient.post(`/l1/tickets/${selectedTicket._id}/reject`, { reason: notes });
            setQueue(q => q.filter(t => t._id !== selectedTicket._id));
            setSelectedTicket(null);
            setNotes('');
        } catch (error) {
            alert(`Rejection failed: ${error.response?.data?.message || error.message}`);
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

    // Chart Data
    const criticalCount = queue.filter(t => t.assignedPriority === 'CRITICAL').length;
    const normalCount = queue.length - criticalCount;
    const chartData = [
        { name: 'Critical', value: criticalCount, color: '#ef4444' },
        { name: 'Normal', value: normalCount, color: '#3b82f6' }
    ];

    if (loading && queue.length === 0) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-zinc-50">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900" />
            </div>
        );
    }

    return (
        <div className="flex flex-col md:flex-row h-[calc(100vh-4rem)] overflow-hidden bg-zinc-50">
            {/* Sidebar: L1 Queue */}
            <aside className={`w-full md:w-[380px] shrink-0 border-r border-zinc-200 bg-white flex-col shadow-sm z-10 ${selectedTicket ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b border-zinc-200 bg-white flex flex-col">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold flex items-center gap-2 text-zinc-900">
                            <ShieldAlert className="h-5 w-5 text-zinc-700" />
                            L1 Maker Queue
                        </h2>
                        <div className="flex items-center gap-1">
                            {queue.length > 0 && (
                                <HoverCard>
                                    <HoverCardTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-zinc-500 hover:text-zinc-900" title="View Analytics">
                                            <BarChart2 className="h-4 w-4" />
                                        </Button>
                                    </HoverCardTrigger>
                                    <HoverCardContent className="w-64 p-3 bg-white" align="end">
                                        <div className="flex items-center justify-between">
                                            <div className="h-16 w-16 relative">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie data={chartData} innerRadius={20} outerRadius={30} paddingAngle={2} dataKey="value" stroke="none">
                                                            {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                                        </Pie>
                                                        <RechartsTooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e4e4e7', borderRadius: '6px', fontSize: '12px', padding: '4px 8px' }} />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>
                                            <div className="flex flex-col gap-1 text-xs font-medium">
                                                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500"></div>CRITICAL: <span className="text-zinc-900">{criticalCount}</span></div>
                                                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div>NORMAL: <span className="text-zinc-900">{normalCount}</span></div>
                                            </div>
                                        </div>
                                    </HoverCardContent>
                                </HoverCard>
                            )}
                            <Button variant="ghost" size="sm" onClick={fetchQueue} className="h-8 w-8 p-0 text-zinc-500 hover:text-zinc-900" title="Refresh Queue">
                                <Clock className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Filters Section */}
                    <div className="mt-4 space-y-3">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
                            <Input 
                                type="text" placeholder="Search tickets..." 
                                value={filterSearch} onChange={e => setFilterSearch(e.target.value)}
                                className="pl-9 h-9 text-sm bg-white border-zinc-200 text-zinc-900 placeholder:text-zinc-500 hover:bg-zinc-50 transition-colors focus-visible:ring-zinc-200"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                                <SelectTrigger className="h-8 text-xs bg-white border-zinc-200 text-zinc-900 hover:bg-zinc-50 transition-colors">
                                    <span className="text-zinc-500 mr-1">Status:</span>
                                    <SelectValue placeholder="All" />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-zinc-200">
                                    <SelectItem value="ALL">All Status</SelectItem>
                                    <SelectItem value="OPEN">Open</SelectItem>
                                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                    <SelectItem value="L1_REVIEW">L1 Review</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={filterAssigned} onValueChange={setFilterAssigned}>
                                <SelectTrigger className="h-8 text-xs bg-white border-zinc-200 text-zinc-900 hover:bg-zinc-50 transition-colors">
                                    <span className="text-zinc-500 mr-1">Assign:</span>
                                    <SelectValue placeholder="All" />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-zinc-200">
                                    <SelectItem value="ALL">All</SelectItem>
                                    <SelectItem value="ME">Me</SelectItem>
                                    <SelectItem value="UNASSIGNED">Unassigned</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={filterPriority} onValueChange={setFilterPriority}>
                                <SelectTrigger className="h-8 text-xs bg-white border-zinc-200 text-zinc-900 hover:bg-zinc-50 transition-colors">
                                    <span className="text-zinc-500 mr-1">Priority:</span>
                                    <SelectValue placeholder="All" />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-zinc-200">
                                    <SelectItem value="ALL">All</SelectItem>
                                    <SelectItem value="CRITICAL">Critical</SelectItem>
                                    <SelectItem value="HIGH">High</SelectItem>
                                    <SelectItem value="NORMAL">Normal</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={filterAge} onValueChange={setFilterAge}>
                                <SelectTrigger className="h-8 text-xs bg-white border-zinc-200 text-zinc-900 hover:bg-zinc-50 transition-colors">
                                    <span className="text-zinc-500 mr-1">Sort:</span>
                                    <SelectValue placeholder="Newest" />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-zinc-200">
                                    <SelectItem value="NEWEST">Newest</SelectItem>
                                    <SelectItem value="OLDEST">Oldest</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
                
                <ScrollArea className="flex-1 min-h-0 bg-zinc-50/50">
                    <div className="p-3">
                        <AnimatePresence>
                            {fetchError ? (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center p-8 text-red-500 flex flex-col items-center">
                                <XCircle className="h-8 w-8 mb-2 opacity-50" />
                                <p className="text-sm font-medium">Error loading queue</p>
                                <p className="text-xs mt-1">{fetchError}</p>
                                <Button variant="outline" size="sm" onClick={fetchQueue} className="mt-4">Retry</Button>
                            </motion.div>
                        ) : queue.length === 0 ? (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center p-8 text-zinc-500 flex flex-col items-center">
                                <Filter className="h-8 w-8 mb-2 opacity-20" />
                                <p className="text-sm">Queue is empty</p>
                                {(filterStatus !== 'ALL' || filterAssigned !== 'ALL' || filterSearch !== '') && (
                                    <p className="text-xs mt-1 text-zinc-400">Try clearing your filters.</p>
                                )}
                            </motion.div>
                        ) : (
                            queue.map((ticket, i) => (
                                <motion.div 
                                    layout
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ delay: i * 0.03 }}
                                    key={ticket._id} 
                                    onClick={() => { setSelectedTicket(ticket); setNotes(''); }}
                                    className={`relative p-3 mb-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                                        selectedTicket?._id === ticket._id 
                                            ? 'bg-zinc-100 border-zinc-300 shadow-inner' 
                                            : 'bg-white border-zinc-200 hover:border-zinc-300 hover:shadow-sm'
                                    }`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-xs font-mono font-medium text-zinc-500">#{ticket._id.substring(18).toUpperCase()}</span>
                                        <div className="flex items-center gap-1">
                                            {ticket.isPotentialFraud && (
                                                <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">FRAUD</Badge>
                                            )}
                                            <PriorityBadge priority={ticket.assignedPriority} />
                                        </div>
                                    </div>
                                    <h4 className="text-sm font-medium text-zinc-900 mb-1 line-clamp-1">
                                        {stripPrefix(ticket.description || ticket.title)}
                                    </h4>
                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                        <ServiceTypeBadge serviceType={ticket.serviceType} />
                                        <Badge variant="secondary" className="bg-zinc-100 text-[10px] h-5">{ticket.status.replace('_', ' ')}</Badge>
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-zinc-500 mt-2 pt-2 border-t border-zinc-100">
                                        <span>{ticket.createdAt ? format(new Date(ticket.createdAt), 'MMM dd') : 'N/A'}</span>
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
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
                    <div className="p-2 border-t border-zinc-200 bg-white flex justify-between items-center text-xs">
                        <Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)} className="h-7 text-xs">PREV</Button>
                        <span className="font-medium text-zinc-500">{page} / {totalPages}</span>
                        <Button variant="ghost" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="h-7 text-xs">NEXT</Button>
                    </div>
                )}
            </aside>

            {/* Main Workspace */}
            <main className={`flex-1 flex flex-col relative bg-zinc-50 min-h-0 overflow-hidden ${!selectedTicket ? 'hidden md:flex' : 'flex'}`}>
                {/* Mobile Back Button */}
                <div className="md:hidden border-b border-zinc-200 bg-white p-2">
                     <Button variant="ghost" size="sm" onClick={() => setSelectedTicket(null)} className="text-zinc-600">
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
                        <ScrollArea className="flex-1 min-h-0">
                            <div className="max-w-4xl mx-auto space-y-6 pb-24 p-4 md:p-6">
                                {/* Header */}
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                                            <ServiceTypeBadge serviceType={selectedTicket.serviceType} />
                                            <PriorityBadge priority={selectedTicket.assignedPriority} />
                                            <span className="text-xs font-mono text-zinc-500 px-2 py-1 bg-zinc-200/50 rounded-md">ID: {selectedTicket._id}</span>
                                        </div>
                                        <h1 className="text-xl md:text-2xl font-semibold text-zinc-900">
                                            Ticket Processing Workspace
                                        </h1>
                                    </div>
                                    {selectedTicket.isPotentialFraud && (
                                        <Alert variant="destructive" className="md:w-64">
                                            <AlertTriangle className="h-4 w-4" />
                                            <AlertTitle>Potential Fraud</AlertTitle>
                                            <AlertDescription className="text-xs">High risk indicators detected.</AlertDescription>
                                        </Alert>
                                    )}
                                </div>
                                
                                {/* L2 Return Note Banner */}
                                {selectedTicket.l2ReturnNote && (
                                    <Alert className="bg-amber-50 border-amber-200">
                                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                                        <AlertTitle className="text-amber-800">Returned by L2 Checker</AlertTitle>
                                        <AlertDescription className="text-amber-700 mt-1">
                                            {selectedTicket.l2ReturnNote}
                                        </AlertDescription>
                                    </Alert>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Card>
                                        <CardContent className="p-4">
                                            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Investor Name</p>
                                            <p className="font-medium text-zinc-900">{selectedTicket.investorName || 'Unknown Investor'}</p>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardContent className="p-4">
                                            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Account Number</p>
                                            <p className="font-medium font-mono text-zinc-900">{selectedTicket.accountNumber || 'Not Provided'}</p>
                                        </CardContent>
                                    </Card>
                                </div>

                                <Card>
                                    <CardHeader className="pb-3 border-b border-zinc-100">
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-zinc-500" />
                                            Request Description
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-4 space-y-6">
                                        <p className="text-sm text-zinc-700 leading-relaxed">
                                            {stripPrefix(selectedTicket.description || selectedTicket.title)}
                                        </p>

                                        {/* Service Metadata Panel */}
                                        {selectedTicket.serviceMetadata && Object.keys(selectedTicket.serviceMetadata).length > 0 && (() => {
                                            const stConfig = getServiceType(selectedTicket.serviceType);
                                            return (
                                                <div className="bg-zinc-50 rounded-lg p-4 border border-zinc-200">
                                                    <h5 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider mb-3">
                                                        {stConfig.label} — Submitted Details
                                                    </h5>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        {Object.entries(selectedTicket.serviceMetadata).map(([k, v]) => {
                                                            const fieldDef = stConfig?.requiredFields?.find(f => f.name === k);
                                                            return (
                                                                <div key={k} className="break-words">
                                                                    <p className="text-xs text-zinc-500">{fieldDef?.label || k}</p>
                                                                    <p className="text-sm font-medium text-zinc-900 mt-0.5">{v || '—'}</p>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                        
                                        {/* AI Summary Section */}
                                        <div className="border border-indigo-100 bg-indigo-50/30 rounded-lg overflow-hidden">
                                            <div className="bg-indigo-50/50 px-4 py-3 border-b border-indigo-100 flex items-center justify-between">
                                                <h4 className="text-sm font-semibold text-indigo-900 flex items-center gap-2">
                                                    <Sparkles className="h-4 w-4 text-indigo-500" /> AI Ticket Summary
                                                </h4>
                                                {(!selectedTicket.aiSummary || selectedTicket.aiSummary.length === 0 || selectedTicket.aiSummary[0] === 'Pending AI Triage') && (
                                                    <Button 
                                                        onClick={handleSummarize}
                                                        disabled={loadingSummary}
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-7 text-xs bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                                                    >
                                                        {loadingSummary ? <Cpu className="h-3 w-3 mr-1 animate-pulse" /> : <Sparkles className="h-3 w-3 mr-1" />}
                                                        {loadingSummary ? 'Generating...' : 'Generate Summary'}
                                                    </Button>
                                                )}
                                            </div>
                                            
                                            <div className="p-4">
                                                {selectedTicket.aiSummary && selectedTicket.aiSummary.length > 0 && selectedTicket.aiSummary[0] !== 'Pending AI Triage' ? (
                                                    <ul className="space-y-2">
                                                        {selectedTicket.aiSummary.map((bullet, idx) => (
                                                            <li key={idx} className="flex gap-2 text-sm text-indigo-900/80">
                                                                <span className="text-indigo-400 mt-0.5">•</span>
                                                                <span>{bullet}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    !loadingSummary && <p className="text-sm text-zinc-500 italic">No summary generated yet.</p>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Documents Section */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-zinc-400" />
                                        Attached Documents
                                    </h3>
                                    {selectedTicket.documents && selectedTicket.documents.length > 0 ? (
                                        <div className="grid grid-cols-1 gap-4">
                                            {selectedTicket.documents.map((doc, idx) => (
                                                <Card key={doc._id || idx} className="overflow-hidden">
                                                    <div className="bg-zinc-50 border-b border-zinc-100 px-4 py-3 flex items-center flex-wrap gap-2">
                                                        <span className="text-sm font-medium text-zinc-900 flex items-center gap-2">
                                                            <Cpu className="h-4 w-4 text-zinc-400 shrink-0" /> <span className="truncate max-w-[150px] sm:max-w-full">Document {idx + 1}: {doc.name}</span>
                                                        </span>
                                                    </div>
                                                    
                                                    <CardContent className="p-0">
                                                        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-zinc-100">
                                                            <div className="p-5 flex flex-col items-center justify-center bg-white">
                                                                <div className="h-16 w-16 bg-zinc-50 rounded-xl border border-zinc-200 flex items-center justify-center mb-3">
                                                                    <FileText className="h-8 w-8 text-zinc-400" />
                                                                </div>
                                                                <p className="text-sm font-medium text-zinc-900 text-center break-words w-full px-2">{doc.name}</p>
                                                                <Badge variant="secondary" className="mt-2 bg-blue-50 text-blue-700 text-[10px]">AES-256 Encrypted</Badge>
                                                                
                                                                {doc.s3Key && (
                                                                    <Button 
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="mt-4 w-full max-w-[200px]"
                                                                        onClick={() => window.open(doc.s3Key, '_blank')}>
                                                                        View Document <ChevronRight className="h-3 w-3 ml-1" />
                                                                    </Button>
                                                                )}
                                                            </div>

                                                            <div className="p-5 bg-zinc-50/50">
                                                                <h5 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                                    <Cpu className="h-4 w-4 text-zinc-500" /> AI Extraction Result
                                                                </h5>
                                                                
                                                                {doc.ocrExtraction?.extractedText ? (
                                                                    <div className="bg-white border border-zinc-200 rounded-md p-3 text-xs font-mono text-zinc-600 max-h-[150px] overflow-y-auto whitespace-pre-wrap">
                                                                        {doc.ocrExtraction.extractedText}
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex flex-col items-center justify-center h-[150px] border border-dashed border-zinc-300 rounded-md bg-white">
                                                                        <p className="text-sm text-zinc-500 mb-3">No OCR data available.</p>
                                                                        <Button 
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={() => handleRunOcr(doc._id)}
                                                                            disabled={runningOcr === doc._id}>
                                                                            {runningOcr === doc._id ? (
                                                                                <><div className="h-3 w-3 mr-2 animate-spin rounded-full border-2 border-zinc-400 border-t-zinc-900" /> Processing...</>
                                                                            ) : (
                                                                                <><Cpu className="h-3 w-3 mr-2" /> Run OCR</>
                                                                            )}
                                                                        </Button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    ) : (
                                        <Card className="border-dashed shadow-none bg-transparent">
                                            <CardContent className="p-12 text-center text-zinc-500 text-sm">
                                                No documents attached to this ticket.
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>
                            </div>
                        </ScrollArea>

                        {/* Sticky Action Footer */}
                        <div className="border-t border-zinc-200 bg-white p-4 shadow-[0_-4px_15px_-3px_rgba(0,0,0,0.05)] z-20 shrink-0">
                            <div className="max-w-4xl mx-auto flex flex-col sm:flex-row gap-4 items-end">
                                <div className="flex-1 w-full relative">
                                    <Textarea 
                                        rows={2}
                                        placeholder="Enter Maker Notes or findings here before escalation..."
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        className="resize-none bg-zinc-50 focus-visible:ring-zinc-400 w-full"
                                    />
                                </div>
                                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                                    <Button variant="destructive" onClick={handleReject} className="flex-1 sm:flex-none whitespace-nowrap">
                                        <XCircle className="mr-2 h-4 w-4" /> Reject
                                    </Button>
                                    <Button onClick={handleEscalate} className="w-full sm:w-auto bg-zinc-900 hover:bg-zinc-800 text-white whitespace-nowrap">
                                        Escalate to L2
                                        <ChevronRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white h-full">
                        <div className="h-16 w-16 bg-zinc-50 rounded-full flex items-center justify-center mb-4 border border-zinc-100">
                            <Cpu className="h-8 w-8 text-zinc-300" />
                        </div>
                        <h3 className="text-xl font-semibold text-zinc-900">No Ticket Selected</h3>
                        <p className="text-sm text-zinc-500 mt-2 max-w-md">Select a ticket from the queue to open the Maker Workspace and begin processing.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default L1MakerDesk;
