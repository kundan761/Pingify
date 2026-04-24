import api from './api.js';

export const getMyGroups = () => api.get('/groups/my-groups');
export const getGroup = (groupId) => api.get(`/groups/${groupId}`);
export const createGroup = (data, avatar = null) => {
  const formData = new FormData();
  Object.keys(data).forEach((key) => {
    if (data[key] !== undefined && data[key] !== null) {
      if (typeof data[key] === 'object' && !(data[key] instanceof File)) {
        formData.append(key, JSON.stringify(data[key]));
      } else {
        formData.append(key, data[key]);
      }
    }
  });
  if (avatar) formData.append('avatar', avatar);
  return api.post('/groups', formData);
};
export const updateGroup = (groupId, data, avatar = null) => {
  const formData = new FormData();
  Object.keys(data).forEach((key) => {
    if (data[key] !== undefined && data[key] !== null) {
      if (typeof data[key] === 'object' && !(data[key] instanceof File)) {
        formData.append(key, JSON.stringify(data[key]));
      } else {
        formData.append(key, data[key]);
      }
    }
  });
  if (avatar) formData.append('avatar', avatar);
  return api.put(`/groups/${groupId}`, formData);
};
export const addMembers = (groupId, memberIds) => api.post(`/groups/${groupId}/members`, { memberIds });
export const removeMember = (groupId, userId) => api.delete(`/groups/${groupId}/members/${userId}`);
export const promoteToModerator = (groupId, userId) => api.post(`/groups/${groupId}/moderators/${userId}`);
export const demoteModerator = (groupId, userId) => api.delete(`/groups/${groupId}/moderators/${userId}`);
export const transferAdmin = (groupId, newAdminId) => api.post(`/groups/${groupId}/transfer-admin`, { newAdminId });
export const deleteGroup = (groupId) => api.delete(`/groups/${groupId}`);
export const leaveGroup = (groupId) => api.post(`/groups/${groupId}/leave`);
