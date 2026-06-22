import React, { useEffect, useState } from 'react';
import apiClient from '../api/client';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Clock, ShieldAlert, Cpu, CheckCircle2, ChevronRight, FileText } from 'lucide-react';

const PriorityBadge = ({ priority }) => (
    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider shadow-sm ${
        priority === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
    }`}>
        {priority || 'NORMAL'}
    </span>
);

const L1MakerDesk = () => {
    const [queue, setQueue] = useState([]);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notes, setNotes] = useState('');
    const [isOcrRunning, setIsOcrRunning] = useState(false);
    const [ocrResult, setOcrResult] = useState(null);

    useEffect(() => {
        const fetchQueue = async () => {
            try {
                const response = await apiClient.get('/dashboard/l1-queue');
                let fetchedTickets = response.data.data || [];
                
                // Sort by Priority (CRITICAL > HIGH > NORMAL) and then by Oldest First (closest to SLA breach)
                const priorityWeight = { 'CRITICAL': 3, 'HIGH': 2, 'NORMAL': 1 };
                fetchedTickets.sort((a, b) => {
                    const weightA = priorityWeight[a.assignedPriority || 'NORMAL'] || 1;
                    const weightB = priorityWeight[b.assignedPriority || 'NORMAL'] || 1;
                    if (weightA !== weightB) return weightB - weightA; // Higher weight first
                    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(); // Oldest first
                });
                
                setQueue(fetchedTickets);
            } catch (error) {
                console.error("Queue Fetch Error:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchQueue();
    }, []);

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

    const handleRunOCR = () => {
        setIsOcrRunning(true);
        setOcrResult(null);
        setTimeout(() => {
            setIsOcrRunning(false);
            setOcrResult({
                matched: true,
                extracted: "FOLIO: 123456789\nNAME: JOHN DOE\nSTATUS: ACTIVE"
            });
        }, 2000);
    };

    const handleEscalate = async () => {
        if (!selectedTicket) return;
        try {
            await apiClient.put(`/admin/escalate/${selectedTicket._id}`, { notes });
            setQueue(q => q.filter(t => t._id !== selectedTicket._id));
            setSelectedTicket(null);
            setNotes('');
            setOcrResult(null);
        } catch (error) {
            alert(`Escalation failed: ${error.response?.data?.error || error.message}`);
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
                                        <PriorityBadge priority={ticket.assignedPriority} />
                                    </div>
                                    <p className="text-sm font-medium text-gray-200 line-clamp-2 leading-snug group-hover:text-white transition-colors">{ticket.complaintText}</p>
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
                                    <span className="text-sm font-mono bg-kfintech-primary/10 border border-kfintech-primary/30 px-3 py-1 rounded text-blue-300 font-bold shadow-inner">
                                        ID: {selectedTicket._id}
                                    </span>
                                </div>
                                
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
                                        <FileText className="w-4 h-4" /> Investor Complaint String
                                    </h4>
                                    <p className="text-gray-300 text-md font-medium bg-kfintech-bg/50 p-5 rounded-xl border border-kfintech-border leading-relaxed shadow-inner">
                                        {selectedTicket.complaintText}
                                    </p>
                                </div>
                            </div>

                            <div className="glass-panel p-6 rounded-2xl mb-6 shadow-lg border border-kfintech-border">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Cpu className="w-4 h-4" /> Secure Document Inspector
                                </h4>
                                <div className="flex gap-6">
                                    
                                    <div className="w-1/2 bg-kfintech-bg/50 rounded-xl border border-kfintech-border flex items-center justify-center p-8 relative overflow-hidden min-h-[300px] shadow-inner group">
                                        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none transform -rotate-45">
                                            <span className="text-4xl font-black tracking-widest text-white">CONFIDENTIAL</span>
                                        </div>
                                        <div className="text-center relative z-10 group-hover:scale-105 transition-transform">
                                            <FileText className="w-16 h-16 text-gray-500 mx-auto mb-3" />
                                            <p className="text-sm font-bold text-blue-300">{selectedTicket.documentName || "No document attached"}</p>
                                            <p className="text-xs text-gray-500 mt-1">{selectedTicket.documentName ? "AES-256 Encrypted" : "OCR disabled"}</p>
                                        </div>
                                    </div>

                                    <div className="w-1/2 flex flex-col">
                                        <div className="bg-kfintech-primary/5 p-6 rounded-xl border border-kfintech-primary/20 flex-grow shadow-inner">
                                            <h5 className="font-extrabold text-blue-400 mb-3 flex items-center gap-2 text-lg">
                                                <Cpu className="w-5 h-5" /> EasyOCR Engine
                                            </h5>
                                            <p className="text-sm text-gray-400 mb-6 font-medium leading-relaxed">
                                                Run Zero-Touch automated text extraction to verify the embedded account details against the CRM records.
                                            </p>
                                            
                                            <motion.button 
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => {
                                                    setIsOcrRunning(true);
                                                    setTimeout(() => {
                                                        setIsOcrRunning(false);
                                                        setOcrResult({
                                                            matched: selectedTicket.ocrMatchVerified || false,
                                                            extracted: selectedTicket.ocrExtractedText || "No document attached or OCR processing failed."
                                                        });
                                                    }, 800);
                                                }}
                                                disabled={isOcrRunning}
                                                className={`w-full py-4 rounded-xl text-sm font-bold uppercase tracking-wider text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
                                                    isOcrRunning ? 'bg-kfintech-border cursor-wait text-gray-400' : 'bg-kfintech-primary hover:bg-blue-500 hover:shadow-[0_0_20px_rgba(59,130,246,0.6)]'
                                                }`}
                                            >
                                                {isOcrRunning ? (
                                                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analyzing...</>
                                                ) : 'Run AI Extraction'}
                                            </motion.button>

                                            <AnimatePresence>
                                                {ocrResult && (
                                                    <motion.div 
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className={`mt-6 p-5 rounded-xl border shadow-inner ${ocrResult.matched ? 'bg-kfintech-accent/10 border-kfintech-accent/30' : 'bg-red-500/10 border-red-500/30'}`}
                                                    >
                                                        <div className={`flex items-center gap-2 font-bold mb-3 text-sm uppercase tracking-wider ${ocrResult.matched ? 'text-emerald-400' : 'text-red-400'}`}>
                                                            {ocrResult.matched ? <><CheckCircle2 className="w-5 h-5" /> CRM Match Verified</> : <><ShieldAlert className="w-5 h-5" /> Verification Failed</>}
                                                        </div>
                                                        <pre className="text-xs bg-kfintech-bg/80 p-3 rounded-lg text-gray-300 font-mono border border-kfintech-border shadow-inner leading-relaxed whitespace-pre-wrap">
                                                            {ocrResult.extracted}
                                                        </pre>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                </div>
                            </div>
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
                            <div className="flex justify-end gap-4">
                                <button className="px-6 py-3 text-sm font-bold text-gray-400 hover:text-white transition-colors uppercase tracking-wider">
                                    Return to Queue
                                </button>
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
