import api from './api.js';

export const getChats = () => api.get('/chats');
export const getChat = (chatId) => api.get(`/chats/${chatId}`);
export const createChat = (participantId) => api.post('/chats', { participantId });
export const deleteChat = (chatId) => api.delete(`/chats/${chatId}`);

