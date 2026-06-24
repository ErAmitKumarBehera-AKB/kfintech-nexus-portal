import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiClient from '../api/client';

const AuthContext = createContext(null);

const ROLE_DEFAULT_ROUTE = {
    INVESTOR: '/investor',
    ADMIN_L1: '/l1-maker',
    ADMIN_L2: '/l2-checker',
    ADMIN_SUPER: '/admin'
};

export const getRoleDefaultRoute = (role) => ROLE_DEFAULT_ROUTE[role] || '/login';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const restoreSession = async () => {
            const token = localStorage.getItem('kfintech_token');
            if (!token) {
                setIsLoading(false);
                return;
            }

            try {
                const res = await apiClient.get('/auth/me');
                setUser(res.data.user);
            } catch (err) {
                // Token expired or invalid — clear storage
                localStorage.removeItem('kfintech_token');
                localStorage.removeItem('kfintech_user');
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        restoreSession();
    }, []);

    /**
     * login(email, password)
     * Calls POST /api/auth/login, stores the JWT and user profile.
     * Returns the user object so the caller can redirect based on role.
     */
    const login = useCallback(async (email, password) => {
        const res = await apiClient.post('/auth/login', { email, password });
        const { accessToken, user: userData } = res.data;

        localStorage.setItem('kfintech_token', accessToken);
        localStorage.setItem('kfintech_user', JSON.stringify(userData));
        setUser(userData);

        return userData;
    }, []);

    /**
     * logout()
     * Clears session state and localStorage. The caller should navigate to /login.
     */
    const logout = useCallback(async () => {
        try {
            await apiClient.post('/auth/logout');
        } catch (_) {
            // Ignore errors, still clear client-side session
        }
        localStorage.removeItem('kfintech_token');
        localStorage.removeItem('kfintech_user');
        setUser(null);
    }, []);

    const value = {
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        getRoleDefaultRoute
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
