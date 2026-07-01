import React from 'react';
import { TrendingUp, ArrowUpRight, ArrowDownRight, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const StatCard = ({ title, value, icon, trend, trendUp, description, tooltipText, color = "indigo" }) => {

    // Dynamic color mapping for the subtle icon background and trend indicator
    const colorMap = {
        indigo: "text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20",
        emerald: "text-emerald-600 dark:text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20",
        amber: "text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20",
        rose: "text-rose-600 dark:text-rose-500 bg-rose-50 dark:bg-rose-900/20",
    };

    const iconColors = colorMap[color] || colorMap.indigo;

    return (
        <div className="relative group bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl rounded-2xl border border-amber-200/60 dark:border-zinc-800 shadow-[0_8px_30px_rgba(120,80,30,0.04)] dark:shadow-none hover:shadow-[0_12px_40px_rgba(120,80,30,0.08)] dark:hover:shadow-[0_4px_24px_rgba(0,0,0,0.4)] hover:-translate-y-1 hover:border-amber-300 dark:hover:border-zinc-700 transition-all duration-300 p-6 overflow-hidden">
            {/* Subtle glass gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 dark:from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

            <div className="relative z-10 flex items-center justify-between mb-4">
                <div className="flex items-center">
                    <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 tracking-wide">{title}</h3>
                    {tooltipText && (
                        <TooltipProvider delayDuration={100}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Info className="h-3.5 w-3.5 ml-1.5 text-zinc-400 dark:text-zinc-500 hover:text-amber-600 dark:hover:text-amber-400 cursor-help transition-colors" />
                                </TooltipTrigger>
                                <TooltipContent side="top" className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-xs shadow-xl border-none">
                                    <p>{tooltipText}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>
                <div className={`p-2.5 rounded-xl ${iconColors} shadow-sm backdrop-blur-md border border-white/50 dark:border-zinc-700/50`}>
                    {icon}
                </div>
            </div>
            <div className="relative z-10">
                <div className="text-4xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">{value}</div>
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-3 flex items-center">
                    {trend && (
                        <span className={`mr-2 flex items-center font-bold px-2 py-0.5 rounded-md text-xs shadow-sm ${trendUp ? 'text-emerald-700 bg-emerald-100/80 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' : 'text-rose-700 bg-rose-100/80 border border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800'}`}>
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
