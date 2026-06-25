import axios from 'axios';

// Create an Axios instance pointing to the Node.js CRM Backend
const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
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
// If the server rejects the token (expired, invalid), clear the session and redirect to login
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Avoid redirect loops on the login page itself
            if (!window.location.pathname.includes('/login')) {
                localStorage.removeItem('kfintech_token');
                localStorage.removeItem('kfintech_user');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient;
