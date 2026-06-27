import React, { useState } from 'react';
import Sidebar from '../components/common/Sidebar';
import MyTickets from '../components/investor/MyTickets';
import CreateTicketFlow from '../components/investor/CreateTicketFlow';
import TicketDetail from '../components/investor/TicketDetail';
import Profile from '../components/investor/Profile';
import ProfileCompletionModal from '../components/investor/ProfileCompletionModal';
import { useAuth } from '../context/AuthContext';
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";

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
                return <CreateTicketFlow onTabChange={handleTabChange} />;
            case 'profile':
                return <Profile />;
            // Notifications and Documents are placeholders for now
            case 'notifications':
                return <div className="flex h-full items-center justify-center text-zinc-500">Notifications coming soon</div>;
            case 'documents':
                return <div className="flex h-full items-center justify-center text-zinc-500">Document upload center coming soon</div>;
            default:
                return <MyTickets onSelectTicket={setSelectedTicketId} />;
        }
    };

    const getPageTitle = () => {
        if (selectedTicketId) return "Ticket Details";
        switch (activeTab) {
            case 'tickets': return "My Tickets";
            case 'create': return "Create Ticket";
            case 'profile': return "Profile & KYC";
            case 'notifications': return "Notifications";
            case 'documents': return "Documents";
            default: return "Dashboard";
        }
    };

    return (
        <SidebarProvider>
            <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />
            
            <SidebarInset className="bg-zinc-50 min-h-screen flex flex-col">
                <header className="flex h-14 shrink-0 items-center gap-2 border-b border-zinc-200 bg-white px-4">
                    <SidebarTrigger className="-ml-1" />
                    <div className="w-px h-4 bg-zinc-200 mx-2" />
                    <h1 className="font-medium text-sm text-zinc-900">
                        {getPageTitle()}
                    </h1>
                </header>
                <main className="flex-1 p-4 md:p-6 overflow-auto">
                    {isProfileIncomplete && activeTab !== 'profile' && (
                        <ProfileCompletionModal onGoToProfile={() => handleTabChange('profile')} />
                    )}
                    {renderContent()}
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
};

export default InvestorDashboard;
