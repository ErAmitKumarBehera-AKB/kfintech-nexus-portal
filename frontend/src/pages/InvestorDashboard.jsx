import React, { useState } from 'react';
import Sidebar from '../components/common/Sidebar';
import MyTickets from '../components/investor/MyTickets';
import CreateTicketFlow from '../components/investor/CreateTicketFlow';
import TicketDetail from '../components/investor/TicketDetail';
import Profile from '../components/investor/Profile';
import ProfileCompletionModal from '../components/investor/ProfileCompletionModal';
import { useAuth } from '../context/AuthContext';

const InvestorDashboard = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('tickets'); // 'tickets' or 'create'
    const [selectedTicketId, setSelectedTicketId] = useState(null);

    const isProfileIncomplete = user?.role === 'INVESTOR' && !user?.profileCompleted;

    const handleTabChange = (tab) => {
        if (isProfileIncomplete && tab !== 'profile') {
            return; // Prevent navigating away if incomplete
        }
        setActiveTab(tab);
        setSelectedTicketId(null);
    };

    const renderContent = () => {
        if (selectedTicketId) {
            return (
                <TicketDetail 
                    ticketId={selectedTicketId} 
                    onBack={() => setSelectedTicketId(null)} 
                />
            );
        }

        switch (activeTab) {
            case 'tickets':
                return <MyTickets onSelectTicket={setSelectedTicketId} />;
            case 'create':
                return <CreateTicketFlow />;
            case 'profile':
                return <Profile />;
            default:
                return <MyTickets onSelectTicket={setSelectedTicketId} />;
        }
    };

    return (
        <div>
            {isProfileIncomplete && activeTab !== 'profile' && (
                <ProfileCompletionModal onGoToProfile={() => handleTabChange('profile')} />
            )}
            
            <div>
                <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />
                <div>
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default InvestorDashboard;
