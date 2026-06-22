import React, { useEffect, useState } from 'react';
import apiClient from '../api/client';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, XCircle, CheckCircle, Cpu, AlertTriangle, Activity } from 'lucide-react';

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

const SentimentBar = ({ score }) => {
    const percentage = Math.min(Math.max((score || 0) * 100, 0), 100);
    const isHighFrustration = percentage > 70;
    
    return (
        <div className="mt-4">
            <div className="flex justify-between text-xs mb-2 font-bold text-gray-400 uppercase tracking-wider items-center">
                <span className="flex items-center gap-1"><Activity className="w-4 h-4" /> AI Frustration Index</span>
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

    const handleAction = async (ticketId, action) => {
        try {
            await apiClient.post('/l2/finalize', { ticketId, action });
            setTickets(current => current.filter(t => t._id !== ticketId));
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
                                        <Badge priority={ticket.assignedPriority} />
                                        <div className="text-xs font-mono font-bold tracking-tight">
                                            SLA: {calculateSLA(ticket.createdAt, ticket.assignedPriority)}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 flex-grow">
                                    <div className="mb-6">
                                        <h4 className="text-xs font-bold uppercase text-gray-500 tracking-widest mb-3">Original Investor Complaint</h4>
                                        <p className="text-gray-200 text-md bg-kfintech-bg/50 p-5 rounded-xl border border-kfintech-border leading-relaxed font-medium italic shadow-inner">
                                            "{ticket.complaintText}"
                                        </p>
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

                                <div className="px-6 py-5 bg-kfintech-bg/50 border-t border-kfintech-border/50 flex justify-end gap-4 group-hover:bg-kfintech-bg transition-colors">
                                    <motion.button 
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handleAction(ticket._id, 'REJECT')}
                                        className="flex items-center gap-2 px-6 py-3 border border-red-500/30 text-red-400 bg-red-500/5 rounded-xl hover:bg-red-500/20 hover:border-red-500/50 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] font-bold transition-all text-sm uppercase tracking-wider"
                                    >
                                        <XCircle className="w-4 h-4" /> Reject to L1
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
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};

export default L2CheckerDesk;
