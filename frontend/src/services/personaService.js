import api from './api';

export const personaService = {
  directorio: (params) => api.get('/personas', { params }),
  listBySociedad: (id_sociedad) => api.get(`/personas/sociedad/${id_sociedad}`),
  getById: (id) => api.get(`/personas/${id}`),
  crear: (id_sociedad, data) => api.post(`/personas/sociedad/${id_sociedad}`, data),
  actualizar: (id, data) => api.put(`/personas/${id}`, data),
  desvincular: (id_tag) => api.delete(`/personas/vinculacion/${id_tag}`),
};
