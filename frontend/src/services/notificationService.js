import api from './api.js';

export const getNotifications = () => api.get('/notifications');
export const markAsRead = (notificationId) => api.put(`/notifications/${notificationId}/read`);
export const markAllAsRead = () => api.put('/notifications/read-all');
export const deleteNotification = (notificationId) => api.delete(`/notifications/${notificationId}`);

