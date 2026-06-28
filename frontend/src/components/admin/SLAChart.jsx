import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip } from 'recharts';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from 'lucide-react';

const SLAChart = ({ totalTickets, slaBreachedTickets }) => {
    
    // Calculate met vs breached
    const breached = slaBreachedTickets || 0;
    const met = Math.max(0, (totalTickets || 0) - breached);

    const data = [
        { name: 'SLA Met', value: met },
        { name: 'SLA Breached', value: breached }
    ];

    // Smooth colors: Emerald for Met, Rose for Breached
    const COLORS = ['#10b981', '#f43f5e'];

    return (
        <Card className="relative overflow-hidden bg-white/60 backdrop-blur-xl shadow-sm border-zinc-200/50 rounded-2xl h-full flex flex-col group hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-300">
            {/* Realistic ambient lighting effects */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-emerald-400/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            
            <CardHeader className="relative z-10 border-b border-zinc-100/50 px-6 py-5 flex flex-row items-center justify-between space-y-0 pb-4">
                <div className="flex flex-col">
                    <CardTitle className="text-base font-semibold text-zinc-950 flex items-center">
                        SLA Compliance
                        <TooltipProvider delayDuration={100}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Info className="h-4 w-4 ml-2 text-zinc-400 hover:text-emerald-600 transition-colors cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent side="right" className="bg-zinc-900 text-white font-medium shadow-xl">
                                    <p>Measures tickets resolved within deadline (Met) vs delayed (Breached).</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </CardTitle>
                </div>
            </CardHeader>
            <CardContent className="flex-1 p-6 min-h-[300px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <defs>
                            <filter id="pieShadow" x="-20%" y="-20%" width="140%" height="140%">
                                <feDropShadow dx="0" dy="6" stdDeviation="6" floodOpacity="0.2" />
                            </filter>
                        </defs>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={65}
                            outerRadius={95}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                            filter="url(#pieShadow)"
                            label={{ fill: '#3f3f46', fontSize: 12, fontWeight: 600 }}
                            labelLine={false}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <RechartsTooltip 
                            contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(8px)', borderColor: '#e4e4e7', borderRadius: '8px', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '13px', fontWeight: 500 }} 
                            itemStyle={{ color: '#18181b', fontWeight: 600 }} 
                        />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
};

export default SLAChart;
