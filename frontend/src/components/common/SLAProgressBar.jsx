import React from 'react';
import { motion } from 'framer-motion';
import { Check, Clock, ShieldAlert, Package, XCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

const BASE_STEPS = {
    'OPEN': { id: 'OPEN', label: 'Ticket Created', icon: Package },
    'L1_REVIEW': { id: 'L1_REVIEW', label: 'Verification Processing', icon: Clock },
    'L2_APPROVAL': { id: 'L2_APPROVAL', label: 'Action Requested', icon: ShieldAlert },
    'RESOLVED': { id: 'RESOLVED', label: 'Resolved', icon: Check },
    'CLOSED': { id: 'CLOSED', label: 'Closed', icon: Check },
    'REJECTED': { id: 'REJECTED', label: 'Rejected', icon: XCircle },
    'CANCELLED': { id: 'CANCELLED', label: 'Cancelled', icon: XCircle },
    'ESCALATED': { id: 'ESCALATED', label: 'Escalated', icon: AlertCircle },
};

const SLAProgressBar = ({ currentStatus, timeline = [] }) => {
    // 1. Determine the actual path taken by reading the timeline
    let actualPath = ['OPEN']; // Always starts with OPEN

    // Sort timeline chronologically
    const sortedTimeline = [...timeline].sort((a, b) => new Date(a.createdAt || a.timestamp) - new Date(b.createdAt || b.timestamp));

    // Map actions to status milestones
    for (const event of sortedTimeline) {
        const action = event.action;
        const newStatus = event.details?.newStatus;

        if (newStatus && BASE_STEPS[newStatus] && actualPath[actualPath.length - 1] !== newStatus) {
            actualPath.push(newStatus);
        } else {
            // Infer from known actions if newStatus is not explicitly set
            if (action === 'ESCALATED_TO_L2' && actualPath[actualPath.length - 1] !== 'L2_APPROVAL') {
                actualPath.push('L2_APPROVAL');
            } else if (action === 'TICKET_RESOLVED' && actualPath[actualPath.length - 1] !== 'RESOLVED') {
                actualPath.push('RESOLVED');
            } else if ((action === 'L1_TICKET_REJECTED' || action === 'L2_TICKET_REJECTED') && actualPath[actualPath.length - 1] !== 'REJECTED') {
                actualPath.push('REJECTED');
            } else if (action === 'L2_RETURNED_TO_L1' && actualPath[actualPath.length - 1] !== 'L1_REVIEW') {
                // If returned to L1, append L1_REVIEW again to show the loop
                actualPath.push('L1_REVIEW');
            }
        }
    }

    // 2. If it hasn't finished, predict the rest of the happy path for visualization
    let displaySteps = [];
    let isTerminated = false;

    // Build the dynamic display steps
    for (const statusId of actualPath) {
        displaySteps.push(BASE_STEPS[statusId]);
        if (['RESOLVED', 'CLOSED', 'REJECTED', 'CANCELLED'].includes(statusId)) {
            isTerminated = true;
        }
    }

    // If not terminated, add the standard remaining steps
    if (!isTerminated) {
        const standardPath = ['OPEN', 'L1_REVIEW', 'L2_APPROVAL', 'RESOLVED', 'CLOSED'];
        const lastStep = actualPath[actualPath.length - 1];
        const lastIndexInStandard = standardPath.indexOf(lastStep);
        
        if (lastIndexInStandard !== -1) {
            for (let i = lastIndexInStandard + 1; i < standardPath.length; i++) {
                // Only add RESOLVED as the final visual target for now, CLOSED happens later
                if (standardPath[i] === 'CLOSED') continue;
                displaySteps.push(BASE_STEPS[standardPath[i]]);
            }
        }
    }

    // Edge case: if we have duplicates (like loop back to L1), add a suffix so React keys don't clash
    const uniqueDisplaySteps = displaySteps.map((step, index) => ({
        ...step,
        uniqueId: `${step.id}_${index}`
    }));

    // Find current active index (usually the last index of the actual path)
    const currentIndex = actualPath.length - 1;

    // Helper to find when a step was reached
    const getStepDate = (indexInPath) => {
        if (!timeline || timeline.length === 0) return null;
        if (indexInPath === 0) return timeline[0]?.createdAt || timeline[0]?.timestamp;
        
        // This is simplified: in reality we'd map exact events to these transitions.
        // For now, if it's in actualPath, we just take the Nth milestone event roughly.
        // A better way is finding the event that triggered this status in the sorted timeline.
        const statusId = actualPath[indexInPath];
        const event = sortedTimeline.find(t => 
            (t.details && t.details.newStatus === statusId) ||
            (statusId === 'L2_APPROVAL' && t.action === 'ESCALATED_TO_L2') ||
            (statusId === 'RESOLVED' && t.action === 'TICKET_RESOLVED') ||
            (statusId === 'REJECTED' && (t.action === 'L1_TICKET_REJECTED' || t.action === 'L2_TICKET_REJECTED')) ||
            (statusId === 'L1_REVIEW' && t.action === 'L2_RETURNED_TO_L1' && sortedTimeline.indexOf(t) > 0)
        );
        
        return event ? (event.createdAt || event.timestamp) : null;
    };

    return (
        <div className="w-full py-4 overflow-x-auto custom-scrollbar">
            <div className="relative flex justify-between items-center w-full min-w-[500px] px-8">
                {/* Background Track */}
                <div className="absolute left-8 right-8 top-1/2 h-1 -translate-y-1/2 bg-zinc-100 dark:bg-zinc-800 rounded-full" />
                
                {/* Active Progress Track */}
                <motion.div 
                    className={`absolute left-8 top-1/2 h-1 -translate-y-1/2 ${isTerminated && currentStatus !== 'RESOLVED' && currentStatus !== 'CLOSED' ? 'bg-red-500' : 'bg-zinc-900 dark:bg-zinc-100'} rounded-full`}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: currentIndex / (uniqueDisplaySteps.length - 1 || 1) }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    style={{ transformOrigin: "left", width: 'calc(100% - 64px)' }}
                />

                {/* Nodes */}
                {uniqueDisplaySteps.map((step, index) => {
                    const isCompleted = index <= currentIndex;
                    const isActive = index === currentIndex;
                    const dateReached = isCompleted ? getStepDate(index) : null;
                    const StepIcon = step.icon;
                    const isFailureNode = ['REJECTED', 'CANCELLED'].includes(step.id);

                    let nodeColor = 'bg-white dark:bg-[#131313] border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500';
                    
                    if (isCompleted) {
                        if (isFailureNode) {
                            nodeColor = 'bg-red-600 dark:bg-red-700 border-red-600 dark:border-red-700 text-white';
                        } else {
                            nodeColor = 'bg-zinc-900 dark:bg-zinc-100 border-zinc-900 dark:border-zinc-100 text-white dark:text-zinc-900';
                        }
                    } else if (isActive && !isFailureNode) {
                        nodeColor = 'bg-zinc-900 dark:bg-zinc-100 border-zinc-900 dark:border-zinc-100 text-white dark:text-zinc-900 shadow-sm ring-2 ring-zinc-200 dark:ring-zinc-800';
                    }

                    return (
                        <div key={step.uniqueId} className="relative z-10 flex flex-col items-center">
                            <motion.div
                                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-colors duration-300 ${nodeColor}`}
                                initial={false}
                                animate={{ scale: isActive ? 1.1 : 1 }}>
                                <StepIcon className="w-4 h-4" />
                            </motion.div>
                            
                            <div className="absolute top-12 text-center w-28 -ml-14 left-1/2">
                                <p className={`text-xs font-semibold ${isCompleted ? (isFailureNode ? 'text-red-600 dark:text-red-400' : 'text-zinc-900 dark:text-zinc-100') : 'text-zinc-400 dark:text-zinc-500'}`}>
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
        </div>
    );
};

export default SLAProgressBar;
