import apiClient from './client';

export const authApi = {
    login: (email, password) => apiClient.post('/auth/login', { email, password }),
    verifyOtp: (email, otp) => apiClient.post('/auth/verify-otp', { email, otp }),
    logout: () => apiClient.post('/auth/logout'),
    getMe: () => apiClient.get('/auth/me'),
    register: (data) => apiClient.post('/auth/register', data),
    forgotPassword: (email) => apiClient.post('/auth/forgot-password', { email }),
    resetPassword: (email, otp, newPassword) => apiClient.post('/auth/reset-password', { email, otp, newPassword }),
    changePassword: (currentPassword, newPassword) => apiClient.post('/auth/change-password', { currentPassword, newPassword }),
    updateProfile: (data) => apiClient.put('/auth/profile', data),
    generate2FA: () => apiClient.post('/auth/2fa/generate'),
    verify2FA: (token) => apiClient.post('/auth/2fa/verify', { token }),
    generateEmail2FA: () => apiClient.post('/auth/2fa/email/generate'),
    verifyEmail2FA: (otp) => apiClient.post('/auth/2fa/email/verify', { otp })
};
