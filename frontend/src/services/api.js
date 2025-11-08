import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../utils/constants.js';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip refresh logic for refresh-token endpoint and auth endpoints
    const isAuthEndpoint = originalRequest?.url?.includes('/auth/');
    
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post(`${API_BASE_URL}/api/auth/refresh-token`, {
          refreshToken,
        }, {
          headers: {
            'Content-Type': 'application/json',
          },
        });

        // Handle both response formats
        const responseData = response.data?.data || response.data;
        if (responseData && responseData.accessToken) {
          const { accessToken, refreshToken: newRefreshToken } = responseData;
          localStorage.setItem('accessToken', accessToken);
          if (newRefreshToken) {
            localStorage.setItem('refreshToken', newRefreshToken);
          }

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } else {
          throw new Error('Invalid refresh token response');
        }
      } catch (refreshError) {
        // Only redirect if not already on login page
        if (window.location.pathname !== '/auth/login') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/auth/login';
        }
        return Promise.reject(refreshError);
      }
    }

    // Handle validation errors (400)
    if (error.response?.status === 400) {
      const errorData = error.response.data;
      if (errorData.errors && Array.isArray(errorData.errors)) {
        // Show all validation errors
        errorData.errors.forEach((err) => {
          toast.error(err.message || 'Validation error');
        });
      } else {
        const message = errorData.message || 'Validation error';
        toast.error(message);
      }
    } else if (error.response?.status === 401) {
      // Don't show toast for 401 errors - they're handled by redirect
    } else {
      // Handle other errors
      const errorData = error.response?.data || {};
      const message = errorData.message || error.message || 'An error occurred';
      if (error.response?.status !== 401) {
        toast.error(message);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

