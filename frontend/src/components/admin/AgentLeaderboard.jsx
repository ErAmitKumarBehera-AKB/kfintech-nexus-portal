import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCog } from 'lucide-react';

const AgentLeaderboard = ({ agentPerformance }) => {
    return (
        <Card className="shadow-sm border-zinc-200 rounded-xl overflow-hidden bg-white h-full flex flex-col">
            <CardHeader className="border-b border-zinc-100 px-6 py-5">
                <CardTitle className="text-base font-semibold text-zinc-950">Agent Performance</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0 flex flex-col">
                {agentPerformance && agentPerformance.length > 0 ? (
                    <div className="divide-y divide-zinc-100">
                        {agentPerformance.slice(0, 5).map((agent, i) => (
                            <div key={i} className="flex items-center justify-between px-6 py-4 hover:bg-zinc-50 transition-all duration-200">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-full bg-zinc-100 flex items-center justify-center border border-zinc-200 shrink-0">
                                        <span className="text-sm font-semibold text-zinc-950">{agent.name.substring(0,2).toUpperCase()}</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-zinc-950">{agent.name}</p>
                                        <p className="text-xs text-zinc-500 font-mono mt-0.5">{agent.role.replace('ADMIN_', '')}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-base font-bold text-zinc-950">{agent.actionsCount}</p>
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">actions</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 p-6 min-h-[200px]">
                        <UserCog className="h-10 w-10 opacity-20 mb-3" />
                        <p className="text-sm">No active agent data</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default AgentLeaderboard;
