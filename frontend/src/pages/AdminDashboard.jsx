import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/client';
import DotBackgroundDemo from "@/components/ui/DotBackgroundDemo";
import ThemeToggle from '../components/common/ThemeToggle';
import {
    LayoutDashboard, Ticket, Users, AlertTriangle, Activity,
    Download, RefreshCw, Loader2, TrendingUp, TrendingDown,
    ChevronLeft, ChevronRight, Shield, Clock, CheckCircle2,
    XCircle, Filter, BarChart3, User2, ChevronsUpDown
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// ─── Utility Components ──────────────────────────────────────────────────────

const Badge = ({ children, variant = 'default' }) => {
    const variants = {
        default:   'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
        success:   'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        warning:   'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        danger:    'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        info:      'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        critical:  'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
    };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${variants[variant]}`}>
            {children}
        </span>
    );
};

const priorityVariant = (p) => p === 'CRITICAL' ? 'critical' : p === 'HIGH' ? 'warning' : 'default';
const statusVariant = (s) => {
    if (['RESOLVED', 'CLOSED'].includes(s)) return 'success';
    if (s === 'REJECTED') return 'danger';
    if (['L2_APPROVAL', 'L1_REVIEW'].includes(s)) return 'info';
    return 'default';
};

const Card = ({ children, className = '' }) => (
    <div className={`bg-white/70 dark:bg-[#1A1A1A]/70 backdrop-blur-sm border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm ${className}`}>
        {children}
    </div>
);

const Spinner = () => (
    <div className="flex items-center justify-center py-16 text-zinc-400">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        <span className="text-sm">Loading...</span>
    </div>
);

const PaginationBar = ({ page, totalPages, setPage }) => (
    <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-100 dark:border-zinc-800">
        <span className="text-xs text-zinc-500 dark:text-zinc-400">Page {page} of {totalPages || 1}</span>
        <div className="flex gap-1">
            <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 text-zinc-600 dark:text-zinc-400"
            >
                <ChevronLeft className="h-4 w-4" />
            </button>
            <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 text-zinc-600 dark:text-zinc-400"
            >
                <ChevronRight className="h-4 w-4" />
            </button>
        </div>
    </div>
);

// ─── KPI Stat Card ────────────────────────────────────────────────────────────

const StatCard = ({ label, value, sub, icon: Icon, trend, highlight = false }) => (
    <Card className={`p-5 ${highlight ? 'border-red-300 dark:border-red-800 bg-red-50/60 dark:bg-red-950/30' : ''}`}>
        <div className="flex items-start justify-between mb-3">
            <div className={`p-2 rounded-lg ${highlight ? 'bg-red-100 dark:bg-red-900/40' : 'bg-zinc-100 dark:bg-zinc-800'}`}>
                <Icon className={`h-4 w-4 ${highlight ? 'text-red-600 dark:text-red-400' : 'text-zinc-600 dark:text-zinc-400'}`} />
            </div>
            {trend !== undefined && (
                <span className={`flex items-center text-xs font-medium ${trend >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                    {trend >= 0 ? <TrendingUp className="h-3 w-3 mr-0.5" /> : <TrendingDown className="h-3 w-3 mr-0.5" />}
                    {Math.abs(trend)}%
                </span>
            )}
        </div>
        <div className={`text-2xl font-bold tracking-tight mb-1 ${highlight ? 'text-red-700 dark:text-red-300' : 'text-zinc-900 dark:text-zinc-50'}`}>
            {value ?? '—'}
        </div>
        <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</div>
        {sub && <div className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">{sub}</div>}
    </Card>
);

// ─── Overview Tab ─────────────────────────────────────────────────────────────

const OverviewTab = ({ metrics, recentTickets, recentActivities }) => {
    const statusData = metrics?.statusData || [];
    const COLORS = { OPEN: '#3b82f6', IN_PROGRESS: '#8b5cf6', L1_REVIEW: '#0ea5e9', L2_APPROVAL: '#f59e0b', RESOLVED: '#10b981', CLOSED: '#6b7280', REJECTED: '#ef4444', ESCALATED: '#fb923c' };

    const serviceBreakdown = metrics?.serviceTypeData || [];

    return (
        <div className="space-y-6">
            {/* KPI Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total Tickets" value={metrics?.totalTickets} icon={Ticket} />
                <StatCard label="Open / In Progress" value={(metrics?.openTickets ?? 0) + (metrics?.inProgressTickets ?? 0)} sub="Awaiting review" icon={Clock} />
                <StatCard label="Resolved" value={metrics?.resolvedTickets} sub="Last 30 days" icon={CheckCircle2} />
                <StatCard label="Critical / Fraud" value={(metrics?.criticalTickets ?? 0) + (metrics?.fraudTickets ?? 0)} sub="Requires attention" icon={AlertTriangle} highlight={((metrics?.criticalTickets ?? 0) + (metrics?.fraudTickets ?? 0)) > 0} />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Status Pipeline */}
                <Card className="lg:col-span-2 p-5">
                    <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-4">Ticket Status Pipeline</h3>
                    {statusData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={180}>
                            <BarChart data={statusData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#71717a' }} />
                                <YAxis tick={{ fontSize: 10, fill: '#71717a' }} />
                                <Tooltip
                                    contentStyle={{ background: 'var(--tooltip-bg, #fff)', border: '1px solid #e4e4e7', borderRadius: '8px', fontSize: '12px' }}
                                />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                    {statusData.map((entry, index) => (
                                        <Cell key={index} fill={COLORS[entry.name] || '#94a3b8'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-[180px] text-zinc-400 text-sm">No pipeline data</div>
                    )}
                </Card>

                {/* SLA / Service Breakdown */}
                <Card className="p-5">
                    <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-4">Service Breakdown</h3>
                    {serviceBreakdown.length > 0 ? (
                        <div className="space-y-2">
                            {serviceBreakdown.slice(0, 6).map((item, i) => (
                                <div key={i} className="flex items-center justify-between text-xs">
                                    <span className="text-zinc-600 dark:text-zinc-400 truncate max-w-[130px]">{item.name?.replace(/_/g, ' ')}</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-20 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-zinc-800 dark:bg-zinc-200 rounded-full" style={{ width: `${Math.min(100, (item.value / (metrics?.totalTickets || 1)) * 100)}%` }} />
                                        </div>
                                        <span className="font-medium text-zinc-900 dark:text-zinc-100 w-4 text-right">{item.value}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-[140px] text-zinc-400 text-sm">No data</div>
                    )}
                    {metrics?.slaBreachedTickets > 0 && (
                        <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-red-600 dark:text-red-400 font-medium">SLA Breached</span>
                                <span className="font-bold text-red-700 dark:text-red-300">{metrics.slaBreachedTickets}</span>
                            </div>
                        </div>
                    )}
                </Card>
            </div>

            {/* Agent Leaderboard + Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="p-5">
                    <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-4">Agent Performance (30d)</h3>
                    {metrics?.agentPerformance?.length > 0 ? (
                        <div className="space-y-3">
                            {metrics.agentPerformance.map((agent, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-600 dark:text-zinc-400 shrink-0">
                                        {(agent.name || 'A').charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">{agent.name}</span>
                                            <span className="text-xs text-zinc-500 dark:text-zinc-400 shrink-0 ml-2">{agent.actionsCount} actions</span>
                                        </div>
                                        <div className="w-full h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-zinc-900 dark:bg-zinc-100 rounded-full"
                                                style={{ width: `${Math.min(100, (agent.actionsCount / (metrics.agentPerformance[0]?.actionsCount || 1)) * 100)}%` }} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : <div className="text-zinc-400 text-sm text-center py-8">No agent data</div>}
                </Card>

                <Card className="p-5">
                    <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-4">Recent System Activity</h3>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                        {recentActivities?.slice(0, 8).map((log, i) => (
                            <div key={i} className="flex items-start gap-2.5 py-1.5 border-b border-zinc-50 dark:border-zinc-800/50 last:border-0">
                                <div className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
                                    <Activity className="h-3 w-3 text-zinc-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate">{log.action?.replace(/_/g, ' ')}</p>
                                    <p className="text-xs text-zinc-400">{log.performedBy?.name} · {log.createdAt ? format(new Date(log.createdAt), 'MMM d, HH:mm') : ''}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* Recent Tickets */}
            <Card>
                <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
                    <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Recent Tickets</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="border-b border-zinc-100 dark:border-zinc-800">
                                {['Investor', 'Service', 'Status', 'Priority', 'Fraud', 'Created'].map(h => (
                                    <th key={h} className="text-left px-4 py-3 text-zinc-500 dark:text-zinc-400 font-medium">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {(recentTickets || []).slice(0, 8).map((t, i) => (
                                <tr key={i} className="border-b border-zinc-50 dark:border-zinc-800/50 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{t.investorName || '—'}</td>
                                    <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{t.serviceType?.replace(/_/g, ' ')}</td>
                                    <td className="px-4 py-3"><Badge variant={statusVariant(t.status)}>{t.status}</Badge></td>
                                    <td className="px-4 py-3"><Badge variant={priorityVariant(t.assignedPriority)}>{t.assignedPriority}</Badge></td>
                                    <td className="px-4 py-3">{t.isPotentialFraud ? <span className="text-red-500 font-semibold">⚠ YES</span> : <span className="text-zinc-300 dark:text-zinc-600">—</span>}</td>
                                    <td className="px-4 py-3 text-zinc-400">{t.createdAt ? format(new Date(t.createdAt), 'MMM d') : '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

// ─── Tickets Tab ──────────────────────────────────────────────────────────────

const TicketsTab = ({ tickets, page, totalPages, setPage, flagged = false }) => (
    <Card>
        <div className="overflow-x-auto">
            <table className="w-full text-xs">
                <thead>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800">
                        {['Investor', 'Service', 'Status', 'Priority', ...(flagged ? ['Fraud Flag'] : []), 'SLA Days', 'Created'].map(h => (
                            <th key={h} className="text-left px-4 py-3 text-zinc-500 dark:text-zinc-400 font-medium">{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {(tickets || []).map((t, i) => (
                        <tr key={i} className="border-b border-zinc-50 dark:border-zinc-800/50 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                            <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{t.investorName || '—'}</td>
                            <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{t.serviceType?.replace(/_/g, ' ')}</td>
                            <td className="px-4 py-3"><Badge variant={statusVariant(t.status)}>{t.status}</Badge></td>
                            <td className="px-4 py-3"><Badge variant={priorityVariant(t.assignedPriority)}>{t.assignedPriority}</Badge></td>
                            {flagged && <td className="px-4 py-3">{t.isPotentialFraud ? <span className="text-red-500 font-semibold">⚠ YES</span> : '—'}</td>}
                            <td className="px-4 py-3 text-zinc-400">{t.slaTimeline?.slaDays ?? '—'}d</td>
                            <td className="px-4 py-3 text-zinc-400">{t.createdAt ? format(new Date(t.createdAt), 'MMM d, yyyy') : '—'}</td>
                        </tr>
                    ))}
                    {!tickets?.length && <tr><td colSpan={7} className="text-center py-12 text-zinc-400 text-sm">No tickets found</td></tr>}
                </tbody>
            </table>
        </div>
        <PaginationBar page={page} totalPages={totalPages} setPage={setPage} />
    </Card>
);

// ─── Users Tab ────────────────────────────────────────────────────────────────

const UsersTab = ({ users, page, totalPages, setPage, onToggleStatus }) => (
    <Card>
        <div className="overflow-x-auto">
            <table className="w-full text-xs">
                <thead>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800">
                        {['Name', 'Email', 'Role', 'KYC', 'Status', 'Joined', 'Action'].map(h => (
                            <th key={h} className="text-left px-4 py-3 text-zinc-500 dark:text-zinc-400 font-medium">{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {(users || []).map((u, i) => (
                        <tr key={i} className="border-b border-zinc-50 dark:border-zinc-800/50 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                            <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{u.name}</td>
                            <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{u.email}</td>
                            <td className="px-4 py-3"><Badge variant={u.role === 'ADMIN_SUPER' ? 'critical' : u.role === 'INVESTOR' ? 'info' : 'default'}>{u.role}</Badge></td>
                            <td className="px-4 py-3"><Badge variant={u.kyc?.status === 'APPROVED' ? 'success' : 'default'}>{u.kyc?.status || 'N/A'}</Badge></td>
                            <td className="px-4 py-3"><Badge variant={u.isActive ? 'success' : 'danger'}>{u.isActive ? 'Active' : 'Inactive'}</Badge></td>
                            <td className="px-4 py-3 text-zinc-400">{u.createdAt ? format(new Date(u.createdAt), 'MMM d, yyyy') : '—'}</td>
                            <td className="px-4 py-3">
                                <button
                                    onClick={() => onToggleStatus(u._id, u.isActive)}
                                    className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${u.isActive
                                        ? 'border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/40'
                                        : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/40'
                                    }`}
                                >
                                    {u.isActive ? 'Deactivate' : 'Activate'}
                                </button>
                            </td>
                        </tr>
                    ))}
                    {!users?.length && <tr><td colSpan={7} className="text-center py-12 text-zinc-400 text-sm">No users found</td></tr>}
                </tbody>
            </table>
        </div>
        <PaginationBar page={page} totalPages={totalPages} setPage={setPage} />
    </Card>
);

// ─── Agents Tab ───────────────────────────────────────────────────────────────

const AgentsTab = ({ activities, agents, page, totalPages, setPage, onAgentChange, selectedAgent, onExport }) => (
    <div className="space-y-4">
        {/* Controls */}
        <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
                <User2 className="h-4 w-4 text-zinc-400" />
                <Select value={selectedAgent} onValueChange={onAgentChange}>
                    <SelectTrigger className="h-9 text-sm w-[200px] bg-white dark:bg-[#131313] border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200">
                        <SelectValue placeholder="All Agents" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-[#131313] border-zinc-200 dark:border-zinc-700">
                        <SelectItem value="ALL" className="text-zinc-700 dark:text-zinc-300">All Agents</SelectItem>
                        {(agents || []).map(a => (
                            <SelectItem key={a._id} value={a._id} className="text-zinc-700 dark:text-zinc-300">{a.name} ({a.role})</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex gap-2">
                <button
                    onClick={() => onExport('ALL')}
                    className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                    <Download className="h-3.5 w-3.5" /> Export All
                </button>
                {selectedAgent !== 'ALL' && (
                    <button
                        onClick={() => onExport(selectedAgent)}
                        className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
                    >
                        <Download className="h-3.5 w-3.5" /> Export Selected
                    </button>
                )}
            </div>
        </div>

        <Card>
            <div className="overflow-x-auto">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="border-b border-zinc-100 dark:border-zinc-800">
                            {['Agent', 'Role', 'Action', 'Ticket / Entity', 'Date & Time'].map(h => (
                                <th key={h} className="text-left px-4 py-3 text-zinc-500 dark:text-zinc-400 font-medium">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {(activities || []).map((log, i) => (
                            <tr key={i} className="border-b border-zinc-50 dark:border-zinc-800/50 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-600 dark:text-zinc-300 shrink-0">
                                            {(log.performedBy?.name || 'S').charAt(0).toUpperCase()}
                                        </div>
                                        <span className="font-medium text-zinc-800 dark:text-zinc-200">{log.performedBy?.name || 'System'}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3"><Badge variant="default">{log.performedBy?.role || '—'}</Badge></td>
                                <td className="px-4 py-3">
                                    <span className="font-mono text-zinc-600 dark:text-zinc-400">{log.action?.replace(/_/g, ' ')}</span>
                                </td>
                                <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                                    {log.entityId?.title || log.entityId?.serviceType || '—'}
                                </td>
                                <td className="px-4 py-3 text-zinc-400">
                                    {log.createdAt ? format(new Date(log.createdAt), 'MMM d, yyyy HH:mm') : '—'}
                                </td>
                            </tr>
                        ))}
                        {!activities?.length && <tr><td colSpan={5} className="text-center py-12 text-zinc-400 text-sm">No activities found</td></tr>}
                    </tbody>
                </table>
            </div>
            <PaginationBar page={page} totalPages={totalPages} setPage={setPage} />
        </Card>
    </div>
);

// ─── Main Dashboard ───────────────────────────────────────────────────────────

const TABS = [
    { id: 'overview',  label: 'Overview',   icon: LayoutDashboard },
    { id: 'tickets',   label: 'Tickets',    icon: Ticket },
    { id: 'users',     label: 'Users',      icon: Users },
    { id: 'flagged',   label: 'Flagged',    icon: AlertTriangle },
    { id: 'agents',    label: 'Agents',     icon: Activity },
];

const AdminDashboard = () => {
    const [activeTab,      setActiveTab]      = useState('overview');
    const [metrics,        setMetrics]        = useState(null);
    const [usersList,      setUsersList]      = useState([]);
    const [ticketsList,    setTicketsList]    = useState([]);
    const [flaggedList,    setFlaggedList]    = useState([]);
    const [activitiesList, setActivitiesList] = useState([]);
    const [agentsList,     setAgentsList]     = useState([]);
    const [loading,        setLoading]        = useState(true);
    const [page,           setPage]           = useState(1);
    const [totalPages,     setTotalPages]     = useState(1);

    // Filters
    const [dateRange,       setDateRange]       = useState('ALL');
    const [ticketStatus,    setTicketStatus]    = useState('ALL');
    const [ticketPriority,  setTicketPriority]  = useState('ALL');
    const [userRole,        setUserRole]        = useState('ALL');
    const [selectedAgent,   setSelectedAgent]   = useState('ALL');

    useEffect(() => { setPage(1); }, [activeTab, dateRange, ticketStatus, ticketPriority, userRole, selectedAgent]);

    const fetchData = useCallback(async () => {
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
                const res = await apiClient.get(`/admin/tickets?page=${page}&limit=15&status=${ticketStatus}&priority=${ticketPriority}&dateRange=${dateRange}`);
                setTicketsList(res.data.tickets);
                setTotalPages(res.data.pagination.totalPages);
            } else if (activeTab === 'users') {
                const res = await apiClient.get(`/admin/users?page=${page}&limit=15&role=${userRole}`);
                setUsersList(res.data.users);
                setTotalPages(res.data.pagination.totalPages);
            } else if (activeTab === 'flagged') {
                const res = await apiClient.get('/admin/tickets/flagged');
                setFlaggedList(res.data.tickets);
                setTotalPages(1);
            } else if (activeTab === 'agents') {
                const [actRes, agentsRes] = await Promise.all([
                    apiClient.get(`/admin/agents/activities?page=${page}&limit=15${selectedAgent !== 'ALL' ? `&agentId=${selectedAgent}` : ''}`),
                    agentsList.length === 0 ? apiClient.get('/admin/agents') : Promise.resolve(null)
                ]);
                setActivitiesList(actRes.data.activities);
                setTotalPages(actRes.data.pagination.totalPages);
                if (agentsRes) setAgentsList(agentsRes.data.agents);
            }
        } catch (error) {
            console.error('[AdminDashboard] Fetch error', error);
        } finally {
            setLoading(false);
        }
    }, [activeTab, page, dateRange, ticketStatus, ticketPriority, userRole, selectedAgent]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleToggleUserStatus = async (userId, currentStatus) => {
        try {
            await apiClient.put(`/admin/users/${userId}/status`, { isActive: !currentStatus });
            fetchData();
        } catch (error) {
            console.error('Toggle user failed', error);
        }
    };

    // Download agent CSV via server endpoint
    const handleExportAgentCsv = (agentId) => {
        const params = agentId && agentId !== 'ALL' ? `?agentId=${agentId}` : '?agentId=ALL';
        const base = import.meta.env.VITE_API_URL || '/api';
        window.open(`${base}/admin/agents/activities/export${params}`, '_blank');
    };

    // Tickets CSV (client-side, existing behaviour)
    const handleExportTicketsCsv = () => {
        const list = activeTab === 'flagged' ? flaggedList : ticketsList;
        if (!list.length) return;
        const headers = ['Ticket ID', 'Investor', 'Service Type', 'Status', 'Priority', 'Fraud', 'Created'];
        const rows = list.map(t => [
            t._id, `"${t.investorName || ''}"`, t.serviceType, t.status,
            t.assignedPriority, t.isPotentialFraud ? 'YES' : 'NO',
            t.createdAt ? new Date(t.createdAt).toLocaleDateString() : ''
        ]);
        const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `finnovax_tickets_${activeTab}.csv`;
        a.click();
    };

    return (
        <div className="min-h-screen bg-[#faf9f6] dark:bg-[#0A0A0A] text-zinc-900 dark:text-zinc-50 relative overflow-hidden font-sans">
            <DotBackgroundDemo />

            {/* Top Nav Bar */}
            <header className="relative z-20 flex items-center justify-between px-6 lg:px-10 h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-[#0A0A0A]/60 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-zinc-900 dark:text-zinc-100" />
                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Super Admin Console</span>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchData}
                        disabled={loading}
                        className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-500"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <ThemeToggle />
                </div>
            </header>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Page Title */}
                <div className="mb-6">
                    <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">Dashboard</h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Monitor, manage and audit the FinnovaX platform</p>
                </div>

                {/* Tab Navigation */}
                <div className="flex items-center gap-1 mb-6 bg-white/60 dark:bg-[#1A1A1A]/60 border border-zinc-200 dark:border-zinc-800 rounded-xl p-1 w-fit backdrop-blur-sm">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                                activeTab === tab.id
                                    ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
                                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                            }`}
                        >
                            <tab.icon className="h-3.5 w-3.5" />
                            {tab.label}
                            {tab.id === 'flagged' && flaggedList.length > 0 && (
                                <span className="ml-0.5 bg-red-500 text-white text-[10px] rounded-full px-1.5 py-0.5 leading-none">{flaggedList.length}</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Filter Bar */}
                <div className="flex flex-wrap items-center gap-3 mb-6">
                    {/* Date Range - shown on all tabs */}
                    <Select value={dateRange} onValueChange={setDateRange}>
                        <SelectTrigger className="h-8 text-xs w-[130px] bg-white dark:bg-[#131313] border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300">
                            <SelectValue placeholder="All Time" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-[#131313] border-zinc-200 dark:border-zinc-700">
                            <SelectItem value="ALL" className="text-zinc-700 dark:text-zinc-300 text-xs">All Time</SelectItem>
                            <SelectItem value="7d" className="text-zinc-700 dark:text-zinc-300 text-xs">Last 7 Days</SelectItem>
                            <SelectItem value="30d" className="text-zinc-700 dark:text-zinc-300 text-xs">Last 30 Days</SelectItem>
                            <SelectItem value="90d" className="text-zinc-700 dark:text-zinc-300 text-xs">Last 90 Days</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Tickets filter */}
                    {(activeTab === 'tickets' || activeTab === 'flagged' || activeTab === 'overview') && (
                        <>
                            <Select value={ticketStatus} onValueChange={setTicketStatus}>
                                <SelectTrigger className="h-8 text-xs w-[130px] bg-white dark:bg-[#131313] border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300">
                                    <SelectValue placeholder="All Statuses" />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-[#131313] border-zinc-200 dark:border-zinc-700">
                                    <SelectItem value="ALL" className="text-zinc-700 dark:text-zinc-300 text-xs">All Statuses</SelectItem>
                                    {['OPEN','IN_PROGRESS','L1_REVIEW','L2_APPROVAL','RESOLVED','REJECTED','CLOSED'].map(s => (
                                        <SelectItem key={s} value={s} className="text-zinc-700 dark:text-zinc-300 text-xs">{s.replace(/_/g,' ')}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={ticketPriority} onValueChange={setTicketPriority}>
                                <SelectTrigger className="h-8 text-xs w-[120px] bg-white dark:bg-[#131313] border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300">
                                    <SelectValue placeholder="All Priorities" />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-[#131313] border-zinc-200 dark:border-zinc-700">
                                    <SelectItem value="ALL" className="text-zinc-700 dark:text-zinc-300 text-xs">All Priorities</SelectItem>
                                    {['NORMAL','HIGH','CRITICAL'].map(p => (
                                        <SelectItem key={p} value={p} className="text-zinc-700 dark:text-zinc-300 text-xs">{p}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </>
                    )}

                    {/* Users filter */}
                    {activeTab === 'users' && (
                        <Select value={userRole} onValueChange={setUserRole}>
                            <SelectTrigger className="h-8 text-xs w-[130px] bg-white dark:bg-[#131313] border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300">
                                <SelectValue placeholder="All Roles" />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-[#131313] border-zinc-200 dark:border-zinc-700">
                                <SelectItem value="ALL" className="text-zinc-700 dark:text-zinc-300 text-xs">All Roles</SelectItem>
                                {['INVESTOR','ADMIN_L1','ADMIN_L2','ADMIN_SUPER'].map(r => (
                                    <SelectItem key={r} value={r} className="text-zinc-700 dark:text-zinc-300 text-xs">{r}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}

                    {/* Export button for tickets/users */}
                    {['tickets', 'users', 'flagged'].includes(activeTab) && (
                        <button
                            onClick={handleExportTicketsCsv}
                            className="ml-auto flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                        >
                            <Download className="h-3.5 w-3.5" /> Export CSV
                        </button>
                    )}
                </div>

                {/* Tab Content */}
                {loading && !metrics && !ticketsList.length && !usersList.length ? (
                    <Spinner />
                ) : (
                    <div className="animate-in fade-in duration-200">
                        {activeTab === 'overview' && (
                            <OverviewTab
                                metrics={metrics}
                                recentTickets={ticketsList}
                                recentActivities={activitiesList}
                            />
                        )}
                        {activeTab === 'tickets' && (
                            <TicketsTab tickets={ticketsList} page={page} totalPages={totalPages} setPage={setPage} />
                        )}
                        {activeTab === 'users' && (
                            <UsersTab users={usersList} page={page} totalPages={totalPages} setPage={setPage} onToggleStatus={handleToggleUserStatus} />
                        )}
                        {activeTab === 'flagged' && (
                            <TicketsTab
                                tickets={flaggedList.filter(t =>
                                    (ticketStatus === 'ALL' || t.status === ticketStatus) &&
                                    (ticketPriority === 'ALL' || t.assignedPriority === ticketPriority)
                                )}
                                page={1} totalPages={1} setPage={() => {}} flagged
                            />
                        )}
                        {activeTab === 'agents' && (
                            <AgentsTab
                                activities={activitiesList}
                                agents={agentsList}
                                page={page}
                                totalPages={totalPages}
                                setPage={setPage}
                                selectedAgent={selectedAgent}
                                onAgentChange={v => { setSelectedAgent(v); setPage(1); }}
                                onExport={handleExportAgentCsv}
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
