import React, { useEffect, useState } from 'react';
import apiClient from '../api/client';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, XCircle, CheckCircle, Cpu, AlertTriangle, Activity, ChevronDown, FileText, User, Hash } from 'lucide-react';
import { getServiceType } from '../config/serviceTypes';

// Shared UI Components for AI Insights
const Badge = ({ priority }) => {
    const isCritical = priority === 'CRITICAL';
    return (
        <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-widest shadow-sm flex items-center gap-1 ${
            isCritical ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
        }`}>
            {isCritical && <AlertTriangle className="w-3 h-3" />}
            {priority || 'NORMAL'}
        </span>
    );
};

const ServiceTypeBadge = ({ serviceType }) => {
    const config = getServiceType(serviceType || 'COMPLAINT');
    const Icon = config.icon;
    return (
        <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-widest shadow-sm border flex items-center gap-1 ${config.colorClasses.badge}`}>
            <Icon className="w-3 h-3" />
            {config.label}
        </span>
    );
};
const stripPrefix = (text) => (text || '').replace(/^\[[A-Z_]+\]\s*/, '');

const SentimentBar = ({ score }) => {
    const percentage = Math.min(Math.max((score || 0) * 100, 0), 100);
    const isHighFrustration = percentage > 70;
    
    return (
        <div className="mt-4">
            <div className="flex justify-between text-xs mb-2 font-bold text-gray-400 uppercase tracking-wider items-center">
                <span className="flex items-center gap-1"><Activity className="w-4 h-4" /> Customer Dissatisfaction Index</span>
                <span className={isHighFrustration ? 'text-red-400 font-mono text-sm' : 'text-emerald-400 font-mono text-sm'}>{percentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-kfintech-bg/80 rounded-full h-3 overflow-hidden shadow-inner border border-kfintech-border/50">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-full rounded-full shadow-[0_0_10px_currentColor] ${isHighFrustration ? 'bg-red-500 text-red-500' : 'bg-emerald-500 text-emerald-500'}`} 
                />
            </div>
        </div>
    );
};

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
        return <span className={diffMins < 15 ? "text-orange-400 font-bold bg-orange-400/10 px-2 py-0.5 rounded border border-orange-400/30" : "text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/30"}>{diffMins}m remaining</span>;
    }
    
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return <span className="text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/30">{hours}h {mins}m remaining</span>;
};


