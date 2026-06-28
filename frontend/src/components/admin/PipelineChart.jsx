import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, Tooltip as RechartsTooltip, LabelList } from 'recharts';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from 'lucide-react';

const PipelineChart = ({ statusData }) => {
    // Smooth pastel color mapping
    const getBarColor = (index) => {
        const colors = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#14b8a6', '#3b82f6'];
        return colors[index % colors.length];
    };

    return (
        <Card className="relative overflow-hidden bg-white/60 backdrop-blur-xl shadow-sm border-zinc-200/50 rounded-2xl h-full flex flex-col group hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-300">
            {/* Realistic ambient lighting effects */}
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-400/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-purple-400/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            
            <CardHeader className="relative z-10 border-b border-zinc-100/50 px-6 py-5 flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-base font-semibold text-zinc-950 flex items-center">
                    Ticket Pipeline
                    <TooltipProvider delayDuration={100}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Info className="h-4 w-4 ml-2 text-zinc-400 hover:text-indigo-600 transition-colors cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="right" className="bg-zinc-900 text-white font-medium shadow-xl">
                                <p>Real-time distribution of tickets across all processing stages.</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-6 min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statusData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={32}>
                        <defs>
                            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                                <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.15" />
                            </filter>
                        </defs>
                        <CartesianGrid strokeDasharray="1 4" stroke="#d4d4d8" vertical={false} />
                        <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} dy={10} />
                        <YAxis tick={{ fill: '#71717a', fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} dx={-10} />
                        <RechartsTooltip cursor={{ fill: '#f4f4f5' }} contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(8px)', borderColor: '#e4e4e7', borderRadius: '8px', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)', fontSize: '13px', fontWeight: 500 }} itemStyle={{ color: '#18181b', fontWeight: 600 }} />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]} filter="url(#shadow)">
                            {statusData?.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={getBarColor(index)} />
                            ))}
                            <LabelList dataKey="value" position="top" style={{ fill: '#52525b', fontSize: '11px', fontWeight: 600 }} />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
};

export default PipelineChart;
