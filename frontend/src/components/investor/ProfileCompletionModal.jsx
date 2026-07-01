import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ProfileCompletionModal = ({ onGoToProfile }) => {
    const { user } = useAuth();

    // If profile is completed or user is not INVESTOR, don't show the modal
    if (user?.role !== 'INVESTOR' || user?.profileCompleted) {
        return null;
    }

    return (
        <Dialog open={true}>
            <DialogContent 
                className="sm:max-w-md bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden"
                onPointerDownOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
                hideCloseButton={true} // In case the primitive supports this
            >
                {/* Custom glow effect */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-kfintech-primary/10 blur-[60px] rounded-full pointer-events-none" />
                
                <DialogHeader className="flex flex-col items-center sm:items-start text-center sm:text-left gap-1 relative z-10">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-900 mb-2">
                        <AlertCircle className="h-6 w-6 text-kfintech-primary dark:text-zinc-50" />
                    </div>
                    <DialogTitle className="text-xl text-zinc-900 dark:text-zinc-50">Complete Your Profile</DialogTitle>
                    <DialogDescription className="text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
                        Welcome to FinnovaX! To ensure platform security and regulatory compliance, you must complete your KYC profile before you can submit or view tickets.
                    </DialogDescription>
                </DialogHeader>
                <div className="mt-6 flex flex-col sm:flex-row justify-end relative z-10">
                    <Button 
                        onClick={onGoToProfile} 
                        className="w-full sm:w-auto bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-zinc-50 dark:text-zinc-900 shadow-lg transition-all"
                    >
                        Go to Profile Settings <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ProfileCompletionModal;
