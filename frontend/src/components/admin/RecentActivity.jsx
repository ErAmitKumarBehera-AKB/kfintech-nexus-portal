import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from 'date-fns';

const RecentActivity = ({ activitiesList }) => {
    return (
        <Card className="shadow-sm border-zinc-200 rounded-xl overflow-hidden bg-white h-full flex flex-col">
            <CardHeader className="border-b border-zinc-100 px-6 py-5 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-semibold text-zinc-950">Recent Activities</CardTitle>
                <span className="text-xs text-zinc-500 font-medium">Live Feed</span>
            </CardHeader>
            <CardContent className="flex-1 p-0 flex flex-col overflow-y-auto max-h-[400px]">
                {activitiesList && activitiesList.length > 0 ? (
                    <div className="divide-y divide-zinc-100">
                        {activitiesList.slice(0, 8).map((log, i) => (
                            <div key={log._id || i} className="px-6 py-4 hover:bg-zinc-50 transition-colors">
                                <div className="flex justify-between items-start mb-1">
                                    <p className="text-sm font-semibold text-zinc-950">
                                        {log.performedBy?.name || 'System'}
                                    </p>
                                    <span className="text-[10px] text-zinc-500 font-mono">
                                        {format(new Date(log.createdAt), 'MMM dd, HH:mm')}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 mt-1.5">
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-zinc-600 font-medium whitespace-nowrap">
                                        {log.action.replace(/_/g, ' ')}
                                    </span>
                                    <span className="text-xs text-zinc-500 truncate">
                                        {log.entityType} {log.entityId?.ticketId ? `#${log.entityId.ticketId}` : ''}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 p-6 min-h-[200px]">
                        <p className="text-sm">No recent activities found.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default RecentActivity;
