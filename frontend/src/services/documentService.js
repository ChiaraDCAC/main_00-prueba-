import api from './api';

export const documentService = {
  listByClient: (clientId, params) => api.get(`/documents/client/${clientId}`, { params }),
  upload: (clientId, formData) => api.post(`/documents/client/${clientId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  download: (id) => api.get(`/documents/${id}/download`, { responseType: 'blob' }),
  verify: (id) => api.post(`/documents/${id}/verify`),
  delete: (id, reason) => api.delete(`/documents/${id}`, { data: { reason } }),
  getExpiring: (days) => api.get('/documents/expiring', { params: { days } }),
  updateExpiredStatus: () => api.post('/documents/update-expired'),
};
