import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, isLoading, isAuthenticated } = useAuth();
    const location = useLocation();

    // While session is being restored from localStorage, shows a centered spinner
    if (isLoading) {
        return (
            <div>
                <div>
                    <div  />
                    <p>Validating session...</p>
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
            <div>
                <div>
                    <div>🚫</div>
                    <h2>Access Denied</h2>
                    <p>
                        Your role <span>{user.role}</span> does not have permission to access this page.
                    </p>
                    <p>
                        Required: {allowedRoles.join(' | ')}
                    </p>
                </div>
            </div>
        );
    }

    return children;
};

export default ProtectedRoute;
