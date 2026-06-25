import axios from 'axios';

// Create an Axios instance pointing to the Node.js CRM Backend
const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request Interceptor: attach the real JWT token from localStorage on every request
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('kfintech_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor: handle 401 Unauthorized globally
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            // Avoid infinite loops if the refresh endpoint itself returns 401
            if (originalRequest.url.includes('/auth/refresh') || originalRequest.url.includes('/auth/login')) {
                localStorage.removeItem('kfintech_token');
                localStorage.removeItem('kfintech_user');
                if (!window.location.pathname.includes('/login')) {
                    window.location.href = '/login';
                }
                return Promise.reject(error);
            }

            try {
                // Attempt to refresh the token using the httpOnly cookie
                const res = await axios.post(
                    `${apiClient.defaults.baseURL}/auth/refresh`,
                    {},
                    { withCredentials: true }
                );

                const newAccessToken = res.data.accessToken;
                localStorage.setItem('kfintech_token', newAccessToken);

                // Update the failed request with the new token and retry
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return apiClient(originalRequest);
            } catch (refreshError) {
                // Refresh token invalid or expired
                localStorage.removeItem('kfintech_token');
                localStorage.removeItem('kfintech_user');
                if (!window.location.pathname.includes('/login')) {
                    window.location.href = '/login';
                }
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient;
