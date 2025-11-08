export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  VIDEO: 'video',
  FILE: 'file',
  AUDIO: 'audio',
};

export const CHAT_TYPES = {
  PRIVATE: 'private',
  GROUP: 'group',
};

export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
};

