import api from './api.js';

export const login = (credentials) => api.post('/auth/login', credentials);
export const register = (userData) => api.post('/auth/register', userData);
export const logout = (token) => api.post('/auth/logout', {}, {
  headers: { Authorization: `Bearer ${token}` },
});
export const refreshToken = (refreshToken) => api.post('/auth/refresh-token', { refreshToken });
export const forgotPassword = (email) => api.post('/auth/forgot-password', { email });
export const resetPassword = (token, password) => api.post('/auth/reset-password', { token, password });
export const verifyEmail = (token) => api.get(`/auth/verify-email?token=${token}`);

