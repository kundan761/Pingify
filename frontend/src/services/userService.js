import api from './api.js';

export const getProfile = () => api.get('/users/profile');
export const updateProfile = (data, avatar = null) => {
  const formData = new FormData();
  Object.keys(data).forEach((key) => {
    if (data[key] !== undefined && data[key] !== null) {
      formData.append(key, data[key]);
    }
  });
  if (avatar) formData.append('avatar', avatar);

  return api.put('/users/profile', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
export const searchUsers = (query) => api.get('/users/search', { params: { q: query } });
export const blockUser = (userId) => api.post(`/users/block/${userId}`);
export const unblockUser = (userId) => api.post(`/users/unblock/${userId}`);
export const getBlockedUsers = () => api.get('/users/blocked');

