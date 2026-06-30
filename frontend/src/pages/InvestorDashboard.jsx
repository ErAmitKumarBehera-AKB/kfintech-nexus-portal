import React, { useState } from 'react';
import Sidebar from '../components/common/Sidebar';
import MyTickets from '../components/investor/MyTickets';
import CreateTicketFlow from '../components/investor/CreateTicketFlow';
import TicketDetail from '../components/investor/TicketDetail';
import Profile from '../components/investor/Profile';
import ProfileCompletionModal from '../components/investor/ProfileCompletionModal';
import Documents from '../components/investor/Documents';
import NotificationsView from '../components/investor/NotificationsView';
import { useAuth } from '../context/AuthContext';
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import ThemeToggle from '../components/common/ThemeToggle';
import DotBackgroundDemo from "@/components/ui/DotBackgroundDemo";

const InvestorDashboard = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('tickets'); // 'tickets' or 'create'
    const [selectedTicketId, setSelectedTicketId] = useState(null);

    const isProfileIncomplete = user?.role === 'INVESTOR' && !user?.profileCompleted;

    const handleTabChange = (tab) => {
        if (isProfileIncomplete && tab !== 'profile' && tab !== 'documents') {
            return; // Prevent navigating away if incomplete (allow profile and documents)
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
            case 'documents':
                return <Documents />;
            case 'notifications':
                return <NotificationsView />;
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
            
            <SidebarInset className="bg-zinc-50 dark:bg-black min-h-screen flex flex-col transition-colors duration-500 relative overflow-hidden">
                <DotBackgroundDemo />
                <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#131313] px-4 transition-colors duration-500 relative z-10">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="-ml-1 text-zinc-900 dark:text-zinc-100" />
                        <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 mx-2" />
                        <h1 className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
                            {getPageTitle()}
                        </h1>
                    </div>
                    <ThemeToggle />
                </header>
                <main className="flex-1 p-4 md:p-6 overflow-auto relative z-10">
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
