import api from './api';

export const alertService = {
  list: (params) => api.get('/alertas', { params }),
  getById: (id) => api.get(`/alertas/${id}`),
  create: (data) => api.post('/alertas', data),
  resolver: (id) => api.put(`/alertas/${id}/resolver`),
  ignorar: (id) => api.put(`/alertas/${id}/ignorar`),
};
