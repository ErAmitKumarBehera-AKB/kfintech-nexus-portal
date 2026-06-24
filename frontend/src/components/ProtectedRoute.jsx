import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, isLoading, isAuthenticated } = useAuth();
    const location = useLocation();

    // While session is being restored from localStorage, shows a centered spinner
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-kfintech-bg">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-kfintech-primary shadow-[0_0_20px_rgba(59,130,246,0.5)]" />
                    <p className="text-gray-400 text-sm font-mono tracking-widest uppercase">Validating session...</p>
                </div>
            </div>
        );
    }

    // Not authenticated then redirect to /login, preserving the intended destination
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Authenticated but wrong role then Access Denied
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return (
            <div className="flex items-center justify-center min-h-[70vh] px-8">
                <div className="glass-panel rounded-2xl p-12 text-center max-w-lg border border-red-500/30 shadow-[0_0_40px_rgba(239,68,68,0.1)]">
                    <div className="text-6xl mb-6">🚫</div>
                    <h2 className="text-2xl font-black text-white mb-3 tracking-tight">Access Denied</h2>
                    <p className="text-gray-400 mb-2">
                        Your role <span className="text-white font-bold font-mono bg-red-500/10 px-2 py-0.5 rounded border border-red-500/30">{user.role}</span> does not have permission to access this page.
                    </p>
                    <p className="text-xs text-gray-600 mt-4 font-mono">
                        Required: {allowedRoles.join(' | ')}
                    </p>
                </div>
            </div>
        );
    }

    return children;
};

export default ProtectedRoute;
