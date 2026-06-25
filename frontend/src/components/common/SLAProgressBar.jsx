import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

const STEPS = ['OPEN', 'L1_REVIEW', 'L2_APPROVAL', 'RESOLVED', 'CLOSED'];

const SLAProgressBar = ({ currentStatus }) => {
    const currentIndex = STEPS.indexOf(currentStatus) !== -1 ? STEPS.indexOf(currentStatus) : 0;

    return (
        <div className="relative pt-8 pb-4">
            {/* Background line */}
            <div className="absolute top-10 left-0 w-full h-1 bg-kfintech-border rounded" />
            
            {/* Progress line */}
            <motion.div 
                className="absolute top-10 left-0 h-1 bg-kfintech-accent rounded origin-left"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: currentIndex / (STEPS.length - 1) }}
                transition={{ duration: 0.5, ease: "easeOut" }}
            />

            <div className="relative z-10 flex justify-between">
                {STEPS.map((step, index) => {
                    const isCompleted = index <= currentIndex;
                    const isActive = index === currentIndex;

                    return (
                        <div key={step} className="flex flex-col items-center">
                            <motion.div
                                className={`w-5 h-5 rounded-full flex items-center justify-center border-2 transition-colors ${
                                    isCompleted 
                                        ? 'bg-kfintech-accent border-kfintech-accent shadow-[0_0_10px_rgba(16,185,129,0.4)]' 
                                        : 'bg-kfintech-bg border-kfintech-border'
                                }`}
                                initial={false}
                                animate={{ scale: isActive ? 1.2 : 1 }}
                            >
                                {isCompleted && <Check className="w-3 h-3 text-white" />}
                            </motion.div>
                            <span className={`text-[10px] mt-2 font-black uppercase tracking-wider ${
                                isActive ? 'text-white' : isCompleted ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                                {step.replace('_', ' ')}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default SLAProgressBar;
