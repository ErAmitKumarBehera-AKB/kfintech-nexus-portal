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
        
        style={{ boxShadow: glow }}>
        <div>
            {icon}
        </div>
        <div>
            <p>{label}</p>
            <p>{value}</p>
            {subtext && <p>{subtext}</p>}
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
        { id: 'METRICS', label: 'System Metrics', icon: <Activity  /> },
        { id: 'USERS', label: 'User Management', icon: <Users  /> },
        { id: 'TICKETS', label: 'All Tickets', icon: <FileText  /> },
        { id: 'FLAGGED', label: 'Flagged / Escalated', icon: <AlertTriangle  /> }
    ];

    const maskData = (str, type) => {
        if(!str) return 'N/A';
        if(type === 'email') return str.replace(/(.{2})(.*)(?=@)/, (gp1, gp2, gp3) => gp2 + '*'.repeat(gp3.length));
        if(type === 'phone') return str.slice(0, -4).replace(/./g, '*') + str.slice(-4);
        return str;
    };

    // Pagination Component
    const Pagination = () => (
        <div>
            <span>Page {page} of {totalPages || 1}</span>
            <div>
                <button 
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}>
                    <ChevronLeft  />
                </button>
                <button 
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page>= totalPages}>
                    <ChevronRight  />
                </button>
            </div>
        </div>
    );

    // Tab Renderers
    const renderMetrics = () => {
        if (!metrics) return null;
        return (
            <div>
                <div>
                    <StatCard 
                        icon={<FileText  />}
                        label="Total Tickets" value={metrics.totalTickets}
                        color="bg-blue-500/10 border-blue-500/30" glow="0 0 20px rgba(59,130,246,0.08)"
                    />
                    <StatCard 
                        icon={<Users  />}
                        label="Total Investors" value={metrics.totalInvestors}
                        color="bg-emerald-500/10 border-emerald-500/30" glow="0 0 20px rgba(16,185,129,0.08)"
                    />
                    <StatCard 
                        icon={<AlertTriangle  />}
                        label="SLA Breached" value={metrics.slaBreachedTickets || 0}
                        subtext="Tickets past deadline"
                        color="bg-orange-500/10 border-orange-500/30" glow="0 0 20px rgba(245,158,11,0.08)"
                    />
                    <StatCard 
                        icon={<XCircle  />}
                        label="Rejection Rate" value={`${metrics.rejectionRate.toFixed(1)}%`}
                        color="bg-red-500/10 border-red-500/30" glow="0 0 20px rgba(239,68,68,0.08)"
                    />
                </div>

                <div>
                    <div>
                        <h3>Service Type Breakdown</h3>
                        <div>
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

                    <div>
                        <h3>Tickets by Status</h3>
                        <div>
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
        <div>
            <div>
                <h2>
                    <Users  /> User Directory
                </h2>
                <div>
                    <select 
                        value={userRole} 
                        onChange={(e) => setUserRole(e.target.value)}>
                        <option value="ALL">All Roles</option>
                        <option value="INVESTOR">Investors</option>
                        <option value="ADMIN_L1">L1 Admins</option>
                        <option value="ADMIN_L2">L2 Admins</option>
                        <option value="ADMIN_SUPER">Super Admins</option>
                    </select>
                </div>
            </div>
            <div>
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {usersList.map(u => (
                            <tr key={u._id}>
                                <td>{u.name}</td>
                                <td>{maskData(u.email, 'email')}</td>
                                <td>
                                    <span>
                                        {u.role.replace('ADMIN_', '')}
                                    </span>
                                </td>
                                <td>
                                    <span>
                                        {u.isActive ? 'ACTIVE' : 'INACTIVE'}
                                    </span>
                                </td>
                                <td>
                                    <button 
                                        onClick={() => handleToggleUserStatus(u._id, u.isActive)}
                                        
                                        title={u.isActive ? "Deactivate User" : "Activate User"}>
                                        <Power  />
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
        <div>
            <div>
                <h2>
                    <FileText  /> {activeTab === 'FLAGGED' ? 'Flagged Tickets' : 'Ticket Queue'}
                </h2>
                <div>
                    {activeTab === 'TICKETS' && (
                        <>
                            <select 
                                value={ticketStatus} 
                                onChange={(e) => setTicketStatus(e.target.value)}>
                                <option value="ALL">All Statuses</option>
                                <option value="OPEN">Open</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="RESOLVED">Resolved</option>
                            </select>
                            <select 
                                value={dateRange} 
                                onChange={(e) => setDateRange(e.target.value)}>
                                <option value="ALL">All Time</option>
                                <option value="7d">Last 7 Days</option>
                                <option value="30d">Last 30 Days</option>
                            </select>
                        </>
                    )}
                    <button 
                        onClick={handleExportCsv}>
                        <Download  /> Export CSV
                    </button>
                </div>
            </div>
            <div>
                <table>
                    <thead>
                        <tr>
                            <th>Investor</th>
                            <th>Service Type</th>
                            <th>Status</th>
                            <th>Priority</th>
                            <th>Created</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map(t => (
                            <tr key={t._id}>
                                <td>
                                    {t.investorName}
                                    {t.isPotentialFraud && <span>FRAUD_FLAG</span>}
                                    {t.slaTimeline?.isBreached && <span>SLA_BREACH</span>}
                                </td>
                                <td>{t.serviceType?.replace(/_/g, ' ')}</td>
                                <td>
                                    <span  style={{
                                        borderColor: STATUS_COLORS[t.status] ? `${STATUS_COLORS[t.status]}40` : '#4B5563',
                                        color: STATUS_COLORS[t.status] || '#9CA3AF',
                                        backgroundColor: STATUS_COLORS[t.status] ? `${STATUS_COLORS[t.status]}10` : 'transparent'
                                    }}>
                                        {t.status.replace('_', ' ')}
                                    </span>
                                </td>
                                <td>
                                    <span>
                                        {t.assignedPriority}
                                    </span>
                                </td>
                                <td>
                                    {format(new Date(t.createdAt), 'MMM dd, yyyy HH:mm')}
                                </td>
                            </tr>
                        ))}
                        {data.length === 0 && (
                            <tr>
                                <td colSpan="5">No tickets found in this view.</td>
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
            transition={{ duration: 0.5 }}>
            <header>
                <div>
                    <div>
                        <ShieldCheck  />
                    </div>
                    <div>
                        <h1>Super Admin Portal</h1>
                        <p>Global oversight and analytics</p>
                    </div>
                </div>

                {/* Custom Tabs */}
                <div>
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}>
                            {tab.icon}
                            {tab.label}
                            {activeTab === tab.id && (
                                <motion.div 
                                    layoutId="activeTab"
                                    
                                />
                            )}
                        </button>
                    ))}
                </div>
            </header>

            {loading ? (
                <div>
                    <div></div>
                </div>
            ) : (
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}>
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
