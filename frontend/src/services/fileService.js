import api from './api.js';

export const uploadFile = (file) => {
  const formData = new FormData();
  formData.append('file', file);

  return api.post('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const deleteFile = (publicId) => api.delete('/files', { 
  data: { publicId } 
});
