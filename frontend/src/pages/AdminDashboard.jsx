import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Users, FileText, Clock, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const StatCard = ({ icon, label, value, color, glow }) => (
    <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel rounded-2xl p-6 border border-kfintech-border flex items-center gap-5"
        style={{ boxShadow: glow }}
    >
        <div className={`p-3 rounded-xl ${color} border`}>
            {icon}
        </div>
        <div>
            <p className="text-xs font-extrabold text-gray-500 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-3xl font-black text-white">{value}</p>
        </div>
    </motion.div>
);

const AdminDashboard = () => {
    const { user } = useAuth();

    const stats = [
        {
            icon: <Users className="w-6 h-6 text-blue-400" />,
            label: 'Total Roles Managed',
            value: '4',
            color: 'bg-blue-500/10 border-blue-500/30',
            glow: '0 0 20px rgba(59,130,246,0.08)'
        },
        {
            icon: <FileText className="w-6 h-6 text-amber-400" />,
            label: 'Active Route Guards',
            value: '8',
            color: 'bg-amber-500/10 border-amber-500/30',
            glow: '0 0 20px rgba(245,158,11,0.08)'
        },
        {
            icon: <ShieldCheck className="w-6 h-6 text-emerald-400" />,
            label: 'RBAC Policies',
            value: '12',
            color: 'bg-emerald-500/10 border-emerald-500/30',
            glow: '0 0 20px rgba(16,185,129,0.08)'
        },
        {
            icon: <Clock className="w-6 h-6 text-purple-400" />,
            label: 'Session Expiry',
            value: '8h',
            color: 'bg-purple-500/10 border-purple-500/30',
            glow: '0 0 20px rgba(139,92,246,0.08)'
        }
    ];

    const roleMatrix = [
        { role: 'INVESTOR', routes: ['/api/tickets (POST)', '/api/chat/ask', '/api/dashboard/investor/:id'], color: 'text-blue-400', badge: 'bg-blue-500/10 border-blue-500/30' },
        { role: 'ADMIN_L1', routes: ['/api/admin/verify-document', '/api/admin/escalate/:id', '/api/dashboard/l1-queue'], color: 'text-amber-400', badge: 'bg-amber-500/10 border-amber-500/30' },
        { role: 'ADMIN_L2', routes: ['/api/l2/finalize', '/api/dashboard/l2-queue'], color: 'text-purple-400', badge: 'bg-purple-500/10 border-purple-500/30' },
        { role: 'ADMIN_SUPER', routes: ['All of the above'], color: 'text-emerald-400', badge: 'bg-emerald-500/10 border-emerald-500/30' }
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="p-8 max-w-6xl mx-auto"
        >
            <header className="mb-10">
                <div className="flex items-center gap-3 mb-3">
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
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                {stats.map((stat, i) => (
                    <motion.div key={stat.label} transition={{ delay: i * 0.05 }}>
                        <StatCard {...stat} />
                    </motion.div>
                ))}
            </div>

            {/* RBAC Role Matrix */}
            <div className="glass-panel rounded-2xl border border-kfintech-border overflow-hidden">
                <div className="p-6 border-b border-kfintech-border/50 bg-kfintech-card/50">
                    <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-kfintech-primary" />
                        RBAC Access Matrix
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">JWT-enforced role → API endpoint permissions</p>
                </div>
                <div className="divide-y divide-kfintech-border/50">
                    {roleMatrix.map((row) => (
                        <div key={row.role} className="p-5 flex items-start gap-6 hover:bg-kfintech-card/30 transition-colors">
                            <div className="shrink-0 pt-0.5">
                                <span className={`text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border font-mono ${row.badge} ${row.color}`}>
                                    {row.role}
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {row.routes.map((route) => (
                                    <span
                                        key={route}
                                        className="text-xs font-mono bg-kfintech-bg border border-kfintech-border px-2.5 py-1 rounded-lg text-gray-400"
                                    >
                                        {route}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Auth Info */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass-panel rounded-2xl p-6 border border-kfintech-border">
                    <h3 className="text-sm font-extrabold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-kfintech-primary" /> JWT Configuration
                    </h3>
                    <div className="space-y-3 text-sm">
                        {[
                            ['Algorithm', 'HS256'],
                            ['Expiry', '8 hours'],
                            ['Storage', 'localStorage'],
                            ['Refresh on 401', 'Auto-redirect to /login'],
                        ].map(([k, v]) => (
                            <div key={k} className="flex justify-between items-center border-b border-kfintech-border/40 pb-2">
                                <span className="text-gray-500 font-medium">{k}</span>
                                <span className="text-white font-mono text-xs bg-kfintech-bg px-2 py-1 rounded border border-kfintech-border">{v}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="glass-panel rounded-2xl p-6 border border-kfintech-border">
                    <h3 className="text-sm font-extrabold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Users className="w-4 h-4 text-kfintech-primary" /> Demo Accounts
                    </h3>
                    <div className="space-y-3 text-sm">
                        {[
                            ['investor@kfintech.com', 'INVESTOR', 'text-blue-400'],
                            ['l1agent@kfintech.com', 'ADMIN_L1', 'text-amber-400'],
                            ['l2agent@kfintech.com', 'ADMIN_L2', 'text-purple-400'],
                            ['admin@kfintech.com', 'ADMIN_SUPER', 'text-emerald-400'],
                        ].map(([email, role, color]) => (
                            <div key={email} className="flex justify-between items-center border-b border-kfintech-border/40 pb-2">
                                <span className="text-gray-400 font-mono text-xs">{email}</span>
                                <span className={`text-[10px] font-black uppercase tracking-widest ${color}`}>{role}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default AdminDashboard;
