import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import { Clock, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';

const MyTickets = ({ onSelectTicket }) => {
    const [tickets, setTickets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        const fetchTickets = async () => {
            setIsLoading(true);
            try {
                const response = await apiClient.get(`/tickets?page=${page}&limit=10${filter !== 'ALL' ? `&status=${filter}` : ''}`);
                setTickets(response.data.tickets || []);
                setTotalPages(response.data.pagination?.pages || 1);
            } catch (error) {
                console.error('Failed to fetch tickets:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTickets();
    }, [page, filter]);

    const filteredTickets = tickets; // Filtering is now handled backend-side via API call

    const getStatusColor = (status) => {
        switch (status) {
            case 'OPEN': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'L1_REVIEW':
            case 'L2_APPROVAL':
            case 'IN_PROGRESS': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
            case 'RESOLVED':
            case 'CLOSED': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            case 'REJECTED': return 'bg-red-500/10 text-red-400 border-red-500/20';
            default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
        }
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><div className="animate-spin w-8 h-8 border-2 border-kfintech-primary border-t-transparent rounded-full" /></div>;
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-white">My Tickets</h1>
                    <p className="text-gray-400 text-sm">Track your service requests and SLA timelines.</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input 
                            type="text" 
                            placeholder="Search..." 
                            className="bg-kfintech-card border border-kfintech-border rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:ring-1 focus:ring-kfintech-primary outline-none w-48"
                        />
                    </div>
                    <select 
                        value={filter} 
                        onChange={(e) => { setFilter(e.target.value); setPage(1); }}
                        className="bg-kfintech-card border border-kfintech-border rounded-lg px-4 py-2 text-sm text-white cursor-pointer"
                    >
                        <option value="ALL">All Status</option>
                        <option value="OPEN">Open</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="CLOSED">Closed</option>
                    </select>
                </div>
            </div>

            <div className="bg-kfintech-card border border-kfintech-border rounded-xl overflow-hidden">
                {filteredTickets.length > 0 ? (
                    <div className="divide-y divide-kfintech-border/50">
                        {filteredTickets.map(ticket => (
                            <div 
                                key={ticket._id} 
                                onClick={() => onSelectTicket(ticket._id)}
                                className="p-5 hover:bg-kfintech-bg/50 cursor-pointer transition-colors flex items-center justify-between group"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="text-xs font-bold text-gray-500">#{ticket._id.toString().slice(-6).toUpperCase()}</span>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${getStatusColor(ticket.status)}`}>
                                            {ticket.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <h3 className="text-white font-bold text-lg group-hover:text-kfintech-primary transition-colors">{ticket.title || ticket.serviceType}</h3>
                                    <p className="text-gray-400 text-sm mt-1 line-clamp-1">{ticket.description}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-500 mb-2">Created: {format(new Date(ticket.createdAt), 'MMM dd, yyyy')}</p>
                                    <div className="flex items-center gap-1.5 justify-end">
                                        <Clock className="w-3.5 h-3.5 text-gray-600" />
                                        <span className="text-xs font-medium text-gray-400">
                                            SLA: {ticket.slaTimeline?.slaDays || 7} Days
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-kfintech-bg rounded-full flex items-center justify-center mx-auto mb-4 border border-kfintech-border">
                            <Filter className="w-6 h-6 text-gray-500" />
                        </div>
                        <h3 className="text-white font-bold text-lg mb-1">No tickets found</h3>
                        <p className="text-gray-500 text-sm">You haven't raised any requests that match this filter.</p>
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-6">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        className="px-4 py-2 bg-kfintech-card border border-kfintech-border rounded-lg text-sm font-bold text-white disabled:opacity-50 hover:bg-white/5 transition-colors"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-gray-400">
                        Page <span className="text-white font-bold">{page}</span> of <span className="text-white font-bold">{totalPages}</span>
                    </span>
                    <button
                        disabled={page === totalPages}
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        className="px-4 py-2 bg-kfintech-card border border-kfintech-border rounded-lg text-sm font-bold text-white disabled:opacity-50 hover:bg-white/5 transition-colors"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default MyTickets;
