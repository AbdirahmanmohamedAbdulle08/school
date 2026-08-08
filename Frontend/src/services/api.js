import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5005/api',
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
            try {
                const { token } = JSON.parse(userInfo);
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
            } catch (e) {
                localStorage.removeItem('userInfo');
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle 401 (unauthorized)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            console.error('Unauthorized access:', error.response.data);
            const msg = error.response.data?.message || '';
            if (
                msg.includes('user not found') ||
                msg.includes('User not found') ||
                msg.includes('token failed') ||
                msg.includes('no token') ||
                msg.includes('Not authorized')
            ) {
                localStorage.removeItem('userInfo');
                window.dispatchEvent(new Event('auth:unauthorized'));
            }
        }
        return Promise.reject(error);
    }
);

export default api;

