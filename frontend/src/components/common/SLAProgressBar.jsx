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
        
        // Find the most recent timeline event that transitioned to this state
        // For OPEN, it's usually the first 'TICKET_CREATED' event
        if (stepId === 'OPEN') {
            const first = timeline[timeline.length - 1]; // Oldest is at end or beginning depending on sort
            // Assuming timeline is sorted newest first as per most DB queries
            return timeline[timeline.length - 1]?.createdAt; 
        }

        // Map status IDs to possible timeline actions
        const actionMapping = {
            'L1_REVIEW': 'DOCUMENT_AI_REJECTED', // Or just look for nearest chronologically
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
        <div>
            <div>
                {/* Background Track */}
                <div  />
                
                {/* Active Progress Track */}
                <motion.div 
                    
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: safeIndex / (displaySteps.length - 1) }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    style={{ width: 'calc(100% - 64px)' }}
                />

                {/* Nodes */}
                {displaySteps.map((step, index) => {
                    const isCompleted = index <= safeIndex;
                    const isActive = index === safeIndex;
                    const dateReached = getStepDate(step.id);
                    const StepIcon = step.icon;

                    let nodeColor = 'bg-kfintech-bg border-white/20 text-gray-500';
                    if (isCompleted) {
                        nodeColor = isRejected && isActive 
                            ? 'bg-red-500 border-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                            : 'bg-emerald-500 border-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]';
                    } else if (isActive && !isRejected) {
                        nodeColor = 'bg-blue-500 border-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]';
                    }

                    return (
                        <div key={step.id}>
                            <motion.div
                                
                                initial={false}
                                animate={{ scale: isActive ? 1.2 : 1 }}>
                                <StepIcon  />
                            </motion.div>
                            
                            <div>
                                <p>
                                    {step.label}
                                </p>
                                {dateReached && (
                                    <p>
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
