import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Users, Activity, AlertTriangle, CheckCircle, Database, Server, Cpu, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';

const AdminDashboard = () => {
    const { user, logout } = useAuth();
    const [users, setUsers] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [health, setHealth] = useState(null);
    const [loading, setLoading] = useState(true);
    const [revokeLoading, setRevokeLoading] = useState(false);

    useEffect(() => {
        const fetchAdminData = async () => {
            try {
                const [usersRes, logsRes, healthRes] = await Promise.all([
                    apiClient.get('/admin/users'),
                    apiClient.get('/admin/audit-logs'),
                    apiClient.get('/admin/system/health')
                ]);
                setUsers(usersRes.data);
                setAuditLogs(logsRes.data);
                setHealth(healthRes.data);
            } catch (err) {
                console.error("Failed to fetch admin data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAdminData();
    }, []);

    const handleRoleChange = async (userId, newRole) => {
        try {
            await apiClient.put(`/admin/users/${userId}/role`, { role: newRole });
            setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u));
            alert("Role updated successfully");
        } catch (err) {
            alert("Failed to update role");
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm("Are you sure you want to delete this user? This cannot be undone.")) return;
        try {
            await apiClient.delete(`/admin/users/${userId}`);
            setUsers(users.filter(u => u._id !== userId));
            alert("User deleted");
        } catch (err) {
            alert("Failed to delete user");
        }
    };

    const handleEmergencyKillSwitch = async () => {
        if (!window.confirm("EMERGENCY: Are you absolutely sure you want to revoke all active sessions across the platform? All users will be instantly logged out.")) return;
        setRevokeLoading(true);
        try {
            await apiClient.post('/admin/revoke-all');
            alert("All sessions have been revoked. Logging you out...");
            logout();
        } catch (err) {
            alert("Failed to execute emergency protocol.");
        } finally {
            setRevokeLoading(false);
        }
    };

    if (loading) return <div className="text-center p-20 text-white text-xl">Initializing Control Center...</div>;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="p-8 max-w-7xl mx-auto space-y-8"
        >
            <header className="flex justify-between items-end">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                        <Activity className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tight">Super Admin Control Center</h1>
                        <p className="text-gray-500 text-sm mt-0.5">
                            Logged in as <span className="text-white font-bold">{user?.name}</span> ·{' '}
                            <span className="text-emerald-400 font-mono text-xs font-bold">{user?.role}</span>
                        </p>
                    </div>
                </div>
                
                <button 
                    onClick={handleEmergencyKillSwitch}
                    disabled={revokeLoading}
                    className="flex items-center gap-2 bg-red-600/20 hover:bg-red-600/40 text-red-500 border border-red-500/50 px-4 py-2 rounded-lg font-bold text-sm transition-colors"
                >
                    <AlertTriangle className="w-4 h-4" />
                    {revokeLoading ? 'Revoking...' : 'Emergency Kill Switch'}
                </button>
            </header>

            {/* System Health */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-panel p-5 rounded-2xl border border-kfintech-border flex items-center gap-4">
                    <Database className={`w-8 h-8 ${health?.mongodb === 'ONLINE' ? 'text-emerald-400' : 'text-red-400'}`} />
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">MongoDB State</p>
                        <p className="text-lg font-black text-white">{health?.mongodb || 'UNKNOWN'}</p>
                    </div>
                </div>
                <div className="glass-panel p-5 rounded-2xl border border-kfintech-border flex items-center gap-4">
                    <Server className={`w-8 h-8 ${health?.aws_localstack === 'ONLINE' ? 'text-blue-400' : 'text-red-400'}`} />
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">AWS Emulator (LocalStack)</p>
                        <p className="text-lg font-black text-white">{health?.aws_localstack || 'UNKNOWN'}</p>
                    </div>
                </div>
                <div className="glass-panel p-5 rounded-2xl border border-kfintech-border flex items-center gap-4">
                    <Cpu className={`w-8 h-8 ${health?.ai_engine === 'ONLINE' ? 'text-purple-400' : 'text-red-400'}`} />
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">AI Engine</p>
                        <p className="text-lg font-black text-white">{health?.ai_engine || 'UNKNOWN'}</p>
                    </div>
                </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* User Management */}
                <section className="glass-panel rounded-2xl border border-kfintech-border overflow-hidden flex flex-col h-[500px]">
                    <div className="p-5 border-b border-kfintech-border/50 bg-kfintech-card/50">
                        <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                            <Users className="w-5 h-5 text-kfintech-primary" />
                            User Access Management
                        </h2>
                    </div>
                    <div className="overflow-y-auto p-0 flex-1">
                        <table className="w-full text-left text-sm text-gray-400">
                            <thead className="bg-kfintech-bg/50 text-xs uppercase text-gray-500 font-bold sticky top-0">
                                <tr>
                                    <th className="px-5 py-3">User</th>
                                    <th className="px-5 py-3">Role</th>
                                    <th className="px-5 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-kfintech-border/40">
                                {users.map(u => (
                                    <tr key={u._id} className="hover:bg-kfintech-card/30">
                                        <td className="px-5 py-4">
                                            <div className="font-bold text-white">{u.name}</div>
                                            <div className="text-xs font-mono">{u.email}</div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <select 
                                                value={u.role}
                                                onChange={(e) => handleRoleChange(u._id, e.target.value)}
                                                className="bg-kfintech-bg border border-kfintech-border text-white text-xs rounded px-2 py-1 outline-none"
                                            >
                                                <option value="INVESTOR">INVESTOR</option>
                                                <option value="ADMIN_L1">ADMIN_L1</option>
                                                <option value="ADMIN_L2">ADMIN_L2</option>
                                                <option value="ADMIN_SUPER">ADMIN_SUPER</option>
                                            </select>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <button 
                                                onClick={() => handleDeleteUser(u._id)}
                                                className="text-red-500 hover:text-red-400 p-1"
                                                title="Delete User"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Audit Logs */}
                <section className="glass-panel rounded-2xl border border-kfintech-border overflow-hidden flex flex-col h-[500px]">
                    <div className="p-5 border-b border-kfintech-border/50 bg-kfintech-card/50">
                        <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-emerald-400" />
                            Live Audit Trail
                        </h2>
                    </div>
                    <div className="overflow-y-auto p-5 space-y-4 flex-1 font-mono text-xs">
                        {auditLogs.length === 0 ? (
                            <div className="text-gray-500 text-center py-10">No audit logs found.</div>
                        ) : (
                            auditLogs.map(log => (
                                <div key={log._id} className="border-l-2 border-emerald-500/50 pl-3 py-1">
                                    <div className="flex justify-between text-gray-500 mb-1">
                                        <span>{new Date(log.createdAt).toLocaleString()}</span>
                                        <span className="text-emerald-400/80">{log.ipAddress || '127.0.0.1'}</span>
                                    </div>
                                    <div className="text-white">
                                        <span className="font-bold text-blue-400">{log.performedBy?.email || 'System'}</span> 
                                        {' '}executed <span className="font-bold text-amber-400">{log.action}</span>
                                    </div>
                                    <div className="text-gray-400 mt-1">
                                        Details: {JSON.stringify(log.details)}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>
        </motion.div>
    );
};

export default AdminDashboard;
