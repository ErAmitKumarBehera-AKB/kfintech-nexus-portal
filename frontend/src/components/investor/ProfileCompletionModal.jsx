import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { AlertCircle, ArrowRight } from 'lucide-react';

const ProfileCompletionModal = ({ onGoToProfile }) => {
    const { user } = useAuth();

    // If profile is completed or user is not INVESTOR, don't show the modal
    if (user?.role !== 'INVESTOR' || user?.profileCompleted) {
        return null;
    }

    return (
        <div>
            <div>
                <div>
                    <AlertCircle  />
                </div>
                <h2>Complete Your Profile</h2>
                <p>
                    Welcome to Nexus Portal! To ensure platform security and regulatory compliance, you must complete your KYC profile and upload your Identity Documents before accessing the dashboard.
                </p>
                <button
                    onClick={onGoToProfile}>
                    Go to Profile Settings <ArrowRight  />
                </button>
            </div>
        </div>
    );
};

export default ProfileCompletionModal;
