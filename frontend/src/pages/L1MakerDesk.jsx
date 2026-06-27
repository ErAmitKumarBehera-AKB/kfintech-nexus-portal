import React, { useEffect, useState } from 'react';
import apiClient from '../api/client';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Clock, ShieldAlert, Cpu, CheckCircle2, ChevronRight, FileText, XCircle, AlertTriangle, Sparkles } from 'lucide-react';
import { getServiceType } from '../config/serviceTypes';

const PriorityBadge = ({ priority }) => (
    <span>
        {priority || 'NORMAL'}
    </span>
);

const ServiceTypeBadge = ({ serviceType }) => {
    const config = getServiceType(serviceType || 'COMPLAINT');
    const Icon = config.icon;
    return (
        <span>
            <Icon  />
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
        if (!dateString) return <span>N/A</span>;
        
        let slaHours = 24;
        if (priority === 'CRITICAL') slaHours = 2;
        else if (priority === 'HIGH') slaHours = 4;
        
        const createdTime = new Date(dateString).getTime();
        const deadline = createdTime + (slaHours * 60 * 60 * 1000);
        const now = new Date().getTime();
        const diffMs = deadline - now;
        
        if (diffMs <= 0) {
            return <span>SLA BREACHED</span>;
        }
        
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 60) {
            return <span>{diffMins}m remaining</span>;
        }
        
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        return <span>{hours}h {mins}m remaining</span>;
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
            <div>
                <div></div>
            </div>
        );
    }

    return (
        <div>
            {/* Sidebar: L1 Queue */}
            <aside>
                <div>
                    <h2>
                        <ShieldAlert  />
                        L1 Maker Queue
                    </h2>
                    
                    {/* Live Analytics Chart */}
                    {queue.length> 0 && (
                        <div>
                            <div>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={chartData} innerRadius={25} outerRadius={35} paddingAngle={5} dataKey="value" stroke="none">
                                            {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: '#131B2F', border: '1px solid #1E293B', borderRadius: '8px' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div>
                                <div><span>CRITICAL:</span> <span>{criticalCount}</span></div>
                                <div><span>NORMAL:</span> <span>{normalCount}</span></div>
                            </div>
                        </div>
                    )}
                    {/* Filters Section */}
                    <div>
                        <input 
                            type="text" placeholder="Search..." value={filterSearch} onChange={e => setFilterSearch(e.target.value)}
                            
                        />
                        <div>
                            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                                <option value="ALL">All Status</option>
                                <option value="OPEN">Open</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="L1_REVIEW">L1 Review</option>
                                <option value="ON_HOLD">On Hold</option>
                            </select>
                            <select value={filterAssigned} onChange={e => setFilterAssigned(e.target.value)}>
                                <option value="ALL">All Assigned</option>
                                <option value="ME">Assigned to Me</option>
                                <option value="UNASSIGNED">Unassigned</option>
                            </select>
                            <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
                                <option value="ALL">All Priorities</option>
                                <option value="CRITICAL">Critical</option>
                                <option value="HIGH">High</option>
                                <option value="NORMAL">Normal</option>
                            </select>
                            <select value={filterAge} onChange={e => setFilterAge(e.target.value)}>
                                <option value="NEWEST">Newest First</option>
                                <option value="OLDEST">Oldest First</option>
                            </select>
                        </div>
                    </div>
                </div>
                
                <div>
                    <AnimatePresence>
                        {queue.length === 0 ? (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
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
                                    onClick={() => { setSelectedTicket(ticket); setOcrResult(null); setNotes(''); }}>
                                    {selectedTicket?._id === ticket._id && (
                                        <motion.div layoutId="queue-active"  />
                                    )}
                                    <div>
                                        <span>#{ticket._id.substring(18)}</span>
                                        <div>
                                            {ticket.isPotentialFraud && (
                                                <span>
                                                    ⚠️ FRAUD
                                                </span>
                                            )}
                                            <ServiceTypeBadge serviceType={ticket.serviceType} />
                                            <PriorityBadge priority={ticket.assignedPriority} />
                                        </div>
                                    </div>
                                    <p>{stripPrefix(ticket.description || ticket.title)}</p>
                                    <div>
                                        <span>{ticket.status}</span>
                                        <span>
                                            <Clock  />
                                            {calculateSLA(ticket.createdAt, ticket.assignedPriority)}
                                        </span>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                    {/* Pagination */}
                    {totalPages> 1 && (
                        <div>
                            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>PREV</button>
                            <span>{page} / {totalPages}</span>
                            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>NEXT</button>
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Workspace */}
            <main>
                {selectedTicket ? (
                    <motion.div 
                        key={selectedTicket._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}>
                        <div>
                            
                            <div>
                                <div>
                                    <h3>
                                        Ticket Processing Workspace
                                    </h3>
                                    <div>
                                        {selectedTicket.isPotentialFraud && (
                                            <span>
                                                ⚠️ POTENTIAL FRAUD DETECTED
                                            </span>
                                        )}
                                        <ServiceTypeBadge serviceType={selectedTicket.serviceType} />
                                        <PriorityBadge priority={selectedTicket.assignedPriority} />
                                        <span>
                                            ID: {selectedTicket._id}
                                        </span>
                                    </div>
                                </div>
                                
                                {/* L2 Return Note Banner */}
                                {selectedTicket.l2ReturnNote && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -8 }}
                                        animate={{ opacity: 1, y: 0 }}>
                                        <AlertTriangle  />
                                        <div>
                                            <p>Returned by L2 Checker</p>
                                            <p>{selectedTicket.l2ReturnNote}</p>
                                        </div>
                                    </motion.div>
                                )}

                                <div>
                                    <div>
                                        <h4>Investor Name</h4>
                                        <p>{selectedTicket.investorName || 'Unknown Investor'}</p>
                                    </div>
                                    <div>
                                        <h4>Account Number</h4>
                                        <p>{selectedTicket.accountNumber || 'Not Provided'}</p>
                                    </div>
                                </div>

                                <div>
                                    <h4>
                                        <FileText  />
                                        Request Description
                                    </h4>
                                    <p>
                                        {stripPrefix(selectedTicket.description || selectedTicket.title)}
                                    </p>
                                    {/* Service Metadata Panel */}
                                    {selectedTicket.serviceMetadata && Object.keys(selectedTicket.serviceMetadata).length> 0 && (() => {
                                        const stConfig = getServiceType(selectedTicket.serviceType);
                                        return (
                                            <div>
                                                <h5>
                                                    {stConfig.label} — Submitted Details
                                                </h5>
                                                <div>
                                                    {Object.entries(selectedTicket.serviceMetadata).map(([k, v]) => {
                                                        const fieldDef = stConfig.requiredFields.find(f => f.name === k);
                                                        return (
                                                            <div key={k}>
                                                                <p>{fieldDef?.label || k}</p>
                                                                <p>{v || '—'}</p>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                    
                                    {/* AI Summary Section */}
                                    <div>
                                        <div></div>
                                        <div>
                                            <h4>
                                                <Sparkles  /> AI Ticket Summary
                                            </h4>
                                            {(!selectedTicket.aiSummary || selectedTicket.aiSummary.length === 0 || selectedTicket.aiSummary[0] === 'Pending AI Triage') && (
                                                <button 
                                                    onClick={handleSummarize}
                                                    disabled={loadingSummary}>
                                                    {loadingSummary ? <Cpu  /> : <Sparkles  />}
                                                    {loadingSummary ? 'Generating...' : 'Generate Summary'}
                                                </button>
                                            )}
                                        </div>
                                        
                                        {selectedTicket.aiSummary && selectedTicket.aiSummary.length> 0 && selectedTicket.aiSummary[0] !== 'Pending AI Triage' ? (
                                            <ul>
                                                {selectedTicket.aiSummary.map((bullet, idx) => (
                                                    <li key={idx}>{bullet}</li>
                                                ))}
                                            </ul>
                                        ) : (
                                            !loadingSummary && <p>No summary generated yet.</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Multiple Documents Rendering */}
                            {selectedTicket.documents && selectedTicket.documents.length> 0 ? (
                                <div>
                                    {selectedTicket.documents.map((doc, idx) => (
                                        <div key={doc._id || idx}>
                                            <h4>
                                                <span><Cpu  /> Document {idx + 1}: {doc.name}</span>
                                                <button onClick={() => handleVerifyDoc(doc._id, doc.status)}>
                                                    {doc.status === 'VERIFIED' ? <><CheckCircle2 /> Verified</> : 'Mark as Verified'}
                                                </button>
                                            </h4>
                                            
                                            <div>
                                                <div>
                                                    <div>
                                                        <span>CONFIDENTIAL</span>
                                                    </div>
                                                    <div>
                                                        <FileText  />
                                                        <p>{doc.name}</p>
                                                        <p>AES-256 Encrypted</p>
                                                    </div>
                                                    {doc.s3Key && (
                                                        <button 
                                                            
                                                            onClick={() => window.open(doc.s3Key, '_blank')}>
                                                            View Document <ChevronRight  />
                                                        </button>
                                                    )}
                                                </div>

                                                <div>
                                                    <div>
                                                        <h5>
                                                            <Cpu  /> AI Extraction Result
                                                        </h5>
                                                        
                                                        {doc.ocrExtraction?.extractedText ? (
                                                            <div>
                                                                <div>
                                                                    {doc.ocrExtraction.matchVerified ? <><CheckCircle2  /> CRM Match Verified</> : <><ShieldAlert  /> Verification Failed</>}
                                                                </div>
                                                                <pre>
                                                                    {doc.ocrExtraction.extractedText || "No text extracted."}
                                                                </pre>
                                                            </div>
                                                        ) : (
                                                            <div>
                                                                <p>OCR extraction pending.</p>
                                                                <button 
                                                                    onClick={() => handleRunOcr(doc._id)}
                                                                    disabled={runningOcr === doc._id}>
                                                                    {runningOcr === doc._id ? (
                                                                        <><div  /> Processing OCR...</>
                                                                    ) : (
                                                                        <><Cpu  /> Run OCR Verification</>
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
                                <div>
                                    No documents attached to this ticket.
                                </div>
                            )}
                        </div>

                        {/* Sticky Action Footer */}
                        <div>
                            <textarea 
                                rows="2" 
                                placeholder="Enter Maker Notes or findings here before escalation..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                
                            />
                            <div>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleHold}>
                                    <AlertTriangle  /> Hold Ticket
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleReject}>
                                    <XCircle  /> Reject Request
                                </motion.button>
                                <motion.button 
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleEscalate}>
                                    Escalate to L2 Checker
                                    <ChevronRight  />
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <div>
                        <Cpu  />
                        <h3>No Ticket Selected</h3>
                        <p>Select a ticket from the queue to open the Maker Workspace.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default L1MakerDesk;
