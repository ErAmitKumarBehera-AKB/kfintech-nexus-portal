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
        const fetchTicketDetails = async (isBackground = false) => {
            try {
                const response = await apiClient.get(`/tickets/${ticketId}`);
                setTicket(response.data.ticket);
                setTimeline(response.data.timeline);
            } catch (error) {
                console.error('Failed to fetch ticket:', error);
            } finally {
                if (!isBackground) setIsLoading(false);
            }
        };

        if (ticketId) {
            fetchTicketDetails();
            const intervalId = setInterval(() => {
                fetchTicketDetails(true);
            }, 5000);
            return () => clearInterval(intervalId);
        }
    }, [ticketId]);

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
                formData.append('documents', resubmitFile);
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

    if (isLoading) {
        return <div><div  /></div>;
    }

    if (!ticket) {
        return <div>Ticket not found.</div>;
    }

    return (
        <div>
            <button 
                onClick={onBack}>
                <ArrowLeft  /> Back to Tickets
            </button>

            <div>
                {/* Header Section */}
                <div>
                    <div>
                        <div>
                            <div>
                                <span>
                                    Ticket #{ticket._id.toString().slice(-6).toUpperCase()}
                                </span>
                                <span>
                                    {ticket.serviceType}
                                </span>
                            </div>
                            <h1>{ticket.title || ticket.serviceType}</h1>
                        </div>
                        <div>
                            <p>Created on</p>
                            <p>{format(new Date(ticket.createdAt), 'MMMM dd, yyyy')}</p>
                        </div>
                    </div>

                    {/* SLA Tracker */}
                    <div>
                        <div>
                            <h3>
                                <Clock  /> SLA Progress
                            </h3>
                            <div>
                                Deadline: {ticket.slaTimeline?.deadline ? format(new Date(ticket.slaTimeline.deadline), 'MMM dd, yyyy') : 'N/A'}
                            </div>
                        </div>
                        <SLAProgressBar currentStatus={ticket.status} timeline={timeline} />
                    </div>
                </div>

                {/* Details Section */}
                <div>
                    <div>
                        <div>
                            <h3>Description</h3>
                            <div>
                                <p>{ticket.description}</p>
                            </div>
                        </div>

                        {ticket.serviceMetadata && Object.keys(ticket.serviceMetadata).length> 0 && (
                            <div>
                                <h3>Service Details</h3>
                                <div>
                                    {Object.entries(ticket.serviceMetadata).map(([key, value]) => (
                                        <div key={key}>
                                            <span>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                            <span>{value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {/* Timeline / Audit Logs */}
                        <div>
                            <h3>Activity Timeline</h3>
                            <div>
                                {timeline.map((log, index) => (
                                    <div key={log._id}>
                                        <div  />
                                        <p>{log.action.replace(/_/g, ' ')}</p>
                                        {log.details?.note && <p>{log.details.note}</p>}
                                        <p>{format(new Date(log.createdAt || log.timestamp), 'MMM dd, yyyy HH:mm')}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        </div>
                        
                        {/* Comments Section */}
                        <div>
                            <h3>Comments</h3>
                            
                            <div>
                                {ticket.comments?.map((comment, idx) => (
                                    <div key={idx}>
                                        <div>
                                            <span>{comment.authorRole.replace('_', ' ')}</span>
                                            <span>{format(new Date(comment.createdAt), 'MMM dd, HH:mm')}</span>
                                        </div>
                                        <p>{comment.message}</p>
                                    </div>
                                ))}
                                {(!ticket.comments || ticket.comments.length === 0) && (
                                    <p>No comments yet.</p>
                                )}
                            </div>

                            <form onSubmit={handleAddComment}>
                                <input 
                                    type="text" 
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Add a comment..."
                                    
                                />
                                <button 
                                    type="submit" 
                                    disabled={submittingComment || !newComment.trim()}>
                                    {submittingComment ? 'Sending...' : 'Post'}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Sidebar section */}
                    <div>
                        {/* Documents */}
                        {ticket.documents && ticket.documents.length> 0 ? (
                            <div>
                                <h3>Attached Documents</h3>
                                <div>
                                    {ticket.documents.map((doc, idx) => (
                                        <div key={idx}>
                                            <div>
                                                <div>
                                                    <FileText  />
                                                </div>
                                                <div>
                                                    <p>{doc.name}</p>
                                                    <p>{(doc.size / 1024).toFixed(1)} KB</p>
                                                </div>
                                            </div>
                                            <a 
                                                href={doc.s3Key} 
                                                target="_blank" 
                                                rel="noopener noreferrer">
                                                <Download  /> View Document
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div>
                                <h3>Documents</h3>
                                <div>
                                    <p>No documents attached.</p>
                                </div>
                            </div>
                        )}
                        
                        {/* Priority & Flags */}
                        <div>
                            <div>
                                <p>Priority Level</p>
                                <span>
                                    {ticket.assignedPriority}
                                </span>
                            </div>
                            
                            {ticket.isPotentialFraud && (
                                <div>
                                    <AlertCircle  />
                                    <p>Flagged for manual review by AI system.</p>
                                </div>
                            )}
                        </div>

                        {/* Resubmit Flow for Rejected Tickets */}
                        {ticket.status === 'REJECTED' && (
                            <div>
                                <div>
                                    <h3>Ticket Rejected</h3>
                                    <p>Please upload the correct documentation to resubmit this request.</p>
                                    {ticket.revisionReason && (
                                        <div>
                                            <strong>Reason:</strong> {ticket.revisionReason}
                                        </div>
                                    )}
                                </div>
                                <form onSubmit={handleResubmit}>
                                    <input 
                                        type="file" 
                                        onChange={(e) => setResubmitFile(e.target.files[0])}
                                        
                                        required
                                    />
                                    <button 
                                        type="submit"
                                        disabled={resubmitting || !resubmitFile}>
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
