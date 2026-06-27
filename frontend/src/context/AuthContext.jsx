import React, { createContext, useContext, useCallback } from 'react';
import { useSession } from '../hooks/useSession';
import { authApi } from '../api/auth.api';

const AuthContext = createContext(null);

const ROLE_DEFAULT_ROUTE = {
    INVESTOR: '/investor',
    ADMIN_L1: '/l1-maker',
    ADMIN_L2: '/l2-checker',
    ADMIN_SUPER: '/admin'
};

export const getRoleDefaultRoute = (role) => ROLE_DEFAULT_ROUTE[role] || '/login';

export const AuthProvider = ({ children }) => {
    const { user, isLoading, error, clearSession, updateSession } = useSession();

    const login = useCallback(async (email, password) => {
        const res = await authApi.login(email, password);
        return res.data;
    }, []);

    const verifyOtp = useCallback(async (email, otp) => {
        const res = await authApi.verifyOtp(email, otp);
        const { user: userData } = res.data;
        updateSession(userData);
        return userData;
    }, [updateSession]);

    const logout = useCallback(async () => {
        try {
            await authApi.logout();
        } catch (_) {
            // Ignore errors, still clear client-side session
        }
        clearSession();
    }, [clearSession]);

    const value = {
        user,
        isLoading,
        error,
        isAuthenticated: !!user,
        login,
        verifyOtp,
        logout,
        getRoleDefaultRoute,
        updateSession
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;
