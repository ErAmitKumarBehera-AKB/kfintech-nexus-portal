import React, { useState } from 'react';
import Sidebar from '../components/common/Sidebar';
import MyTickets from '../components/investor/MyTickets';
import CreateTicketFlow from '../components/investor/CreateTicketFlow';
import TicketDetail from '../components/investor/TicketDetail';

const InvestorDashboard = () => {
    const [activeTab, setActiveTab] = useState('tickets'); // 'tickets' or 'create'
    const [selectedTicketId, setSelectedTicketId] = useState(null);

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
            default:
                return <MyTickets onSelectTicket={setSelectedTicketId} />;
        }
    };

    return (
        <div className="flex h-[calc(100vh-4rem)]">
            <Sidebar activeTab={activeTab} onTabChange={(tab) => {
                setActiveTab(tab);
                setSelectedTicketId(null);
            }} />
            <div className="flex-1 overflow-y-auto bg-kfintech-bg p-6">
                {renderContent()}
            </div>
        </div>
    );
};

export default InvestorDashboard;
