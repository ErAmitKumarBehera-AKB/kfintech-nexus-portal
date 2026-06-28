import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from 'date-fns';
import StatusBadge from './StatusBadge';
import Pagination from './Pagination';

const TicketTable = ({ data, activeTab, page, totalPages, setPage }) => {
    return (
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="border-b border-zinc-100 px-6 py-5">
                <h2 className="text-base font-semibold text-zinc-950">
                    {activeTab === 'flagged' ? 'Flagged Anomalies' : 'Global Ticket Queue'}
                </h2>
                <p className="text-sm text-zinc-500 mt-0.5">
                    {activeTab === 'flagged' ? 'High-priority risks requiring immediate attention.' : 'System-wide view of all active support workflows.'}
                </p>
            </div>
            
            <div className="flex-1 overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-zinc-200 bg-zinc-50/50">
                            <TableHead className="text-xs font-semibold text-zinc-500 h-11 px-6 whitespace-nowrap">Ticket ID</TableHead>
                            <TableHead className="text-xs font-semibold text-zinc-500 h-11 whitespace-nowrap">Investor</TableHead>
                            <TableHead className="text-xs font-semibold text-zinc-500 h-11 whitespace-nowrap">Request Type</TableHead>
                            <TableHead className="text-xs font-semibold text-zinc-500 h-11 whitespace-nowrap">Status</TableHead>
                            <TableHead className="text-xs font-semibold text-zinc-500 h-11 whitespace-nowrap">Priority</TableHead>
                            <TableHead className="text-xs font-semibold text-zinc-500 h-11 text-right px-6 whitespace-nowrap">Created</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map(t => (
                            <TableRow key={t._id} className="border-zinc-100 hover:bg-zinc-50 transition-colors">
                                <TableCell className="px-6 py-4">
                                    <div className="text-xs font-mono font-medium text-zinc-900">
                                        #{t._id.substring(t._id.length - 8).toUpperCase()}
                                    </div>
                                </TableCell>
                                <TableCell className="py-4">
                                    <div className="text-sm font-semibold text-zinc-950">{t.investorName}</div>
                                    <div className="flex gap-2 mt-1.5">
                                        {t.isPotentialFraud && <StatusBadge status="FRAUD_RISK" />}
                                        {t.slaTimeline?.isBreached && <StatusBadge status="SLA_BREACH" />}
                                    </div>
                                </TableCell>
                                <TableCell className="py-4">
                                    <span className="text-sm text-zinc-600 font-medium">{t.serviceType?.replace(/_/g, ' ')}</span>
                                </TableCell>
                                <TableCell className="py-4">
                                    <StatusBadge status={t.status} />
                                </TableCell>
                                <TableCell className="py-4">
                                    <StatusBadge status={t.assignedPriority} />
                                </TableCell>
                                <TableCell className="px-6 py-4 text-right">
                                    <span className="text-xs text-zinc-500 font-mono">
                                        {format(new Date(t.createdAt), 'MMM dd, yyyy')}
                                    </span>
                                </TableCell>
                            </TableRow>
                        ))}
                        {data.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-16 text-zinc-400 text-sm">
                                    No records found matching current criteria.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            
            <Pagination page={page} totalPages={totalPages} setPage={setPage} />
        </div>
    );
};

export default TicketTable;
