import api from './api';

export const alertService = {
  list: (params) => api.get('/alerts', { params }),
  getById: (id) => api.get(`/alerts/${id}`),
  assign: (id, assignedTo) => api.post(`/alerts/${id}/assign`, { assignedTo }),
  resolve: (id, resolution) => api.post(`/alerts/${id}/resolve`, { resolution }),
  escalate: (id, reason) => api.post(`/alerts/${id}/escalate`, { reason }),
  getStats: () => api.get('/alerts/stats'),
};
