import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import DashboardHeader from '../components/admin/DashboardHeader';
import DashboardToolbar from '../components/admin/DashboardToolbar';
import StatsGrid from '../components/admin/StatsGrid';
import PipelineChart from '../components/admin/PipelineChart';
import SLAChart from '../components/admin/SLAChart';
import AgentLeaderboard from '../components/admin/AgentLeaderboard';
import RecentActivity from '../components/admin/RecentActivity';
import RecentTickets from '../components/admin/RecentTickets';
import TicketTable from '../components/admin/TicketTable';
import UserTable from '../components/admin/UserTable';
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Loader2 } from 'lucide-react';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [metrics, setMetrics] = useState(null);
    const [usersList, setUsersList] = useState([]);
    const [ticketsList, setTicketsList] = useState([]);
    const [flaggedList, setFlaggedList] = useState([]);
    const [activitiesList, setActivitiesList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 15;
    const [dateRange, setDateRange] = useState('ALL');
    const [ticketStatus, setTicketStatus] = useState('ALL');
    const [ticketPriority, setTicketPriority] = useState('ALL');
    const [userRole, setUserRole] = useState('ALL');

    useEffect(() => { setPage(1); }, [activeTab, dateRange, ticketStatus, ticketPriority, userRole]);
    useEffect(() => { fetchData(); }, [activeTab, page, dateRange, ticketStatus, ticketPriority, userRole]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'overview') {
                const [metricsRes, ticketsRes, agentsRes] = await Promise.all([
                    apiClient.get('/admin/metrics'),
                    apiClient.get(`/admin/tickets?page=1&limit=10&status=ALL&priority=ALL&dateRange=${dateRange}`),
                    apiClient.get(`/admin/agents/activities?page=1&limit=10`)
                ]);
                setMetrics(metricsRes.data);
                setTicketsList(ticketsRes.data.tickets);
                setActivitiesList(agentsRes.data.activities);
            } else if (activeTab === 'tickets') {
                const res = await apiClient.get(`/admin/tickets?page=${page}&limit=${limit}&status=${ticketStatus}&priority=${ticketPriority}&dateRange=${dateRange}`);
                setTicketsList(res.data.tickets);
                setTotalPages(res.data.pagination.totalPages);
            } else if (activeTab === 'users') {
                const res = await apiClient.get(`/admin/users?page=${page}&limit=${limit}&role=${userRole}`);
                setUsersList(res.data.users);
                setTotalPages(res.data.pagination.totalPages);
            } else if (activeTab === 'agents') {
                const res = await apiClient.get(`/admin/agents/activities?page=${page}&limit=${limit}`);
                setActivitiesList(res.data.activities);
                setTotalPages(res.data.pagination.totalPages);
            } else if (activeTab === 'flagged') {
                const res = await apiClient.get('/admin/tickets/flagged');
                setFlaggedList(res.data.tickets);
                setTotalPages(1);
            }
        } catch (error) {
            console.error("Fetch error", error);
        } finally {
            setLoading(false);
        }
    };

    const handleExportCsv = () => {
        let dataToExport = [];
        let headers = [];

        if (activeTab === 'tickets' || activeTab === 'flagged') {
            let list = activeTab === 'tickets' ? ticketsList : flaggedList;
            
            // Apply local filters for flagged tab since the API returns all flagged
            if (activeTab === 'flagged') {
                if (ticketStatus !== 'ALL') {
                    list = list.filter(t => t.status === ticketStatus);
                }
                if (ticketPriority !== 'ALL') {
                    list = list.filter(t => t.assignedPriority === ticketPriority);
                }
            }

            headers = ['Ticket ID', 'Investor Name', 'Service Type', 'Status', 'Priority', 'Fraud Flag', 'Created At'];
            dataToExport = list.map(t => [
                t.ticketId || t._id,
                `"${t.investorName || ''}"`,
                t.serviceType || '',
                t.status || '',
                t.assignedPriority || '',
                t.isPotentialFraud ? 'YES' : 'NO',
                new Date(t.createdAt).toLocaleString()
            ]);
        } else if (activeTab === 'users') {
            headers = ['User ID', 'Name', 'Email', 'Role', 'Status', 'Created At'];
            dataToExport = usersList.map(u => [
                u._id,
                `"${u.name || ''}"`,
                u.email || '',
                u.role || '',
                u.isActive ? 'ACTIVE' : 'INACTIVE',
                new Date(u.createdAt).toLocaleString()
            ]);
        } else if (activeTab === 'agents') {
            headers = ['Log ID', 'Agent Name', 'Role', 'Action', 'Entity Type', 'Date'];
            dataToExport = activitiesList.map(a => [
                a._id,
                `"${a.performedBy?.name || 'System'}"`,
                a.performedBy?.role || '',
                a.action || '',
                a.entityType || '',
                new Date(a.createdAt).toLocaleString()
            ]);
        }

        if (dataToExport.length === 0) return;

        const csvContent = [headers.join(','), ...dataToExport.map(row => row.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `nexus_${activeTab}_export.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleToggleUserStatus = async (userId, currentStatus) => {
        try {
            await apiClient.put(`/admin/users/${userId}/status`, { isActive: !currentStatus });
            fetchData();
        } catch (error) {
            console.error("Toggle user failed", error);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/50 pb-20 font-sans text-zinc-950 selection:bg-indigo-100 selection:text-indigo-900 relative">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col">
                <DashboardToolbar 
                    activeTab={activeTab} 
                    setDateRange={setDateRange} 
                    setTicketStatus={setTicketStatus}
                    setTicketPriority={setTicketPriority}
                    setUserRole={setUserRole}
                    handleExportCsv={handleExportCsv} 
                    fetchData={fetchData} 
                    loading={loading} 
                />

                <div className="w-full px-4 sm:px-8 xl:px-12 py-8">
                    {loading && (!metrics && !ticketsList.length) ? (
                        <div className="flex justify-center items-center py-32 text-zinc-400">
                            <Loader2 className="h-6 w-6 animate-spin mr-2" /> Syncing...
                        </div>
                    ) : (
                        <div className="animate-in fade-in duration-300">
                            <TabsContent value="overview" className="m-0 space-y-8">
                                <StatsGrid metrics={metrics} />
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                    <div className="col-span-1 md:col-span-8"><PipelineChart statusData={metrics?.statusData} /></div>
                                    <div className="col-span-1 md:col-span-4"><SLAChart totalTickets={metrics?.totalTickets} slaBreachedTickets={metrics?.slaBreachedTickets} /></div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                    <div className="col-span-1 md:col-span-6"><AgentLeaderboard agentPerformance={metrics?.agentPerformance} /></div>
                                    <div className="col-span-1 md:col-span-6"><RecentActivity activitiesList={activitiesList} /></div>
                                </div>
                                <RecentTickets ticketsList={ticketsList} setActiveTab={setActiveTab} />
                            </TabsContent>
                            
                            <TabsContent value="tickets" className="m-0 min-h-[500px]">
                                <TicketTable data={ticketsList} activeTab="tickets" page={page} totalPages={totalPages} setPage={setPage} />
                            </TabsContent>
                            
                            <TabsContent value="users" className="m-0 min-h-[500px]">
                                <UserTable data={usersList} page={page} totalPages={totalPages} setPage={setPage} handleToggleUserStatus={handleToggleUserStatus} />
                            </TabsContent>
                            
                            <TabsContent value="flagged" className="m-0 min-h-[500px]">
                                <TicketTable 
                                    data={flaggedList.filter(t => 
                                        (ticketStatus === 'ALL' || t.status === ticketStatus) &&
                                        (ticketPriority === 'ALL' || t.assignedPriority === ticketPriority)
                                    )} 
                                    activeTab="flagged" 
                                    page={page} 
                                    totalPages={totalPages} 
                                    setPage={setPage} 
                                />
                            </TabsContent>

                            <TabsContent value="agents" className="m-0 min-h-[500px]">
                                <div className="max-w-4xl mx-auto"><RecentActivity activitiesList={activitiesList} /></div>
                            </TabsContent>
                        </div>
                    )}
                </div>
            </Tabs>
        </div>
    );
};

export default AdminDashboard;
