import React, { useEffect, useState } from 'react';
import apiClient from '../api/client';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Clock, ShieldAlert, Cpu, CheckCircle2, ChevronRight, FileText, XCircle, AlertTriangle, Sparkles } from 'lucide-react';
import { getServiceType } from '../config/serviceTypes';

const PriorityBadge = ({ priority }) => (
    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider shadow-sm ${
        priority === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
    }`}>
        {priority || 'NORMAL'}
    </span>
);

const ServiceTypeBadge = ({ serviceType }) => {
    const config = getServiceType(serviceType || 'COMPLAINT');
    const Icon = config.icon;
    return (
        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider shadow-sm border flex items-center gap-1 ${config.colorClasses.badge}`}>
            <Icon className="w-3 h-3" />
            {config.label}
        </span>
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
    
    // Filtering State
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [filterPriority, setFilterPriority] = useState('ALL');
    const [filterAssigned, setFilterAssigned] = useState('ALL');
    const [filterAge, setFilterAge] = useState('NEWEST');
    const [filterSearch, setFilterSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        const fetchQueue = async () => {
            setLoading(true);
            try {
                const response = await apiClient.get('/l1/tickets', {
                    params: {
                        status: filterStatus,
                        priority: filterPriority,
                        assigned: filterAssigned,
                        age: filterAge,
                        search: filterSearch,
                        page
                    }
                });
                setQueue(response.data.tickets || []);
                setTotalPages(response.data.pagination?.pages || 1);
            } catch (error) {
                console.error("Queue Fetch Error:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchQueue();
    }, [filterStatus, filterPriority, filterAssigned, filterAge, filterSearch, page]);

    const calculateSLA = (dateString, priority) => {
        if (!dateString) return <span className="text-gray-400">N/A</span>;
        
        let slaHours = 24;
        if (priority === 'CRITICAL') slaHours = 2;
        else if (priority === 'HIGH') slaHours = 4;
        
        const createdTime = new Date(dateString).getTime();
        const deadline = createdTime + (slaHours * 60 * 60 * 1000);
        const now = new Date().getTime();
        const diffMs = deadline - now;
        
        if (diffMs <= 0) {
            return <span className="text-red-500 font-black animate-pulse">SLA BREACHED</span>;
        }
        
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 60) {
            return <span className={diffMins < 15 ? "text-orange-400 font-bold" : "text-emerald-400"}>{diffMins}m remaining</span>;
        }
        
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        return <span className="text-emerald-400">{hours}h {mins}m remaining</span>;
    };

    const handleVerifyDoc = async (docId, currentStatus) => {
        try {
            const newStatus = currentStatus === 'VERIFIED' ? false : true;
            const res = await apiClient.post(`/l1/tickets/${selectedTicket._id}/verify-document/${docId}`, { verified: newStatus });
            setSelectedTicket(prev => ({ ...prev, documents: res.data.documents }));
        } catch (error) {
            alert(`Verification failed: ${error.response?.data?.message || error.message}`);
        }
    };

    const handleRunOcr = async (docId) => {
        try {
            setRunningOcr(docId);
            const res = await apiClient.post(`/tickets/${selectedTicket._id}/documents/${docId}/ocr`);
            
            // Update the local state with the new document data
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

    const handleHold = async () => {
        if (!selectedTicket) return;
        if (!notes) { alert("Please provide a reason to hold this ticket."); return; }
        try {
            await apiClient.post(`/l1/tickets/${selectedTicket._id}/hold`, { reason: notes });
            setQueue(q => q.filter(t => t._id !== selectedTicket._id));
            setSelectedTicket(null);
            setNotes('');
        } catch (error) {
            alert(`Hold failed: ${error.response?.data?.message || error.message}`);
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
        { name: 'Critical', value: criticalCount, color: '#EF4444' },
        { name: 'Normal', value: normalCount, color: '#3B82F6' }
    ];

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kfintech-primary shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-80px)] overflow-hidden bg-kfintech-bg text-white">
            {/* Sidebar: L1 Queue */}
            <aside className="w-1/3 glass-panel flex flex-col h-full z-10 border-r border-kfintech-border/50">
                <div className="p-6 border-b border-kfintech-border/50 bg-kfintech-card/50">
                    <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-kfintech-accent" />
                        L1 Maker Queue
                    </h2>
                    
                    {/* Live Analytics Chart */}
                    {queue.length > 0 && (
                        <div className="h-24 mt-4 flex items-center justify-between bg-kfintech-bg/50 rounded-lg border border-kfintech-border p-2 shadow-inner">
                            <div className="w-1/2 h-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={chartData} innerRadius={25} outerRadius={35} paddingAngle={5} dataKey="value" stroke="none">
                                            {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: '#131B2F', border: '1px solid #1E293B', borderRadius: '8px' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="w-1/2 flex flex-col justify-center gap-1">
                                <div className="text-xs font-mono font-bold text-red-400 flex justify-between"><span>CRITICAL:</span> <span>{criticalCount}</span></div>
                                <div className="text-xs font-mono font-bold text-blue-400 flex justify-between"><span>NORMAL:</span> <span>{normalCount}</span></div>
                            </div>
                        </div>
                    )}
                    {/* Filters Section */}
                    <div className="mt-4 flex flex-col gap-2">
                        <input 
                            type="text" placeholder="Search..." value={filterSearch} onChange={e => setFilterSearch(e.target.value)}
                            className="bg-kfintech-bg border border-kfintech-border rounded px-3 py-1.5 text-xs text-white"
                        />
                        <div className="grid grid-cols-2 gap-2">
                            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-kfintech-bg border border-kfintech-border rounded px-2 py-1 text-[10px] text-white">
                                <option value="ALL">All Status</option>
                                <option value="OPEN">Open</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="L1_REVIEW">L1 Review</option>
                                <option value="ON_HOLD">On Hold</option>
                            </select>
                            <select value={filterAssigned} onChange={e => setFilterAssigned(e.target.value)} className="bg-kfintech-bg border border-kfintech-border rounded px-2 py-1 text-[10px] text-white">
                                <option value="ALL">All Assigned</option>
                                <option value="ME">Assigned to Me</option>
                                <option value="UNASSIGNED">Unassigned</option>
                            </select>
                            <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="bg-kfintech-bg border border-kfintech-border rounded px-2 py-1 text-[10px] text-white">
                                <option value="ALL">All Priorities</option>
                                <option value="CRITICAL">Critical</option>
                                <option value="HIGH">High</option>
                                <option value="NORMAL">Normal</option>
                            </select>
                            <select value={filterAge} onChange={e => setFilterAge(e.target.value)} className="bg-kfintech-bg border border-kfintech-border rounded px-2 py-1 text-[10px] text-white">
                                <option value="NEWEST">Newest First</option>
                                <option value="OLDEST">Oldest First</option>
                            </select>
                        </div>
                    </div>
                </div>
                
                <div className="overflow-y-auto flex-grow p-4 space-y-3 custom-scrollbar">
                    <AnimatePresence>
                        {queue.length === 0 ? (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center p-8 text-gray-500 font-medium">
                                Queue is empty
                            </motion.div>
                        ) : (
                            queue.map((ticket, i) => (
                                <motion.div 
                                    layout
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ delay: i * 0.05 }}
                                    key={ticket._id} 
                                    onClick={() => { setSelectedTicket(ticket); setOcrResult(null); setNotes(''); }}
                                    className={`p-4 rounded-xl cursor-pointer border transition-all relative overflow-hidden group ${
                                        selectedTicket?._id === ticket._id 
                                            ? 'bg-kfintech-primary/10 border-kfintech-primary shadow-[0_0_15px_rgba(59,130,246,0.15)]' 
                                            : 'bg-kfintech-card border-kfintech-border hover:border-kfintech-primary/50 hover:bg-kfintech-card/80'
                                    }`}
                                >
                                    {selectedTicket?._id === ticket._id && (
                                        <motion.div layoutId="queue-active" className="absolute left-0 top-0 bottom-0 w-1 bg-kfintech-primary shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                                    )}
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-mono text-xs text-gray-400 font-semibold">#{ticket._id.substring(18)}</span>
                                        <div className="flex gap-2 flex-wrap justify-end">
                                            {ticket.isPotentialFraud && (
                                                <span className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider shadow-sm bg-orange-500/20 text-orange-400 border border-orange-500/50 animate-pulse">
                                                    ⚠️ FRAUD
                                                </span>
                                            )}
                                            <ServiceTypeBadge serviceType={ticket.serviceType} />
                                            <PriorityBadge priority={ticket.assignedPriority} />
                                        </div>
                                    </div>
                                    <p className="text-sm font-medium text-gray-200 line-clamp-2 leading-snug group-hover:text-white transition-colors">{stripPrefix(ticket.description || ticket.title)}</p>
                                    <div className="mt-3 flex justify-between items-center text-xs text-gray-500 font-semibold">
                                        <span className="uppercase text-kfintech-accent tracking-wider">{ticket.status}</span>
                                        <span className="flex items-center gap-1 bg-kfintech-bg px-2 py-1 rounded">
                                            <Clock className="w-3 h-3" />
                                            {calculateSLA(ticket.createdAt, ticket.assignedPriority)}
                                        </span>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-between items-center px-4 py-2 bg-kfintech-card rounded-xl border border-kfintech-border mt-2">
                            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="text-[10px] text-gray-400 disabled:opacity-30">PREV</button>
                            <span className="text-[10px] text-white font-bold">{page} / {totalPages}</span>
                            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="text-[10px] text-gray-400 disabled:opacity-30">NEXT</button>
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Workspace */}
            <main className="w-2/3 flex flex-col h-full bg-kfintech-bg relative">
                {selectedTicket ? (
                    <motion.div 
                        key={selectedTicket._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col h-full"
                    >
                        <div className="p-8 flex-grow overflow-y-auto custom-scrollbar">
                            
                            <div className="glass-panel p-6 rounded-2xl mb-6 shadow-lg border border-kfintech-border">
                                <div className="flex justify-between items-center mb-6 pb-4 border-b border-kfintech-border/50">
                                    <h3 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-3">
                                        Ticket Processing Workspace
                                    </h3>
                                    <div className="flex gap-3 items-center flex-wrap justify-end">
                                        {selectedTicket.isPotentialFraud && (
                                            <span className="text-sm font-mono bg-orange-500/20 border border-orange-500/50 px-3 py-1 rounded text-orange-400 font-bold shadow-inner animate-pulse">
                                                ⚠️ POTENTIAL FRAUD DETECTED
                                            </span>
                                        )}
                                        <ServiceTypeBadge serviceType={selectedTicket.serviceType} />
                                        <PriorityBadge priority={selectedTicket.assignedPriority} />
                                        <span className="text-sm font-mono bg-kfintech-primary/10 border border-kfintech-primary/30 px-3 py-1 rounded text-blue-300 font-bold shadow-inner">
                                            ID: {selectedTicket._id}
                                        </span>
                                    </div>
                                </div>
                                
                                {/* L2 Return Note Banner */}
                                {selectedTicket.l2ReturnNote && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.1)]"
                                    >
                                        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-xs font-extrabold text-amber-400 uppercase tracking-widest mb-1">Returned by L2 Checker</p>
                                            <p className="text-sm text-amber-200 leading-relaxed">{selectedTicket.l2ReturnNote}</p>
                                        </div>
                                    </motion.div>
                                )}

                                <div className="mb-6 grid grid-cols-2 gap-4">
                                    <div className="bg-kfintech-bg/50 p-4 rounded-xl border border-kfintech-border shadow-inner">
                                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Investor Name</h4>
                                        <p className="text-white font-medium">{selectedTicket.investorName || 'Unknown Investor'}</p>
                                    </div>
                                    <div className="bg-kfintech-bg/50 p-4 rounded-xl border border-kfintech-border shadow-inner">
                                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Account Number</h4>
                                        <p className="text-white font-mono">{selectedTicket.accountNumber || 'Not Provided'}</p>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <FileText className="w-4 h-4" />
                                        Request Description
                                    </h4>
                                    <p className="text-gray-300 text-md font-medium bg-kfintech-bg/50 p-5 rounded-xl border border-kfintech-border leading-relaxed shadow-inner">
                                        {stripPrefix(selectedTicket.description || selectedTicket.title)}
                                    </p>
                                    {/* Service Metadata Panel */}
                                    {selectedTicket.serviceMetadata && Object.keys(selectedTicket.serviceMetadata).length > 0 && (() => {
                                        const stConfig = getServiceType(selectedTicket.serviceType);
                                        return (
                                            <div className={`mt-4 p-4 rounded-xl border-2 ${stConfig.colorClasses.card} ${stConfig.colorClasses.activeBorder}`}>
                                                <h5 className={`text-xs font-extrabold uppercase tracking-widest mb-3 ${stConfig.colorClasses.icon}`}>
                                                    {stConfig.label} — Submitted Details
                                                </h5>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {Object.entries(selectedTicket.serviceMetadata).map(([k, v]) => {
                                                        const fieldDef = stConfig.requiredFields.find(f => f.name === k);
                                                        return (
                                                            <div key={k} className="bg-kfintech-bg/60 p-3 rounded-lg border border-kfintech-border">
                                                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{fieldDef?.label || k}</p>
                                                                <p className="text-sm text-white font-medium">{v || '—'}</p>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                    
                                    {/* AI Summary Section */}
                                    <div className="mt-4 p-4 bg-kfintech-primary/10 rounded-xl border border-kfintech-primary/30 shadow-[0_0_15px_rgba(59,130,246,0.05)] relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-kfintech-primary"></div>
                                        <div className="flex justify-between items-center mb-3">
                                            <h4 className="text-xs font-bold text-kfintech-primary uppercase tracking-widest flex items-center gap-2">
                                                <Sparkles className="w-4 h-4" /> AI Ticket Summary
                                            </h4>
                                            {(!selectedTicket.aiSummary || selectedTicket.aiSummary.length === 0 || selectedTicket.aiSummary[0] === 'Pending AI Triage') && (
                                                <button 
                                                    onClick={handleSummarize}
                                                    disabled={loadingSummary}
                                                    className="px-3 py-1 bg-kfintech-primary/20 hover:bg-kfintech-primary/40 text-kfintech-primary text-xs font-bold uppercase rounded border border-kfintech-primary/50 transition-colors disabled:opacity-50 flex items-center gap-1"
                                                >
                                                    {loadingSummary ? <Cpu className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                                    {loadingSummary ? 'Generating...' : 'Generate Summary'}
                                                </button>
                                            )}
                                        </div>
                                        
                                        {selectedTicket.aiSummary && selectedTicket.aiSummary.length > 0 && selectedTicket.aiSummary[0] !== 'Pending AI Triage' ? (
                                            <ul className="list-disc pl-5 space-y-1 text-sm text-gray-200">
                                                {selectedTicket.aiSummary.map((bullet, idx) => (
                                                    <li key={idx} className="font-medium">{bullet}</li>
                                                ))}
                                            </ul>
                                        ) : (
                                            !loadingSummary && <p className="text-sm text-gray-400 italic">No summary generated yet.</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Multiple Documents Rendering */}
                            {selectedTicket.documents && selectedTicket.documents.length > 0 ? (
                                <div className="space-y-6 mb-6">
                                    {selectedTicket.documents.map((doc, idx) => (
                                        <div key={doc._id || idx} className="glass-panel p-6 rounded-2xl shadow-lg border border-kfintech-border">
                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex justify-between items-center">
                                                <span className="flex items-center gap-2"><Cpu className="w-4 h-4" /> Document {idx + 1}: {doc.name}</span>
                                                <button onClick={() => handleVerifyDoc(doc._id, doc.status)} className={`px-4 py-1.5 rounded text-xs font-bold uppercase transition-colors flex items-center gap-2 ${doc.status === 'VERIFIED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' : 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600'}`}>
                                                    {doc.status === 'VERIFIED' ? <><CheckCircle2 className="w-4 h-4"/> Verified</> : 'Mark as Verified'}
                                                </button>
                                            </h4>
                                            
                                            <div className="flex gap-6">
                                                <div className="w-1/2 bg-kfintech-bg/50 rounded-xl border border-kfintech-border flex flex-col items-center justify-center p-8 relative overflow-hidden min-h-[300px] shadow-inner group">
                                                    <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none transform -rotate-45">
                                                        <span className="text-4xl font-black tracking-widest text-white">CONFIDENTIAL</span>
                                                    </div>
                                                    <div className="text-center relative z-10 group-hover:scale-105 transition-transform mb-4">
                                                        <FileText className="w-16 h-16 text-gray-500 mx-auto mb-3" />
                                                        <p className="text-sm font-bold text-blue-300">{doc.name}</p>
                                                        <p className="text-xs text-gray-500 mt-1">AES-256 Encrypted</p>
                                                    </div>
                                                    {doc.s3Key && (
                                                        <button 
                                                            className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/50 rounded flex items-center gap-2 text-xs font-bold uppercase transition-colors"
                                                            onClick={() => window.open(doc.s3Key, '_blank')}
                                                        >
                                                            View Document <ChevronRight className="w-3 h-3" />
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="w-1/2 flex flex-col">
                                                    <div className="bg-kfintech-primary/5 p-6 rounded-xl border border-kfintech-primary/20 flex-grow shadow-inner">
                                                        <h5 className="font-extrabold text-blue-400 mb-3 flex items-center gap-2 text-lg">
                                                            <Cpu className="w-5 h-5" /> AI Extraction Result
                                                        </h5>
                                                        
                                                        {doc.ocrExtraction?.extractedText ? (
                                                            <div className={`mt-2 p-5 rounded-xl border shadow-inner ${doc.ocrExtraction.matchVerified ? 'bg-kfintech-accent/10 border-kfintech-accent/30' : 'bg-red-500/10 border-red-500/30'}`}>
                                                                <div className={`flex items-center gap-2 font-bold mb-3 text-sm uppercase tracking-wider ${doc.ocrExtraction.matchVerified ? 'text-emerald-400' : 'text-red-400'}`}>
                                                                    {doc.ocrExtraction.matchVerified ? <><CheckCircle2 className="w-5 h-5" /> CRM Match Verified</> : <><ShieldAlert className="w-5 h-5" /> Verification Failed</>}
                                                                </div>
                                                                <pre className="text-xs bg-kfintech-bg/80 p-3 rounded-lg text-gray-300 font-mono border border-kfintech-border shadow-inner leading-relaxed whitespace-pre-wrap max-h-[150px] overflow-y-auto custom-scrollbar">
                                                                    {doc.ocrExtraction.extractedText || "No text extracted."}
                                                                </pre>
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col items-center justify-center p-6 bg-kfintech-bg/50 rounded-xl border border-kfintech-border shadow-inner mt-2 h-[150px]">
                                                                <p className="text-sm text-gray-400 font-medium mb-4">OCR extraction pending.</p>
                                                                <button 
                                                                    onClick={() => handleRunOcr(doc._id)}
                                                                    disabled={runningOcr === doc._id}
                                                                    className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                                                                    {runningOcr === doc._id ? (
                                                                        <><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing OCR...</>
                                                                    ) : (
                                                                        <><Cpu className="w-4 h-4" /> Run OCR Verification</>
                                                                    )}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="glass-panel p-6 rounded-2xl mb-6 shadow-lg border border-kfintech-border text-center text-gray-500 font-medium">
                                    No documents attached to this ticket.
                                </div>
                            )}
                        </div>

                        {/* Sticky Action Footer */}
                        <div className="glass-panel border-t-0 border-b-0 border-x-0 border-t-kfintech-primary/30 p-6 flex flex-col gap-4 z-20 bg-kfintech-card/90">
                            <textarea 
                                rows="2" 
                                placeholder="Enter Maker Notes or findings here before escalation..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full bg-kfintech-bg border border-kfintech-border rounded-xl p-4 text-sm text-white focus:ring-2 focus:ring-kfintech-primary/50 focus:border-kfintech-primary outline-none transition-colors shadow-inner resize-none"
                            />
                            <div className="flex justify-end gap-3">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleHold}
                                    className="flex items-center gap-2 px-6 py-3 border border-orange-500/40 text-orange-400 bg-orange-500/5 rounded-xl hover:bg-orange-500/15 font-bold transition-all text-sm uppercase tracking-wider"
                                >
                                    <AlertTriangle className="w-4 h-4" /> Hold Ticket
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleReject}
                                    className="flex items-center gap-2 px-6 py-3 border border-red-500/40 text-red-400 bg-red-500/5 rounded-xl hover:bg-red-500/15 hover:border-red-500/60 hover:shadow-[0_0_12px_rgba(239,68,68,0.25)] font-bold transition-all text-sm uppercase tracking-wider"
                                >
                                    <XCircle className="w-4 h-4" /> Reject Request
                                </motion.button>
                                <motion.button 
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleEscalate}
                                    className="px-8 py-3 bg-kfintech-accent text-white text-sm font-bold rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.4)] hover:bg-emerald-400 hover:shadow-[0_0_25px_rgba(16,185,129,0.6)] transition-all uppercase tracking-wider flex items-center gap-2"
                                >
                                    Escalate to L2 Checker
                                    <ChevronRight className="w-4 h-4" />
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <div className="flex-grow flex flex-col items-center justify-center text-gray-600">
                        <Cpu className="w-24 h-24 mb-6 opacity-20" />
                        <h3 className="text-2xl font-bold text-gray-400 tracking-tight">No Ticket Selected</h3>
                        <p className="text-sm font-medium mt-2 text-gray-500">Select a ticket from the queue to open the Maker Workspace.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default L1MakerDesk;
