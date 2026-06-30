import React from 'react';
import { motion } from 'framer-motion';
import { Check, Clock, ShieldAlert, Package, XCircle } from 'lucide-react';
import { format } from 'date-fns';

const STEPS = [
    { id: 'OPEN', label: 'Ticket Created', icon: Package },
    { id: 'L1_REVIEW', label: 'Verification Processing', icon: Clock },
    { id: 'L2_APPROVAL', label: 'Action Requested', icon: ShieldAlert },
    { id: 'RESOLVED', label: 'Resolved', icon: Check },
    { id: 'CLOSED', label: 'Closed', icon: Check }
];

const SLAProgressBar = ({ currentStatus, timeline = [] }) => {
    // Determine if the ticket was rejected
    const isRejected = currentStatus === 'REJECTED' || currentStatus === 'L1_REVISION';
    
    // Create a modified steps array if rejected
    const displaySteps = isRejected 
        ? [
            { id: 'OPEN', label: 'Ticket Created', icon: Package },
            { id: 'L1_REVIEW', label: 'Verification Processing', icon: Clock },
            { id: currentStatus, label: 'Revision Required', icon: XCircle }
          ]
        : STEPS;

    const currentIndex = displaySteps.findIndex(s => s.id === currentStatus);
    const safeIndex = currentIndex !== -1 ? currentIndex : 0;

    // Helper to find when a step was reached
    const getStepDate = (stepId) => {
        if (!timeline || timeline.length === 0) return null;
        
        if (stepId === 'OPEN') {
            return timeline[timeline.length - 1]?.createdAt; 
        }

        const actionMapping = {
            'L1_REVIEW': 'DOCUMENT_AI_REJECTED',
            'L2_APPROVAL': ['ESCALATED_TO_L2', 'DOCUMENT_AI_VERIFIED'],
            'RESOLVED': 'TICKET_RESOLVED',
            'CLOSED': 'TICKET_CLOSED',
            'REJECTED': 'L1_TICKET_REJECTED',
            'L1_REVISION': 'L1_REVISION_REQUESTED'
        };

        const targetActions = Array.isArray(actionMapping[stepId]) ? actionMapping[stepId] : [actionMapping[stepId]];
        
        const event = timeline.find(t => targetActions.includes(t.action) || (t.details && t.details.newStatus === stepId));
        return event ? (event.createdAt || event.timestamp) : null;
    };

    return (
        <div className="w-full py-4">
            <div className="relative flex justify-between items-center w-full px-8">
                {/* Background Track */}
                <div className="absolute left-8 right-8 top-1/2 h-1 -translate-y-1/2 bg-zinc-100 dark:bg-zinc-800 rounded-full" />
                
                {/* Active Progress Track */}
                <motion.div 
                    className="absolute left-8 top-1/2 h-1 -translate-y-1/2 bg-zinc-900 dark:bg-zinc-100 rounded-full"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: safeIndex / (displaySteps.length - 1) }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    style={{ transformOrigin: "left", width: 'calc(100% - 64px)' }}
                />

                {/* Nodes */}
                {displaySteps.map((step, index) => {
                    const isCompleted = index <= safeIndex;
                    const isActive = index === safeIndex;
                    const dateReached = getStepDate(step.id);
                    const StepIcon = step.icon;

                    let nodeColor = 'bg-white dark:bg-[#131313] border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500';
                    if (isCompleted) {
                        nodeColor = isRejected && isActive 
                            ? 'bg-red-600 dark:bg-red-700 border-red-600 dark:border-red-700 text-white'
                            : 'bg-zinc-900 dark:bg-zinc-100 border-zinc-900 dark:border-zinc-100 text-white dark:text-zinc-900';
                    } else if (isActive && !isRejected) {
                        nodeColor = 'bg-zinc-900 dark:bg-zinc-100 border-zinc-900 dark:border-zinc-100 text-white dark:text-zinc-900 shadow-sm ring-2 ring-zinc-200 dark:ring-zinc-800';
                    }

                    return (
                        <div key={step.id} className="relative z-10 flex flex-col items-center">
                            <motion.div
                                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-colors duration-300 ${nodeColor}`}
                                initial={false}
                                animate={{ scale: isActive ? 1.1 : 1 }}>
                                <StepIcon className="w-4 h-4" />
                            </motion.div>
                            
                            <div className="absolute top-12 text-center w-28 -ml-14 left-1/2">
                                <p className={`text-xs font-semibold ${isCompleted ? (isRejected && isActive ? 'text-red-600 dark:text-red-400' : 'text-zinc-900 dark:text-zinc-100') : 'text-zinc-400 dark:text-zinc-500'}`}>
                                    {step.label}
                                </p>
                                {dateReached && (
                                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                                        {format(new Date(dateReached), 'MMM dd, HH:mm')}
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
            {/* Add bottom padding to account for absolute positioned text */}
            <div className="h-12" />
        </div>
    );
};

export default SLAProgressBar;
