import api from './api';

export const documentService = {
  listBySociedad: (id_sociedad) => api.get(`/documentos/sociedad/${id_sociedad}`),
  crearSlot: (id_sociedad, data) => api.post(`/documentos/sociedad/${id_sociedad}`, data),
  subirVersion: (id_documento, formData) => api.post(`/documentos/${id_documento}/version`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  aprobar: (id_documento, data) => api.put(`/documentos/${id_documento}/aprobar`, data),
  rechazar: (id_documento, data) => api.put(`/documentos/${id_documento}/rechazar`, data),
  observar: (id_documento, data) => api.put(`/documentos/${id_documento}/observar`, data),
};