const L2CheckerDesk = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedId, setExpandedId] = useState(null);
    const [pendingReturn, setPendingReturn] = useState({ id: null, note: '' });

    const toggleExpanded = (id) => setExpandedId(prev => prev === id ? null : id);

    const handleReturnToL1 = (ticketId) => {
        setPendingReturn({ id: ticketId, note: '' });
    };

    useEffect(() => {
        const fetchL2Queue = async () => {
            try {
                const response = await apiClient.get('/dashboard/l2-queue');
                let fetchedTickets = response.data.data || [];
                
                // Sort by Priority (CRITICAL > HIGH > NORMAL) and then by Oldest First
                const priorityWeight = { 'CRITICAL': 3, 'HIGH': 2, 'NORMAL': 1 };
                fetchedTickets.sort((a, b) => {
                    const weightA = priorityWeight[a.assignedPriority || 'NORMAL'] || 1;
                    const weightB = priorityWeight[b.assignedPriority || 'NORMAL'] || 1;
                    if (weightA !== weightB) return weightB - weightA;
                    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                });
                
                setTickets(fetchedTickets);
                setError(null);
            } catch (err) {
                console.error("Error fetching L2 queue:", err);
                setError("Failed to load L2 Checker Queue. Ensure the backend is active.");
            } finally {
                setLoading(false);
            }
        };

        fetchL2Queue();
    }, []);

    const handleAction = async (ticketId, action, notes = '') => {
        try {
            await apiClient.post('/l2/finalize', { ticketId, action, notes });
            setTickets(current => current.filter(t => t._id !== ticketId));
            setPendingReturn({ id: null, note: '' });
        } catch (err) {
            alert(`Failed to execute ${action}. ${err.response?.data?.message || err.message}`);
        }
    };

    if (loading) {
        return (
            <div className="p-8 flex justify-center items-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-14 w-14 border-t-4 border-b-4 border-kfintech-primary shadow-[0_0_20px_rgba(59,130,246,0.6)]"></div>
            </div>
        );
    }

    if (error) {
        return (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="p-8">
                <div className="bg-red-500/10 border-l-4 border-red-500 p-6 text-red-400 rounded-lg shadow-lg glass-panel">
                    <p className="font-extrabold text-lg mb-1 flex items-center gap-2"><AlertTriangle /> System Architecture Error</p>
                    <p className="font-medium text-red-300">{error}</p>
                </div>
            </motion.div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <motion.header 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-10 pb-4 flex justify-between items-end border-b border-kfintech-border/50"
            >
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
                        <ShieldCheck className="w-10 h-10 text-kfintech-accent drop-shadow-[0_0_15px_rgba(249,115,22,0.5)]" />
                        L2 Checker Desk
                    </h1>
                    <p className="text-gray-400 mt-2 text-lg font-medium">Finalize pre-verified tickets. AI context is generated for rapid decision making.</p>
                </div>
                <div className="text-sm font-bold text-gray-400 uppercase tracking-widest bg-kfintech-card/50 px-5 py-2 rounded-lg border border-kfintech-border shadow-inner">
                    Total Queue: <span className="text-white font-mono text-lg ml-2">{tickets.length}</span>
                </div>
            </motion.header>

            {tickets.length === 0 ? (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-panel p-16 text-center rounded-3xl shadow-2xl border border-kfintech-border/50 max-w-2xl mx-auto mt-20"
                >
                    <CheckCircle className="mx-auto h-20 w-20 text-emerald-500 mb-6 drop-shadow-[0_0_20px_rgba(16,185,129,0.5)]" />
                    <h3 className="text-3xl font-bold text-white mb-3">Inbox Zero Achieved</h3>
                    <p className="text-gray-400 text-lg">All high-priority tickets have been cleared by the L2 desk.</p>
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    <AnimatePresence>
                        {tickets.map((ticket, index) => (
                            <motion.div 
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                                transition={{ delay: index * 0.1 }}
                                key={ticket._id} 
                                className="glass-panel rounded-2xl shadow-xl overflow-hidden border border-kfintech-border flex flex-col hover:border-kfintech-primary/50 transition-colors group"
                            >
                                <div className="bg-kfintech-bg/50 px-6 py-5 border-b border-kfintech-border/50 flex justify-between items-center group-hover:bg-kfintech-bg transition-colors">
                                    <div>
                                        <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">Ticket Reference</span>
                                        <div className="font-mono text-sm text-gray-300 font-semibold mt-1">#{ticket._id}</div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <div className="flex gap-2 flex-wrap justify-end">
                                            {ticket.isPotentialFraud && (
                                                <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-widest shadow-sm flex items-center gap-1 bg-orange-500/20 text-orange-400 border border-orange-500/50 animate-pulse">
                                                    <AlertTriangle className="w-3 h-3" /> POTENTIAL FRAUD
                                                </span>
                                            )}
                                            <ServiceTypeBadge serviceType={ticket.serviceType} />
                                            <Badge priority={ticket.assignedPriority} />
                                        </div>
                                        <div className="text-xs font-mono font-bold tracking-tight">
                                            SLA: {calculateSLA(ticket.createdAt, ticket.assignedPriority)}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 flex-grow">
                                    <div className="mb-6">
                                        <h4 className="text-xs font-bold uppercase text-gray-500 tracking-widest mb-3">
                                            Request Description
                                        </h4>
                                        <p className="text-gray-200 text-md bg-kfintech-bg/50 p-5 rounded-xl border border-kfintech-border leading-relaxed font-medium italic shadow-inner">
                                            "{stripPrefix(ticket.complaintText)}"
                                        </p>
                                        {/* Service Metadata Summary — shows type-specific submitted fields */}
                                        {ticket.serviceMetadata && Object.keys(ticket.serviceMetadata).length > 0 && (() => {
                                            const stConfig = getServiceType(ticket.serviceType);
                                            return (
                                                <div className={`mt-3 p-4 rounded-xl border ${stConfig.colorClasses.card} ${stConfig.colorClasses.activeBorder}`}>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {Object.entries(ticket.serviceMetadata).map(([k, v]) => {
                                                            const fieldDef = stConfig.requiredFields.find(f => f.name === k);
                                                            return (
                                                                <div key={k} className="bg-kfintech-bg/60 p-2.5 rounded-lg border border-kfintech-border">
                                                                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">{fieldDef?.label || k}</p>
                                                                    <p className="text-xs text-white font-medium">{v || '—'}</p>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>

                                    <div className="bg-kfintech-primary/5 rounded-xl p-6 border border-kfintech-primary/20 shadow-inner relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-kfintech-primary shadow-[0_0_15px_rgba(59,130,246,0.8)]"></div>
                                        
                                        <div className="flex items-center gap-2 mb-5">
                                            <Cpu className="w-6 h-6 text-kfintech-primary drop-shadow-[0_0_10px_rgba(59,130,246,0.6)]" />
                                            <h4 className="font-extrabold text-white text-lg tracking-tight">AI Microservice Insight Summary</h4>
                                        </div>
                                        
                                        <ul className="space-y-3 mb-6">
                                            {ticket.aiSummary && ticket.aiSummary.length > 0 ? (
                                                ticket.aiSummary.map((point, idx) => (
                                                    <li key={idx} className="flex gap-3 text-sm text-gray-300 font-medium">
                                                        <span className="text-kfintech-primary font-bold mt-0.5">•</span>
                                                        <span className="leading-snug">{point}</span>
                                                    </li>
                                                ))
                                            ) : (
                                                <li className="flex gap-3 text-sm text-gray-300 font-medium text-center italic w-full opacity-50">
                                                    No AI Summary generated.
                                                </li>
                                            )}
                                        </ul>
                                        
                                        <SentimentBar score={ticket.aiSentimentScore} />
                                    </div>
                                </div>
                                <AnimatePresence>
                                    {expandedId === ticket._id && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                                            className="overflow-hidden border-t border-kfintech-border/50"
                                        >
                                            <div className="p-6 space-y-4 bg-kfintech-bg/30">
                                                <p className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                                                    <FileText className="w-3.5 h-3.5" /> Full Request — L1 View
                                                </p>

                                                {/* Investor identity grid */}
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="bg-kfintech-bg/60 p-4 rounded-xl border border-kfintech-border shadow-inner">
                                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                                                            <User className="w-3 h-3" /> Investor Name
                                                        </p>
                                                        <p className="text-white font-semibold text-sm">{ticket.investorName || 'Unknown'}</p>
                                                    </div>
                                                    <div className="bg-kfintech-bg/60 p-4 rounded-xl border border-kfintech-border shadow-inner">
                                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                                                            <Hash className="w-3 h-3" /> Account Number
                                                        </p>
                                                        <p className="text-white font-mono font-semibold text-sm">{ticket.accountNumber || 'Not Provided'}</p>
                                                    </div>
                                                </div>

                                                {/* Document */}
                                                <div className={`flex items-center gap-3 p-4 rounded-xl border ${
                                                    ticket.documentName
                                                        ? 'bg-kfintech-primary/5 border-kfintech-primary/20'
                                                        : 'bg-kfintech-bg/40 border-kfintech-border/40'
                                                }`}>
                                                    <FileText className={`w-5 h-5 shrink-0 ${
                                                        ticket.documentName ? 'text-kfintech-primary' : 'text-gray-600'
                                                    }`} />
                                                    <div>
                                                        <p className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest">Attached Document</p>
                                                        <p className={`text-sm font-medium ${
                                                            ticket.documentName ? 'text-blue-300' : 'text-gray-600'
                                                        }`}>
                                                            {ticket.documentName || 'No document attached'}
                                                        </p>
                                                        {ticket.documentName && (
                                                            <p className="text-[10px] text-gray-500 mt-0.5">AES-256 Encrypted · OCR verified by L1</p>
                                                        )}
                                                    </div>
                                                    {ticket.ocrMatchVerified !== undefined && (
                                                        <span className={`ml-auto text-[10px] font-extrabold uppercase tracking-widest px-2 py-1 rounded border ${
                                                            ticket.ocrMatchVerified
                                                                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                                                                : 'text-red-400 bg-red-500/10 border-red-500/30'
                                                        }`}>
                                                            {ticket.ocrMatchVerified ? 'OCR Verified' : 'OCR Failed'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Return-to-L1 Note Panel */}
                                <AnimatePresence>
                                    {pendingReturn.id === ticket._id && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.22, ease: 'easeInOut' }}
                                            className="overflow-hidden border-t border-amber-500/30"
                                        >
                                            <div className="p-5 bg-amber-500/5 space-y-3">
                                                <p className="text-xs font-extrabold text-amber-400 uppercase tracking-widest flex items-center gap-2">
                                                    <XCircle className="w-3.5 h-3.5" />
                                                    Reason for Returning to L1
                                                </p>
                                                <textarea
                                                    rows={3}
                                                    autoFocus
                                                    placeholder="Describe what L1 needs to fix or clarify before this can be approved..."
                                                    value={pendingReturn.note}
                                                    onChange={e => setPendingReturn(prev => ({ ...prev, note: e.target.value }))}
                                                    className="w-full bg-kfintech-bg border border-amber-500/30 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/50 outline-none transition-all shadow-inner resize-none"
                                                />
                                                <div className="flex justify-end gap-3">
                                                    <button
                                                        onClick={() => setPendingReturn({ id: null, note: '' })}
                                                        className="px-5 py-2.5 text-xs font-bold text-gray-400 hover:text-white uppercase tracking-wider transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <motion.button
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={() => handleAction(ticket._id, 'RETURN_TO_L1', pendingReturn.note)}
                                                        className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 text-white rounded-xl font-extrabold text-xs uppercase tracking-wider shadow-[0_0_12px_rgba(245,158,11,0.4)] hover:bg-amber-400 transition-all"
                                                    >
                                                        <XCircle className="w-3.5 h-3.5" /> Confirm Return to L1
                                                    </motion.button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="px-6 py-5 bg-kfintech-bg/50 border-t border-kfintech-border/50 flex justify-between items-center gap-3 group-hover:bg-kfintech-bg transition-colors">
                                    {/* View Full Request toggle */}
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => toggleExpanded(ticket._id)}
                                        className="flex items-center gap-2 px-4 py-2.5 border border-kfintech-border text-gray-400 bg-kfintech-bg/60 rounded-xl hover:border-kfintech-primary/40 hover:text-kfintech-primary font-bold transition-all text-xs uppercase tracking-wider"
                                    >
                                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${expandedId === ticket._id ? 'rotate-180' : ''}`} />
                                        {expandedId === ticket._id ? 'Collapse' : 'View Full Request'}
                                    </motion.button>

                                    {/* Action buttons */}
                                    <div className="flex gap-3">
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => handleReturnToL1(ticket._id)}
                                            className="flex items-center gap-2 px-5 py-3 border border-amber-500/30 text-amber-400 bg-amber-500/5 rounded-xl hover:bg-amber-500/15 hover:border-amber-500/50 hover:shadow-[0_0_12px_rgba(245,158,11,0.25)] font-bold transition-all text-sm uppercase tracking-wider"
                                        >
                                            <XCircle className="w-4 h-4" /> Return to L1
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => handleAction(ticket._id, 'REJECT')}
                                            className="flex items-center gap-2 px-5 py-3 border border-red-500/30 text-red-400 bg-red-500/5 rounded-xl hover:bg-red-500/20 hover:border-red-500/50 hover:shadow-[0_0_12px_rgba(239,68,68,0.3)] font-bold transition-all text-sm uppercase tracking-wider"
                                        >
                                            <ShieldCheck className="w-4 h-4 rotate-180" /> Reject Request
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => handleAction(ticket._id, 'APPROVE')}
                                            className="flex items-center gap-2 px-8 py-3 bg-kfintech-primary text-white rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.4)] hover:bg-blue-500 hover:shadow-[0_0_25px_rgba(59,130,246,0.7)] font-bold transition-all text-sm uppercase tracking-wider"
                                        >
                                            <CheckCircle className="w-4 h-4" /> Approve & Resolve
                                        </motion.button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};

export default L2CheckerDesk;
