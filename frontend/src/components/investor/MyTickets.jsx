import React, { useState, useEffect } from 'react';
import { useTickets } from '../../hooks/useTickets';
import { Clock, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { SERVICE_TYPE_LIST } from '../../config/serviceTypes';

const MyTickets = ({ onSelectTicket }) => {
    const { tickets, isLoading, fetchTickets } = useTickets();
    const [filter, setFilter] = useState('ALL');
    const [serviceFilter, setServiceFilter] = useState('ALL');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        const loadTickets = async () => {
            try {
                const filters = { page, limit: 10 };
                if (filter !== 'ALL') filters.status = filter;
                if (serviceFilter !== 'ALL') filters.serviceType = serviceFilter;
                
                const data = await fetchTickets(filters);
                setTotalPages(data.pagination?.pages || 1);
            } catch (error) {
                console.error('Failed to fetch tickets:', error);
            }
        };

        loadTickets();
    }, [page, filter, serviceFilter, fetchTickets]);

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
        return <div><div  /></div>;
    }

    return (
        <div>
            <div>
                <div>
                    <h1>My Tickets</h1>
                    <p>Track your service requests and SLA timelines.</p>
                </div>
                
                <div>
                    <div>
                        <Search  />
                        <input 
                            type="text" 
                            placeholder="Search..." 
                            
                        />
                    </div>
                    <select 
                        value={filter} 
                        onChange={(e) => { setFilter(e.target.value); setPage(1); }}>
                        <option value="ALL">All Status</option>
                        <option value="OPEN">Open</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="CLOSED">Closed</option>
                    </select>
                    <select 
                        value={serviceFilter} 
                        onChange={(e) => { setServiceFilter(e.target.value); setPage(1); }}>
                        <option value="ALL">All Services</option>
                        {SERVICE_TYPE_LIST.map(st => (
                            <option key={st.key} value={st.key}>{st.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div>
                {filteredTickets.length> 0 ? (
                    <div>
                        {filteredTickets.map(ticket => (
                            <div 
                                key={ticket._id} 
                                onClick={() => onSelectTicket(ticket._id)}>
                                <div>
                                    <div>
                                        <span>#{ticket._id.toString().slice(-6).toUpperCase()}</span>
                                        <span>
                                            {ticket.status.replace('_', ' ')}
                                        </span>
                                        {ticket.assignedPriority && (
                                            <span>
                                                {ticket.assignedPriority}
                                            </span>
                                        )}
                                    </div>
                                    <h3>{ticket.title || ticket.serviceType}</h3>
                                    <p>{ticket.description}</p>
                                </div>
                                <div>
                                    <p>Created: {format(new Date(ticket.createdAt), 'MMM dd, yyyy')}</p>
                                    <div>
                                        <Clock  />
                                        <span>
                                            SLA: {ticket.slaTimeline?.slaDays || 7} Days
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div>
                        <div>
                            <Filter  />
                        </div>
                        <h3>No tickets found</h3>
                        <p>You haven't raised any requests that match this filter.</p>
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {totalPages> 1 && (
                <div>
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(p => Math.max(1, p - 1))}>
                        Previous
                    </button>
                    <span>
                        Page <span>{page}</span> of <span>{totalPages}</span>
                    </span>
                    <button
                        disabled={page === totalPages}
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default MyTickets;
