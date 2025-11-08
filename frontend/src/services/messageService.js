import api from './api.js';

export const getMessages = (chatId, limit = 50, before = null) => {
  const params = { limit };
  if (before) params.before = before;
  return api.get(`/messages/chat/${chatId}`, { params });
};

export const sendMessage = (chatId, content, messageType = 'text', replyTo = null, media = null) => {
  const formData = new FormData();
  formData.append('chatId', chatId);
  formData.append('content', content);
  formData.append('messageType', messageType);
  if (replyTo) formData.append('replyTo', replyTo);
  if (media) formData.append('media', media);

  return api.post('/messages', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const editMessage = (messageId, content) => api.put(`/messages/${messageId}`, { content });
export const deleteMessage = (messageId) => api.delete(`/messages/${messageId}`);
export const reactToMessage = (messageId, emoji) => api.post(`/messages/${messageId}/react`, { emoji });
export const markAsRead = (chatId) => api.post(`/messages/chat/${chatId}/read`);

