import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import SLAProgressBar from '../common/SLAProgressBar';
import { ArrowLeft, Clock, FileText, Download, CheckCircle2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

const TicketDetail = ({ ticketId, onBack }) => {
    const [ticket, setTicket] = useState(null);
    const [timeline, setTimeline] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // New Features State
    const [newComment, setNewComment] = useState("");
    const [submittingComment, setSubmittingComment] = useState(false);
    const [resubmitFile, setResubmitFile] = useState(null);
    const [resubmitting, setResubmitting] = useState(false);

    useEffect(() => {
        const fetchTicketDetails = async () => {
            try {
                const response = await apiClient.get(`/tickets/${ticketId}`);
                setTicket(response.data.ticket);
                setTimeline(response.data.timeline);
            } catch (error) {
                console.error('Failed to fetch ticket:', error);
            } finally {
                setIsLoading(false);
            }
        };

        const handleAddComment = async (e) => {
            e.preventDefault();
            if (!newComment.trim()) return;
            setSubmittingComment(true);
            try {
                const res = await apiClient.post(`/tickets/${ticketId}/comments`, { message: newComment });
                setTicket({ ...ticket, comments: res.data.comments });
                setNewComment("");
                // Refresh to update timeline
                const refreshRes = await apiClient.get(`/tickets/${ticketId}`);
                setTimeline(refreshRes.data.timeline);
            } catch (err) {
                console.error("Failed to add comment:", err);
            } finally {
                setSubmittingComment(false);
            }
        };

        const handleResubmit = async (e) => {
            e.preventDefault();
            if (!resubmitFile) return;
            setResubmitting(true);
            try {
                const formData = new FormData();
                formData.append('document', resubmitFile);
                await apiClient.post(`/tickets/${ticketId}/resubmit`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                // Refresh
                const refreshRes = await apiClient.get(`/tickets/${ticketId}`);
                setTicket(refreshRes.data.ticket);
                setTimeline(refreshRes.data.timeline);
                setResubmitFile(null);
            } catch (err) {
                console.error("Failed to resubmit ticket:", err);
            } finally {
                setResubmitting(false);
            }
        };

        if (ticketId) fetchTicketDetails();
    }, [ticketId]);

    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><div className="animate-spin w-8 h-8 border-2 border-kfintech-primary border-t-transparent rounded-full" /></div>;
    }

    if (!ticket) {
        return <div className="text-white text-center">Ticket not found.</div>;
    }

    return (
        <div className="max-w-4xl mx-auto pb-12">
            <button 
                onClick={onBack}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 text-sm font-bold uppercase tracking-widest"
            >
                <ArrowLeft className="w-4 h-4" /> Back to Tickets
            </button>

            <div className="bg-kfintech-card border border-kfintech-border rounded-2xl overflow-hidden shadow-xl">
                {/* Header Section */}
                <div className="p-8 border-b border-kfintech-border/50 bg-gradient-to-br from-kfintech-card to-kfintech-bg/50">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-sm font-black text-gray-500 uppercase tracking-widest">
                                    Ticket #{ticket._id.toString().slice(-6).toUpperCase()}
                                </span>
                                <span className="px-3 py-1 bg-kfintech-primary/20 text-kfintech-primary rounded-lg text-xs font-black uppercase tracking-wider border border-kfintech-primary/30">
                                    {ticket.serviceType}
                                </span>
                            </div>
                            <h1 className="text-2xl font-black text-white tracking-tight">{ticket.title || ticket.serviceType}</h1>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Created on</p>
                            <p className="text-white font-medium">{format(new Date(ticket.createdAt), 'MMMM dd, yyyy')}</p>
                        </div>
                    </div>

                    {/* SLA Tracker */}
                    <div className="bg-kfintech-bg/60 p-6 rounded-xl border border-kfintech-border mt-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                                <Clock className="w-4 h-4 text-kfintech-primary" /> SLA Progress
                            </h3>
                            <div className="text-xs font-bold text-gray-500 uppercase">
                                Deadline: {ticket.slaTimeline?.deadline ? format(new Date(ticket.slaTimeline.deadline), 'MMM dd, yyyy') : 'N/A'}
                            </div>
                        </div>
                        <SLAProgressBar currentStatus={ticket.status} />
                    </div>
                </div>

                {/* Details Section */}
                <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-8">
                        <div>
                            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Description</h3>
                            <div className="bg-kfintech-bg p-5 rounded-xl border border-kfintech-border">
                                <p className="text-gray-300 leading-relaxed text-sm whitespace-pre-wrap">{ticket.description}</p>
                            </div>
                        </div>

                        {ticket.serviceMetadata && Object.keys(ticket.serviceMetadata).length > 0 && (
                            <div>
                                <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Service Details</h3>
                                <div className="bg-kfintech-bg rounded-xl border border-kfintech-border overflow-hidden divide-y divide-kfintech-border/50">
                                    {Object.entries(ticket.serviceMetadata).map(([key, value]) => (
                                        <div key={key} className="p-4 flex justify-between">
                                            <span className="text-sm text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                            <span className="text-sm font-medium text-white">{value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {/* Timeline / Audit Logs */}
                        <div>
                            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Activity Timeline</h3>
                            <div className="space-y-4 pl-2">
                                {timeline.map((log, index) => (
                                    <div key={log._id} className="relative pl-6 pb-4 border-l-2 border-kfintech-border last:border-0 last:pb-0">
                                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-kfintech-bg border-2 border-kfintech-primary" />
                                        <p className="text-sm font-bold text-white mb-1">{log.action.replace(/_/g, ' ')}</p>
                                        {log.details?.note && <p className="text-xs text-gray-400">{log.details.note}</p>}
                                        <p className="text-[10px] text-gray-500 mt-2 font-bold uppercase tracking-wider">{format(new Date(log.createdAt || log.timestamp), 'MMM dd, yyyy HH:mm')}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        </div>
                        
                        {/* Comments Section */}
                        <div className="mt-8 pt-8 border-t border-white/5">
                            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Comments</h3>
                            
                            <div className="space-y-4 mb-6">
                                {ticket.comments?.map((comment, idx) => (
                                    <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/5">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-bold text-kfintech-primary uppercase tracking-wider">{comment.authorRole.replace('_', ' ')}</span>
                                            <span className="text-[10px] text-gray-500">{format(new Date(comment.createdAt), 'MMM dd, HH:mm')}</span>
                                        </div>
                                        <p className="text-sm text-gray-300">{comment.message}</p>
                                    </div>
                                ))}
                                {(!ticket.comments || ticket.comments.length === 0) && (
                                    <p className="text-sm text-gray-500 italic">No comments yet.</p>
                                )}
                            </div>

                            <form onSubmit={handleAddComment} className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Add a comment..."
                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-kfintech-primary transition-colors"
                                />
                                <button 
                                    type="submit" 
                                    disabled={submittingComment || !newComment.trim()}
                                    className="px-6 py-3 bg-kfintech-primary hover:bg-opacity-90 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all"
                                >
                                    {submittingComment ? 'Sending...' : 'Post'}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Sidebar section */}
                    <div className="space-y-6">
                        {/* Documents */}
                        {ticket.documents && ticket.documents.length > 0 ? (
                            <div>
                                <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Attached Documents</h3>
                                <div className="space-y-3">
                                    {ticket.documents.map((doc, idx) => (
                                        <div key={idx} className="bg-kfintech-bg p-4 rounded-xl border border-kfintech-border">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="p-2 bg-kfintech-primary/10 rounded-lg text-kfintech-primary">
                                                    <FileText className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1 overflow-hidden">
                                                    <p className="text-sm font-bold text-white truncate">{doc.name}</p>
                                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">{(doc.size / 1024).toFixed(1)} KB</p>
                                                </div>
                                            </div>
                                            <a 
                                                href={doc.s3Key} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="w-full flex items-center justify-center gap-2 py-2 bg-kfintech-card hover:bg-kfintech-primary/20 text-kfintech-primary border border-kfintech-primary/30 rounded-lg text-xs font-bold transition-colors"
                                            >
                                                <Download className="w-3 h-3" /> View Document
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div>
                                <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Documents</h3>
                                <div className="bg-kfintech-bg p-4 rounded-xl border border-kfintech-border text-center">
                                    <p className="text-sm text-gray-500">No documents attached.</p>
                                </div>
                            </div>
                        )}
                        
                        {/* Priority & Flags */}
                        <div className="bg-kfintech-bg p-5 rounded-xl border border-kfintech-border space-y-4">
                            <div>
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Priority Level</p>
                                <span className={`px-2 py-1 rounded text-xs font-black uppercase tracking-wider border ${
                                    ticket.assignedPriority === 'CRITICAL' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                }`}>
                                    {ticket.assignedPriority}
                                </span>
                            </div>
                            
                            {ticket.isPotentialFraud && (
                                <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                                    <p className="text-xs text-red-400 font-medium">Flagged for manual review by AI system.</p>
                                </div>
                            )}
                        </div>

                        {/* Resubmit Flow for Rejected Tickets */}
                        {ticket.status === 'REJECTED' && (
                            <div className="bg-red-500/10 p-5 rounded-xl border border-red-500/20 space-y-4">
                                <div>
                                    <h3 className="text-sm font-bold text-red-400 mb-1">Ticket Rejected</h3>
                                    <p className="text-xs text-red-400/80 mb-4">Please upload the correct documentation to resubmit this request.</p>
                                    {ticket.revisionReason && (
                                        <div className="mb-4 p-3 bg-red-500/20 rounded-lg text-xs text-white">
                                            <strong>Reason:</strong> {ticket.revisionReason}
                                        </div>
                                    )}
                                </div>
                                <form onSubmit={handleResubmit} className="space-y-3">
                                    <input 
                                        type="file" 
                                        onChange={(e) => setResubmitFile(e.target.files[0])}
                                        className="block w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-white/10 file:text-white hover:file:bg-white/20 transition-colors"
                                        required
                                    />
                                    <button 
                                        type="submit"
                                        disabled={resubmitting || !resubmitFile}
                                        className="w-full py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors"
                                    >
                                        {resubmitting ? 'Uploading...' : 'Resubmit Ticket'}
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </div>
    );
};

export default TicketDetail;
