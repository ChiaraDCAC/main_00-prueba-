import api from './api';

export const sociedadService = {
  list: (params) => api.get('/sociedades', { params }),
  getById: (id) => api.get(`/sociedades/${id}`),
  create: (data) => api.post('/sociedades', data),
  update: (id, data) => api.put(`/sociedades/${id}`, data),
};
