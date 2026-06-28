import React from 'react';

const StatusBadge = ({ status }) => {
    
    // Smooth pastel color mapping
    const getBadgeStyle = () => {
        switch(status) {
            case 'OPEN':
                return 'bg-blue-100 text-blue-700 border-blue-200 shadow-sm';
            case 'IN_PROGRESS':
            case 'L1_REVIEW':
                return 'bg-amber-100 text-amber-700 border-amber-200 shadow-sm';
            case 'L2_APPROVAL':
                return 'bg-purple-100 text-purple-700 border-purple-200 shadow-sm';
            case 'RESOLVED':
                return 'bg-emerald-100 text-emerald-700 border-emerald-200 shadow-sm';
            case 'REJECTED':
            case 'CRITICAL':
            case 'FRAUD_RISK':
            case 'SLA_BREACH':
                return 'bg-rose-100 text-rose-700 border-rose-200 shadow-sm';
            case 'HIGH':
                return 'bg-orange-100 text-orange-700 border-orange-200 shadow-sm';
            default:
                return 'bg-zinc-100 text-zinc-700 border-zinc-200 shadow-sm';
        }
    };
    
    return (
        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border backdrop-blur-sm ${getBadgeStyle()}`}>
            {status.replace(/_/g, ' ')}
        </span>
    );
};

export default StatusBadge;
