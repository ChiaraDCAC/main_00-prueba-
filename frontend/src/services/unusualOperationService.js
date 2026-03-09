import api from './api';

export const unusualOperationService = {
  list: (params) => api.get('/unusual-operations', { params }),
  getById: (id) => api.get(`/unusual-operations/${id}`),
  create: (data) => api.post('/unusual-operations', data),
  createFromAlert: (alertId) => api.post(`/unusual-operations/from-alert/${alertId}`),
  analyze: (id, analysis) => api.post(`/unusual-operations/${id}/analyze`, { analysis }),
  markAsJustified: (id, conclusion) => api.post(`/unusual-operations/${id}/justify`, { conclusion }),
  markAsSuspicious: (id, data) => api.post(`/unusual-operations/${id}/suspicious`, data),
};
