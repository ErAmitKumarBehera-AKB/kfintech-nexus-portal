import { useState, useCallback } from 'react';
import apiClient from '../api/client';

export const useTickets = () => {
    const [tickets, setTickets] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchTickets = useCallback(async (filters = {}) => {
        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams(filters).toString();
            const res = await apiClient.get(`/tickets?${params}`);
            setTickets(res.data.tickets || []);
            return res.data;
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to fetch tickets';
            setError(msg);
            throw new Error(msg);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchTicketById = useCallback(async (id) => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await apiClient.get(`/tickets/${id}`);
            return res.data;
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to fetch ticket details';
            setError(msg);
            throw new Error(msg);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const createTicket = useCallback(async (formData) => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await apiClient.post('/tickets', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return res.data;
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to create ticket';
            setError(msg);
            throw new Error(msg);
        } finally {
            setIsLoading(false);
        }
    }, []);
    
    const addComment = useCallback(async (id, message, visibility) => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await apiClient.post(`/tickets/${id}/comments`, { message, visibility });
            return res.data;
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to add comment';
            setError(msg);
            throw new Error(msg);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const resubmitTicket = useCallback(async (id, formData) => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await apiClient.post(`/tickets/${id}/resubmit`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return res.data;
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to resubmit ticket';
            setError(msg);
            throw new Error(msg);
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        tickets,
        isLoading,
        error,
        fetchTickets,
        fetchTicketById,
        createTicket,
        addComment,
        resubmitTicket
    };
};
