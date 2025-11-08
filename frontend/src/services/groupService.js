import api from './api.js';

export const getMyGroups = () => api.get('/groups/my-groups');
export const getGroup = (groupId) => api.get(`/groups/${groupId}`);
export const createGroup = (data, avatar = null) => {
  const formData = new FormData();
  Object.keys(data).forEach((key) => {
    if (data[key] !== undefined && data[key] !== null) {
      formData.append(key, data[key]);
    }
  });
  if (avatar) formData.append('avatar', avatar);

  return api.post('/groups', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
export const updateGroup = (groupId, data, avatar = null) => {
  const formData = new FormData();
  Object.keys(data).forEach((key) => {
    if (data[key] !== undefined && data[key] !== null) {
      formData.append(key, data[key]);
    }
  });
  if (avatar) formData.append('avatar', avatar);

  return api.put(`/groups/${groupId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
export const addMembers = (groupId, memberIds) => api.post(`/groups/${groupId}/members`, { memberIds });
export const removeMember = (groupId, userId) => api.delete(`/groups/${groupId}/members/${userId}`);
export const promoteToModerator = (groupId, userId) => api.post(`/groups/${groupId}/moderators/${userId}`);
export const leaveGroup = (groupId) => api.post(`/groups/${groupId}/leave`);
