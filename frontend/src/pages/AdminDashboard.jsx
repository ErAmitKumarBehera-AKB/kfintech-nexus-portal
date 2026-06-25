import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Users, Activity, FileText, AlertTriangle, CheckCircle2, Clock, XCircle, Search, Download, ChevronLeft, ChevronRight, Power } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { format } from 'date-fns';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];
const STATUS_COLORS = {
    'OPEN': '#3b82f6',
    'IN_PROGRESS': '#f59e0b',
    'L1_REVIEW': '#8b5cf6',
    'L2_APPROVAL': '#ec4899',
    'RESOLVED': '#10b981',
    'REJECTED': '#ef4444'
};

const StatCard = ({ icon, label, value, subtext, color, glow }) => (
    <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel rounded-2xl p-6 border border-kfintech-border flex items-start gap-4"
        style={{ boxShadow: glow }}
    >
        <div className={`p-3 rounded-xl ${color} border`}>
            {icon}
        </div>
        <div>
            <p className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-3xl font-black text-white">{value}</p>
            {subtext && <p className="text-xs font-medium text-gray-500 mt-2">{subtext}</p>}
        </div>
    </motion.div>
);

const AdminDashboard = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('METRICS');
    
    // Data states
    const [metrics, setMetrics] = useState(null);
    const [usersList, setUsersList] = useState([]);
    const [ticketsList, setTicketsList] = useState([]);
    const [flaggedList, setFlaggedList] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters and Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 20;

    const [dateRange, setDateRange] = useState('ALL');
    const [userRole, setUserRole] = useState('ALL');
    const [ticketStatus, setTicketStatus] = useState('ALL');
    const [ticketPriority, setTicketPriority] = useState('ALL');

    useEffect(() => {
        setPage(1); // Reset page on tab change or filter change
    }, [activeTab, dateRange, userRole, ticketStatus, ticketPriority]);

    useEffect(() => {
        fetchData();
    }, [activeTab, page, dateRange, userRole, ticketStatus, ticketPriority]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'METRICS') {
                const res = await apiClient.get('/admin/metrics');
                setMetrics(res.data);
            } else if (activeTab === 'USERS') {
                const res = await apiClient.get(`/admin/users?page=${page}&limit=${limit}&role=${userRole}`);
                setUsersList(res.data.users);
                setTotalPages(res.data.pagination.totalPages);
            } else if (activeTab === 'TICKETS') {
                const res = await apiClient.get(`/admin/tickets?page=${page}&limit=${limit}&status=${ticketStatus}&priority=${ticketPriority}&dateRange=${dateRange}`);
                setTicketsList(res.data.tickets);
                setTotalPages(res.data.pagination.totalPages);
            } else if (activeTab === 'FLAGGED') {
                // Flagged doesn't currently support generic pagination in backend, but let's assume it does or we just fetch it
                const res = await apiClient.get('/admin/tickets/flagged');
                setFlaggedList(res.data.tickets);
                setTotalPages(1);
            }
        } catch (error) {
            console.error("Error fetching admin data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleExportCsv = async () => {
        try {
            const res = await apiClient.get(`/admin/reports/export?dateRange=${dateRange}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `nexus_reports_${dateRange}.csv`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (error) {
            console.error("Export failed", error);
        }
    };

    const handleToggleUserStatus = async (userId, currentStatus) => {
        try {
            await apiClient.put(`/admin/users/${userId}/status`, { isActive: !currentStatus });
            // Refresh users
            fetchData();
        } catch (error) {
            console.error("Failed to toggle user status", error);
        }
    };

    const tabs = [
        { id: 'METRICS', label: 'System Metrics', icon: <Activity className="w-4 h-4" /> },
        { id: 'USERS', label: 'User Management', icon: <Users className="w-4 h-4" /> },
        { id: 'TICKETS', label: 'All Tickets', icon: <FileText className="w-4 h-4" /> },
        { id: 'FLAGGED', label: 'Flagged / Escalated', icon: <AlertTriangle className="w-4 h-4" /> }
    ];

    const maskData = (str, type) => {
        if(!str) return 'N/A';
        if(type === 'email') return str.replace(/(.{2})(.*)(?=@)/, (gp1, gp2, gp3) => gp2 + '*'.repeat(gp3.length));
        if(type === 'phone') return str.slice(0, -4).replace(/./g, '*') + str.slice(-4);
        return str;
    };

    // Pagination Component
    const Pagination = () => (
        <div className="flex justify-between items-center px-6 py-4 border-t border-kfintech-border/50 bg-kfintech-card/30">
            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Page {page} of {totalPages || 1}</span>
            <div className="flex gap-2">
                <button 
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed border border-white/10 transition-colors text-gray-400"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <button 
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed border border-white/10 transition-colors text-gray-400"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );

    // Tab Renderers
    const renderMetrics = () => {
        if (!metrics) return null;
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard 
                        icon={<FileText className="w-6 h-6 text-blue-400" />}
                        label="Total Tickets" value={metrics.totalTickets}
                        color="bg-blue-500/10 border-blue-500/30" glow="0 0 20px rgba(59,130,246,0.08)"
                    />
                    <StatCard 
                        icon={<Users className="w-6 h-6 text-emerald-400" />}
                        label="Total Investors" value={metrics.totalInvestors}
                        color="bg-emerald-500/10 border-emerald-500/30" glow="0 0 20px rgba(16,185,129,0.08)"
                    />
                    <StatCard 
                        icon={<AlertTriangle className="w-6 h-6 text-orange-400" />}
                        label="SLA Breached" value={metrics.slaBreachedTickets || 0}
                        subtext="Tickets past deadline"
                        color="bg-orange-500/10 border-orange-500/30" glow="0 0 20px rgba(245,158,11,0.08)"
                    />
                    <StatCard 
                        icon={<XCircle className="w-6 h-6 text-red-400" />}
                        label="Rejection Rate" value={`${metrics.rejectionRate.toFixed(1)}%`}
                        color="bg-red-500/10 border-red-500/30" glow="0 0 20px rgba(239,68,68,0.08)"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="glass-panel p-6 rounded-2xl border border-kfintech-border h-80 flex flex-col">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Service Type Breakdown</h3>
                        <div className="flex-1">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={metrics.serviceTypeData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                        {metrics.serviceTypeData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip contentStyle={{ backgroundColor: '#0A0A0B', borderColor: '#2E2E33', borderRadius: '12px' }} itemStyle={{ color: '#fff' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="glass-panel p-6 rounded-2xl border border-kfintech-border h-80 flex flex-col">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Tickets by Status</h3>
                        <div className="flex-1">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={metrics.statusData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#2E2E33" vertical={false} />
                                    <XAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <RechartsTooltip cursor={{ fill: '#1E1E24' }} contentStyle={{ backgroundColor: '#0A0A0B', borderColor: '#2E2E33', borderRadius: '12px' }} />
                                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                        {metrics.statusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#6B7280'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderUsers = () => (
        <div className="glass-panel rounded-2xl border border-kfintech-border overflow-hidden flex flex-col">
            <div className="p-4 border-b border-kfintech-border/50 bg-kfintech-card/50 flex flex-col md:flex-row justify-between items-center gap-4">
                <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-emerald-400" /> User Directory
                </h2>
                <div className="flex gap-2">
                    <select 
                        value={userRole} 
                        onChange={(e) => setUserRole(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-kfintech-primary"
                    >
                        <option value="ALL">All Roles</option>
                        <option value="INVESTOR">Investors</option>
                        <option value="ADMIN_L1">L1 Admins</option>
                        <option value="ADMIN_L2">L2 Admins</option>
                        <option value="ADMIN_SUPER">Super Admins</option>
                    </select>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-kfintech-card/80 text-gray-400 text-xs uppercase tracking-wider">
                        <tr>
                            <th className="px-6 py-4 font-bold">Name</th>
                            <th className="px-6 py-4 font-bold">Email</th>
                            <th className="px-6 py-4 font-bold">Role</th>
                            <th className="px-6 py-4 font-bold">Status</th>
                            <th className="px-6 py-4 font-bold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-kfintech-border/40">
                        {usersList.map(u => (
                            <tr key={u._id} className="hover:bg-kfintech-card/30 transition-colors">
                                <td className="px-6 py-4 font-bold text-white">{u.name}</td>
                                <td className="px-6 py-4 text-gray-400">{maskData(u.email, 'email')}</td>
                                <td className="px-6 py-4">
                                    <span className="px-2.5 py-1 text-xs font-bold rounded-lg border bg-kfintech-card border-kfintech-border text-blue-400">
                                        {u.role.replace('ADMIN_', '')}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${u.isActive ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                                        {u.isActive ? 'ACTIVE' : 'INACTIVE'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button 
                                        onClick={() => handleToggleUserStatus(u._id, u.isActive)}
                                        className={`p-1.5 rounded-lg border transition-colors ${
                                            u.isActive 
                                                ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30' 
                                                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                        }`}
                                        title={u.isActive ? "Deactivate User" : "Activate User"}
                                    >
                                        <Power className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <Pagination />
        </div>
    );

    const renderTickets = (data) => (
        <div className="glass-panel rounded-2xl border border-kfintech-border overflow-hidden flex flex-col">
            <div className="p-4 border-b border-kfintech-border/50 bg-kfintech-card/50 flex flex-col md:flex-row justify-between items-center gap-4">
                <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-400" /> {activeTab === 'FLAGGED' ? 'Flagged Tickets' : 'Ticket Queue'}
                </h2>
                <div className="flex flex-wrap gap-2">
                    {activeTab === 'TICKETS' && (
                        <>
                            <select 
                                value={ticketStatus} 
                                onChange={(e) => setTicketStatus(e.target.value)}
                                className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-kfintech-primary"
                            >
                                <option value="ALL">All Statuses</option>
                                <option value="OPEN">Open</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="RESOLVED">Resolved</option>
                            </select>
                            <select 
                                value={dateRange} 
                                onChange={(e) => setDateRange(e.target.value)}
                                className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-kfintech-primary"
                            >
                                <option value="ALL">All Time</option>
                                <option value="7d">Last 7 Days</option>
                                <option value="30d">Last 30 Days</option>
                            </select>
                        </>
                    )}
                    <button 
                        onClick={handleExportCsv}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 transition-colors text-xs font-bold text-blue-400"
                    >
                        <Download className="w-4 h-4" /> Export CSV
                    </button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-kfintech-card/80 text-gray-400 text-xs uppercase tracking-wider">
                        <tr>
                            <th className="px-6 py-4 font-bold">Investor</th>
                            <th className="px-6 py-4 font-bold">Service Type</th>
                            <th className="px-6 py-4 font-bold">Status</th>
                            <th className="px-6 py-4 font-bold">Priority</th>
                            <th className="px-6 py-4 font-bold text-right">Created</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-kfintech-border/40">
                        {data.map(t => (
                            <tr key={t._id} className="hover:bg-kfintech-card/30 transition-colors">
                                <td className="px-6 py-4 font-bold text-white">
                                    {t.investorName}
                                    {t.isPotentialFraud && <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded border border-red-500/30">FRAUD_FLAG</span>}
                                    {t.slaTimeline?.isBreached && <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-orange-500/20 text-orange-400 rounded border border-orange-500/30">SLA_BREACH</span>}
                                </td>
                                <td className="px-6 py-4 text-gray-400 text-xs font-bold tracking-wide">{t.serviceType?.replace(/_/g, ' ')}</td>
                                <td className="px-6 py-4">
                                    <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg border" style={{
                                        borderColor: STATUS_COLORS[t.status] ? `${STATUS_COLORS[t.status]}40` : '#4B5563',
                                        color: STATUS_COLORS[t.status] || '#9CA3AF',
                                        backgroundColor: STATUS_COLORS[t.status] ? `${STATUS_COLORS[t.status]}10` : 'transparent'
                                    }}>
                                        {t.status.replace('_', ' ')}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 text-[10px] font-black uppercase rounded ${
                                        t.assignedPriority === 'CRITICAL' ? 'bg-red-500/20 text-red-400' :
                                        t.assignedPriority === 'HIGH' ? 'bg-amber-500/20 text-amber-400' : 'text-gray-500'
                                    }`}>
                                        {t.assignedPriority}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right text-gray-500 text-xs font-mono">
                                    {format(new Date(t.createdAt), 'MMM dd, yyyy HH:mm')}
                                </td>
                            </tr>
                        ))}
                        {data.length === 0 && (
                            <tr>
                                <td colSpan="5" className="px-6 py-10 text-center text-gray-500 font-medium">No tickets found in this view.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {activeTab === 'TICKETS' && <Pagination />}
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="p-8 max-w-7xl mx-auto"
        >
            <header className="mb-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                        <ShieldCheck className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tight">Super Admin Portal</h1>
                        <p className="text-gray-500 text-sm mt-0.5">Global oversight and analytics</p>
                    </div>
                </div>

                {/* Custom Tabs */}
                <div className="flex space-x-2 border-b border-kfintech-border/50">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-3 text-sm font-bold transition-all relative ${
                                activeTab === tab.id 
                                ? 'text-white' 
                                : 'text-gray-500 hover:text-gray-300'
                            }`}
                        >
                            {tab.icon}
                            {tab.label}
                            {activeTab === tab.id && (
                                <motion.div 
                                    layoutId="activeTab"
                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-kfintech-primary"
                                />
                            )}
                        </button>
                    ))}
                </div>
            </header>

            {loading ? (
                <div className="h-64 flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-kfintech-primary/30 border-t-kfintech-primary rounded-full animate-spin"></div>
                </div>
            ) : (
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    {activeTab === 'METRICS' && renderMetrics()}
                    {activeTab === 'USERS' && renderUsers()}
                    {activeTab === 'TICKETS' && renderTickets(ticketsList)}
                    {activeTab === 'FLAGGED' && renderTickets(flaggedList)}
                </motion.div>
            )}

        </motion.div>
    );
};

export default AdminDashboard;
