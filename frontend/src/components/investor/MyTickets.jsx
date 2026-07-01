import React, { useState, useEffect } from 'react';
import { useTickets } from '../../hooks/useTickets';
import { Clock, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { SERVICE_TYPE_LIST } from '../../config/serviceTypes';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const MyTickets = ({ onSelectTicket }) => {
    const { tickets, isLoading, fetchTickets } = useTickets();
    const [filter, setFilter] = useState('ALL');
    const [serviceFilter, setServiceFilter] = useState('ALL');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');

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

    const filteredTickets = tickets;

    const getStatusColor = (status) => {
        switch (status) {
            case 'OPEN': return 'bg-blue-100 text-blue-800 hover:bg-blue-100 border-transparent';
            case 'L1_REVIEW':
            case 'L2_APPROVAL':
            case 'IN_PROGRESS': return 'bg-amber-100 text-amber-800 hover:bg-amber-100 border-transparent';
            case 'RESOLVED':
            case 'CLOSED': return 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-transparent';
            case 'REJECTED': return 'bg-red-100 text-red-800 hover:bg-red-100 border-transparent';
            default: return 'bg-zinc-100 text-zinc-800 hover:bg-zinc-100 border-transparent';
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">My Tickets</h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Track your service requests and SLA timelines.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative w-full sm:w-[200px]">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                        <Input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-white dark:bg-[#131313] border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                        />
                    </div>

                    <Select value={filter} onValueChange={(val) => { setFilter(val); setPage(1); }}>
                        <SelectTrigger className="w-[140px] bg-white dark:bg-[#131313] text-xs sm:text-sm border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100">
                            <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Status</SelectItem>
                            <SelectItem value="OPEN">Open</SelectItem>
                            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                            <SelectItem value="RESOLVED">Resolved</SelectItem>
                            <SelectItem value="CLOSED">Closed</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={serviceFilter} onValueChange={(val) => { setServiceFilter(val); setPage(1); }}>
                        <SelectTrigger className="w-[180px] bg-white dark:bg-[#131313] text-xs sm:text-sm border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100">
                            <SelectValue placeholder="All Services" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Services</SelectItem>
                            {SERVICE_TYPE_LIST.map(st => (
                                <SelectItem key={st.key} value={st.key}>{st.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid gap-3">
                {filteredTickets.length > 0 ? (
                    filteredTickets.map(ticket => (
                        <Card
                            key={ticket._id}
                            onClick={() => onSelectTicket(ticket._id)}
                            className="cursor-pointer bg-white dark:bg-[#131313] border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-md transition-all duration-200 group"
                        >
                            <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">#{ticket._id.toString().slice(-6).toUpperCase()}</span>
                                        <Badge variant="secondary" className={getStatusColor(ticket.status)}>
                                            {ticket.status.replace('_', ' ')}
                                        </Badge>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors">{ticket.title || ticket.serviceType}</h3>
                                        <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-0.5">{ticket.description}</p>
                                    </div>
                                </div>
                                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between shrink-0 gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                                    <p>Created {format(new Date(ticket.createdAt), 'MMM dd, yyyy')}</p>
                                    <div className="flex items-center gap-1.5 mt-1 sm:mt-0 bg-zinc-100 dark:bg-zinc-800/50 px-2.5 py-1 rounded-md border border-zinc-200 dark:border-zinc-800">
                                        <Clock className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-400" />
                                        <span className="font-medium text-zinc-800 dark:text-zinc-200">
                                            SLA: {ticket.slaTimeline?.slaDays || 7} Days
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-black/20">
                        <div className="h-12 w-12 rounded-full bg-white dark:bg-[#131313] border border-zinc-100 dark:border-zinc-800 shadow-sm flex items-center justify-center mb-4">
                            <Filter className="h-5 w-5 text-zinc-400 dark:text-zinc-500" />
                        </div>
                        <h3 className="text-base font-medium text-zinc-900 dark:text-zinc-100">No tickets found</h3>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mt-1">You haven't raised any requests that match this filter.</p>
                    </Card>
                )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page === 1}
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        className="bg-white dark:bg-[#131313] border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
                    >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                    </Button>
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">
                        Page <span className="font-medium text-zinc-900 dark:text-zinc-100">{page}</span> of <span className="font-medium text-zinc-900 dark:text-zinc-100">{totalPages}</span>
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page === totalPages}
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        className="bg-white dark:bg-[#131313] border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
                    >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                </div>
            )}
        </div>
    );
};

export default MyTickets;
