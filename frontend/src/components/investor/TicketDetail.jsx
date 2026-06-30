import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import SLAProgressBar from '../common/SLAProgressBar';
import { ArrowLeft, Clock, FileText, Download, CheckCircle2, AlertCircle, Send } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const TicketDetail = ({ ticketId, onBack }) => {
    const [ticket, setTicket] = useState(null);
    const [timeline, setTimeline] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

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
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900" />
            </div>
        );
    }

    if (!ticket) {
        return <div className="text-center p-8 text-zinc-500">Ticket not found.</div>;
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-12">
            <Button variant="ghost" onClick={onBack} className="text-zinc-500 hover:text-zinc-900 -ml-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Tickets
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden bg-white dark:bg-[#131313]">
                        <div className="bg-zinc-50 dark:bg-[#1A1A1A] p-6 border-b border-zinc-100 dark:border-zinc-800">
                            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                                        Ticket #{ticket._id.toString().slice(-6).toUpperCase()}
                                    </span>
                                    <Badge variant="outline" className="bg-white dark:bg-[#131313] dark:text-zinc-100 dark:border-zinc-800">{ticket.serviceType}</Badge>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Created on</p>
                                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{format(new Date(ticket.createdAt), 'MMMM dd, yyyy')}</p>
                                </div>
                            </div>
                            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">{ticket.title || ticket.serviceType}</h1>
                        </div>

                        <CardContent className="p-6">
                            <div className="space-y-6">
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <Clock className="w-4 h-4 text-zinc-500 dark:text-zinc-400" /> 
                                        <h3 className="font-medium text-zinc-900 dark:text-zinc-100">SLA Progress</h3>
                                        <span className="ml-auto text-xs text-zinc-500 dark:text-zinc-400">
                                            Deadline: {ticket.slaTimeline?.deadline ? format(new Date(ticket.slaTimeline.deadline), 'MMM dd, yyyy') : 'N/A'}
                                        </span>
                                    </div>
                                    <SLAProgressBar currentStatus={ticket.status} timeline={timeline} />
                                </div>
                                
                                <Separator className="bg-zinc-200 dark:bg-zinc-800" />

                                <div>
                                    <h3 className="font-medium text-zinc-900 dark:text-zinc-100 mb-2">Description</h3>
                                    <div className="bg-zinc-50 dark:bg-[#1A1A1A] p-4 rounded-lg border border-zinc-100 dark:border-zinc-800">
                                        <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{ticket.description}</p>
                                    </div>
                                </div>

                                {ticket.serviceMetadata && Object.keys(ticket.serviceMetadata).length > 0 && (
                                    <div>
                                        <h3 className="font-medium text-zinc-900 dark:text-zinc-100 mb-3">Service Details</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white dark:bg-[#131313] border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
                                            {Object.entries(ticket.serviceMetadata).map(([key, value]) => (
                                                <div key={key} className="space-y-1">
                                                    <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{value}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>


                    <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-[#131313]">
                        <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
                            <CardTitle className="text-lg font-medium text-zinc-900 dark:text-zinc-100">Activity Timeline</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="space-y-4 border-l-2 border-zinc-100 dark:border-zinc-800 ml-2 pl-4">
                                {timeline.map((log, index) => (
                                    <div key={log._id} className="relative">
                                        <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700 ring-4 ring-white dark:ring-[#131313]" />
                                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{log.action.replace(/_/g, ' ')}</p>
                                        {log.details?.note && <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-0.5">{log.details.note}</p>}
                                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">{format(new Date(log.createdAt || log.timestamp), 'MMM dd, yyyy HH:mm')}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-[#131313]">
                        <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
                            <CardTitle className="text-lg font-medium text-zinc-900 dark:text-zinc-100">Documents</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-3">
                            {ticket.documents && ticket.documents.length > 0 ? (
                                ticket.documents.map((doc, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-[#1A1A1A]">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="p-2 bg-white dark:bg-[#131313] rounded border border-zinc-100 dark:border-zinc-800 shrink-0">
                                                <FileText className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                                            </div>
                                            <div className="truncate">
                                                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{doc.name}</p>
                                                <p className="text-xs text-zinc-500 dark:text-zinc-400">{(doc.size / 1024).toFixed(1)} KB</p>
                                            </div>
                                        </div>
                                        <a href={doc.s3Key} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md transition-colors text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 shrink-0">
                                            <Download className="w-4 h-4" />
                                        </a>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-4">No documents attached.</p>
                            )}
                        </CardContent>
                    </Card>
                    
                    <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-[#131313]">
                        <CardContent className="p-5 space-y-4">
                            <div>
                                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1">Priority Level</p>
                                <Badge variant="secondary" className="bg-zinc-100 dark:bg-[#1A1A1A] text-zinc-900 dark:text-zinc-100 dark:border-zinc-800">
                                    {ticket.assignedPriority || 'UNASSIGNED'}
                                </Badge>
                            </div>
                            
                            {ticket.isPotentialFraud && (
                                <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg flex items-start gap-2">
                                    <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                                    <p className="text-xs text-red-800 dark:text-red-300 font-medium">Flagged for manual review by AI system.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {ticket.status === 'REJECTED' && (
                        <Card className="border-red-200 shadow-sm bg-red-50/50">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-red-700 text-base flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" /> Ticket Rejected
                                </CardTitle>
                                <CardDescription className="text-red-600/80">Please upload correct documentation to resubmit.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {ticket.revisionReason && (
                                    <div className="p-3 bg-white border border-red-100 rounded-lg">
                                        <p className="text-sm text-red-900"><strong className="font-semibold">Reason:</strong> {ticket.revisionReason}</p>
                                    </div>
                                )}
                                <form onSubmit={handleResubmit} className="space-y-3">
                                    <Input 
                                        type="file" 
                                        onChange={(e) => setResubmitFile(e.target.files[0])}
                                        required
                                        className="bg-white border-red-200 text-sm file:text-red-700"
                                    />
                                    <Button type="submit" disabled={resubmitting || !resubmitFile} className="w-full bg-red-600 hover:bg-red-700 text-white">
                                        {resubmitting ? 'Uploading...' : 'Resubmit Ticket'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TicketDetail;
