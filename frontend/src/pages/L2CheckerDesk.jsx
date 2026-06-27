import React, { useEffect, useState } from 'react';
import apiClient from '../api/client';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, XCircle, CheckCircle, Cpu, AlertTriangle, Activity, ChevronDown, FileText, User, Hash } from 'lucide-react';
import { getServiceType } from '../config/serviceTypes';

// Shared UI Components for AI Insights
const Badge = ({ priority }) => {
    const isCritical = priority === 'CRITICAL';
    return (
        <span>
            {isCritical && <AlertTriangle  />}
            {priority || 'NORMAL'}
        </span>
    );
};

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

const SentimentBar = ({ score }) => {
    const percentage = Math.min(Math.max((score || 0) * 100, 0), 100);
    const isHighFrustration = percentage> 70;
    
    return (
        <div>
            <div>
                <span><Activity  /> Customer Dissatisfaction Index</span>
                <span>{percentage.toFixed(1)}%</span>
            </div>
            <div>
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                     
                />
            </div>
        </div>
    );
};

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


const L2CheckerDesk = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedId, setExpandedId] = useState(null);
    const [pendingReturn, setPendingReturn] = useState({ id: null, note: '' });

    // Filtering State
    const [filterServiceType, setFilterServiceType] = useState('ALL');
    const [filterSearch, setFilterSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const toggleExpanded = (id) => setExpandedId(prev => prev === id ? null : id);

    const handleReturnToL1 = (ticketId) => {
        setPendingReturn({ id: ticketId, note: '' });
    };

    useEffect(() => {
        const fetchL2Queue = async () => {
            setLoading(true);
            try {
                const response = await apiClient.get('/l2/tickets', {
                    params: {
                        serviceType: filterServiceType,
                        search: filterSearch,
                        page
                    }
                });
                setTickets(response.data.tickets || []);
                setTotalPages(response.data.pagination?.pages || 1);
                setError(null);
            } catch (err) {
                console.error("Error fetching L2 queue:", err);
                setError("Failed to load L2 Checker Queue. Ensure the backend is active.");
            } finally {
                setLoading(false);
            }
        };

        fetchL2Queue();
    }, [filterServiceType, filterSearch, page]);

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
            <div>
                <div></div>
            </div>
        );
    }

    if (error) {
        return (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <div>
                    <p><AlertTriangle /> System Architecture Error</p>
                    <p>{error}</p>
                </div>
            </motion.div>
        );
    }

    return (
        <div>
            <motion.header 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}>
                <div>
                    <h1>
                        <ShieldCheck  />
                        L2 Checker Desk
                    </h1>
                    <p>Finalize pre-verified tickets. AI context is generated for rapid decision making.</p>
                </div>
                <div>
                    <div>
                        <input 
                            type="text" placeholder="Search..." value={filterSearch} onChange={e => setFilterSearch(e.target.value)}
                            
                        />
                        <select value={filterServiceType} onChange={e => setFilterServiceType(e.target.value)}>
                            <option value="ALL">All Service Types</option>
                            <option value="BANK_UPDATE">Bank Update</option>
                            <option value="KYC_UPDATE">KYC Update</option>
                            <option value="NOMINEE_UPDATE">Nominee Update</option>
                            <option value="ADDRESS_UPDATE">Address Update</option>
                            <option value="COMPLAINT">Complaint</option>
                        </select>
                    </div>
                    {totalPages> 1 && (
                        <div>
                            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>PREV</button>
                            <span>{page} / {totalPages}</span>
                            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>NEXT</button>
                        </div>
                    )}
                </div>
            </motion.header>

            {tickets.length === 0 ? (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}>
                    <CheckCircle  />
                    <h3>Inbox Zero Achieved</h3>
                    <p>All high-priority tickets have been cleared by the L2 desk.</p>
                </motion.div>
            ) : (
                <div>
                    <AnimatePresence>
                        {tickets.map((ticket, index) => (
                            <motion.div 
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                                transition={{ delay: index * 0.1 }}
                                key={ticket._id}>
                                <div>
                                    <div>
                                        <span>Ticket Reference</span>
                                        <div>#{ticket._id}</div>
                                    </div>
                                    <div>
                                        <div>
                                            {ticket.isPotentialFraud && (
                                                <span>
                                                    <AlertTriangle  /> POTENTIAL FRAUD
                                                </span>
                                            )}
                                            <ServiceTypeBadge serviceType={ticket.serviceType} />
                                            <Badge priority={ticket.assignedPriority} />
                                        </div>
                                        <div>
                                            SLA: {calculateSLA(ticket.createdAt, ticket.assignedPriority)}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div>
                                        <h4>
                                            Request Description
                                        </h4>
                                        <p>
                                            "{stripPrefix(ticket.description || ticket.title)}"
                                        </p>
                                        {/* Service Metadata Summary — shows type-specific submitted fields */}
                                        {ticket.serviceMetadata && Object.keys(ticket.serviceMetadata).length> 0 && (() => {
                                            const stConfig = getServiceType(ticket.serviceType);
                                            return (
                                                <div>
                                                    <div>
                                                        {Object.entries(ticket.serviceMetadata).map(([k, v]) => {
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
                                    </div>

                                    <div>
                                        <div></div>
                                        
                                        <div>
                                            <Cpu  />
                                            <h4>AI Microservice Insight Summary</h4>
                                        </div>
                                        
                                        <ul>
                                            {ticket.aiSummary && ticket.aiSummary.length> 0 ? (
                                                ticket.aiSummary.map((point, idx) => (
                                                    <li key={idx}>
                                                        <span>•</span>
                                                        <span>{point}</span>
                                                    </li>
                                                ))
                                            ) : (
                                                <li>
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
                                            transition={{ duration: 0.25, ease: 'easeInOut' }}>
                                            <div>
                                                <p>
                                                    <FileText  /> Full Request — L1 View
                                                </p>

                                                {/* Investor identity grid */}
                                                <div>
                                                    <div>
                                                        <p>
                                                            <User  /> Investor Name
                                                        </p>
                                                        <p>{ticket.investorName || 'Unknown'}</p>
                                                    </div>
                                                    <div>
                                                        <p>
                                                            <Hash  /> Account Number
                                                        </p>
                                                        <p>{ticket.accountNumber || 'Not Provided'}</p>
                                                    </div>
                                                </div>

                                                {/* Documents */}
                                                {ticket.documents && ticket.documents.length> 0 ? (
                                                    <div>
                                                        {ticket.documents.map((doc, idx) => (
                                                            <div key={idx}>
                                                                <div>
                                                                    {doc.status === 'VERIFIED' ? <CheckCircle  /> : <FileText  />}
                                                                </div>
                                                                <div>
                                                                    <div>
                                                                        <p>{doc.name}</p>
                                                                        <span>{doc.status}</span>
                                                                    </div>
                                                                    
                                                                    {doc.s3Key && (
                                                                        <button 
                                                                            
                                                                            onClick={() => window.open(doc.s3Key, '_blank')}>
                                                                            <Activity  /> View Source Document
                                                                        </button>
                                                                    )}
                                                                    
                                                                    {doc.ocrExtraction && doc.ocrExtraction.matchVerified !== undefined && (
                                                                        <div>
                                                                            <p>
                                                                                {doc.ocrExtraction.matchVerified ? <><ShieldCheck  /> OCR Verified Match</> : <><AlertTriangle  /> OCR Match Failed</>}
                                                                            </p>
                                                                            <p>Cross-checked via automated pipeline</p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div>No documents attached</div>
                                                )}
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
                                            transition={{ duration: 0.22, ease: 'easeInOut' }}>
                                            <div>
                                                <p>
                                                    <XCircle  />
                                                    Reason for Returning to L1
                                                </p>
                                                <textarea
                                                    rows={3}
                                                    autoFocus
                                                    placeholder="Describe what L1 needs to fix or clarify before this can be approved..."
                                                    value={pendingReturn.note}
                                                    onChange={e => setPendingReturn(prev => ({ ...prev, note: e.target.value }))}
                                                    
                                                />
                                                <div>
                                                    <button
                                                        onClick={() => setPendingReturn({ id: null, note: '' })}>
                                                        Cancel
                                                    </button>
                                                    <motion.button
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={() => handleAction(ticket._id, 'RETURN_TO_L1', pendingReturn.note)}>
                                                        <XCircle  /> Confirm Return to L1
                                                    </motion.button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div>
                                    {/* View Full Request toggle */}
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => toggleExpanded(ticket._id)}>
                                        <ChevronDown  />
                                        {expandedId === ticket._id ? 'Collapse' : 'View Full Request'}
                                    </motion.button>

                                    {/* Action buttons */}
                                    <div>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => handleReturnToL1(ticket._id)}>
                                            <XCircle  /> Return to L1
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => handleAction(ticket._id, 'REJECT')}>
                                            <ShieldCheck  /> Reject Request
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => handleAction(ticket._id, 'APPROVE')}>
                                            <CheckCircle  /> Approve & Resolve
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
