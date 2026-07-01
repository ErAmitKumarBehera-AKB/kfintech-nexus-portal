import React from 'react';
import StatCard from './StatCard';
import { FileText, Users, AlertTriangle, XCircle } from 'lucide-react';

const StatsGrid = ({ metrics }) => {
    if (!metrics) return null;
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
                title="Total Tickets" 
                value={metrics.totalTickets} 
                icon={<FileText className="h-5 w-5" />} 
                color="indigo"
                tooltipText="The total volume of tickets currently tracked in the system."
            />
            <StatCard 
                title="Active Investors" 
                value={metrics.totalInvestors} 
                icon={<Users className="h-5 w-5" />} 
                color="emerald"
                tooltipText="Number of unique investors who have interacted or submitted a ticket."
            />
            <StatCard 
                title="SLA Breaches" 
                value={metrics.slaBreachedTickets || 0} 
                icon={<AlertTriangle className="h-5 w-5" />} 
                color="amber"
                tooltipText="Tickets that exceeded their target resolution timeframe."
            />
            <StatCard 
                title="Rejection Rate" 
                value={`${metrics.rejectionRate?.toFixed(1) || 0}%`} 
                icon={<XCircle className="h-5 w-5" />} 
                color="rose"
                tooltipText="Percentage of tickets marked as 'Rejected' by L1 or L2 admins."
            />
        </div>
    );
};

export default StatsGrid;
