import api from './api.js';

export const sendOtp = (data) => api.post('/auth/send-otp', data);
export const verifyOtp = (data) => api.post('/auth/verify-otp', data);
export const logout = (token) => api.post('/auth/logout', {}, {
  headers: { Authorization: `Bearer ${token}` },
});
export const refreshToken = (refreshToken) => api.post('/auth/refresh-token', { refreshToken });
