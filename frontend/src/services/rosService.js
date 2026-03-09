import api from './api';

export const rosService = {
  list: (params) => api.get('/ros', { params }),
  getById: (id) => api.get(`/ros/${id}`),
  update: (id, data) => api.put(`/ros/${id}`, data),
  submit: (id, uifReference) => api.post(`/ros/${id}/submit`, { uifReference }),
  confirm: (id) => api.post(`/ros/${id}/confirm`),
  addEvidence: (id, evidence) => api.post(`/ros/${id}/evidence`, { evidence }),
};
