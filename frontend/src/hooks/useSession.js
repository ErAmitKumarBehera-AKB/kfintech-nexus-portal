import { useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/auth.api';

export const useSession = () => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const restoreSession = async () => {
            try {
                setIsLoading(true);
                const res = await authApi.getMe();
                setUser(res.data.user);
                setError(null);
            } catch (err) {
                // Token expired or invalid
                localStorage.removeItem('kfintech_user');
                setUser(null);
                setError(err);
            } finally {
                setIsLoading(false);
            }
        };

        restoreSession();
    }, []);

    const clearSession = useCallback(() => {
        localStorage.removeItem('kfintech_user');
        setUser(null);
    }, []);

    const updateSession = useCallback((userData) => {
        localStorage.setItem('kfintech_user', JSON.stringify(userData));
        setUser(userData);
    }, []);

    return { user, isLoading, error, clearSession, updateSession };
};
