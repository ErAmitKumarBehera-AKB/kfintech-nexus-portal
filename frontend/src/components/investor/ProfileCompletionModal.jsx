import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const ProfileCompletionModal = ({ onGoToProfile }) => {
    const { user } = useAuth();

    // If profile is completed or user is not INVESTOR, don't show the modal
    if (user?.role !== 'INVESTOR' || user?.profileCompleted) {
        return null;
    }

    return (
        <div className="mb-6">
            <Card className="border-amber-200 bg-amber-50 shadow-sm">
                <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="flex gap-3 items-start sm:items-center">
                        <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
                        <div>
                            <h3 className="text-sm font-semibold text-amber-800">Complete Your Profile</h3>
                            <p className="text-sm text-amber-700 mt-1">
                                Welcome to Nexus Portal! To ensure platform security and regulatory compliance, you must complete your KYC profile and upload your Identity Documents before accessing the dashboard.
                            </p>
                        </div>
                    </div>
                    <Button 
                        onClick={onGoToProfile} 
                        size="sm" 
                        className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white w-full sm:w-auto"
                    >
                        Go to Profile Settings <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};

export default ProfileCompletionModal;
