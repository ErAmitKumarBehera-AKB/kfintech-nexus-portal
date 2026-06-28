import React from 'react';
import { TrendingUp, ArrowUpRight, ArrowDownRight, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const StatCard = ({ title, value, icon, trend, trendUp, description, tooltipText, color = "indigo" }) => {
    
    // Dynamic color mapping for the subtle icon background and trend indicator
    const colorMap = {
        indigo: "text-indigo-600 bg-indigo-50",
        emerald: "text-emerald-600 bg-emerald-50",
        amber: "text-amber-600 bg-amber-50",
        rose: "text-rose-600 bg-rose-50",
    };

    const iconColors = colorMap[color] || colorMap.indigo;

    return (
        <div className="relative group bg-white/60 backdrop-blur-xl rounded-2xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 hover:border-indigo-100 transition-all duration-300 p-6 overflow-hidden">
            {/* Subtle glass gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            
            <div className="relative z-10 flex items-center justify-between mb-4">
                <div className="flex items-center">
                    <h3 className="text-sm font-semibold text-zinc-500 tracking-wide">{title}</h3>
                    {tooltipText && (
                        <TooltipProvider delayDuration={100}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Info className="h-3.5 w-3.5 ml-1.5 text-zinc-400 hover:text-zinc-700 cursor-help transition-colors" />
                                </TooltipTrigger>
                                <TooltipContent side="top" className="bg-zinc-900 text-white font-medium text-xs">
                                    <p>{tooltipText}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>
                <div className={`p-2.5 rounded-xl ${iconColors} shadow-sm backdrop-blur-md`}>
                    {icon}
                </div>
            </div>
            <div className="relative z-10">
                <div className="text-4xl font-bold text-zinc-900 tracking-tight">{value}</div>
                <p className="text-sm text-zinc-500 mt-3 flex items-center">
                    {trend && (
                        <span className={`mr-2 flex items-center font-medium px-2 py-0.5 rounded-md text-xs shadow-sm ${trendUp ? 'text-emerald-700 bg-emerald-100/80' : 'text-rose-700 bg-rose-100/80'}`}>
                            {trendUp ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                            {trend}
                        </span>
                    )}
                    {description}
                </p>
            </div>
        </div>
    );
};

export default StatCard;
