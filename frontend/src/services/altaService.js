import api from './api';

export const altaService = {
  obtenerEstado: (id_sociedad) => api.get(`/alta/${id_sociedad}/estado`),
  historial: (id_sociedad) => api.get(`/alta/${id_sociedad}/historial`),
  iniciar: (id_sociedad) => api.post(`/alta/${id_sociedad}/iniciar`),
  guardarBorrador: (id_sociedad, data) => api.put(`/alta/${id_sociedad}/guardar`, data),
  avanzar: (id_sociedad, data) => api.put(`/alta/${id_sociedad}/avanzar`, data),
  generarCVU: (id_sociedad, data) => api.post(`/alta/${id_sociedad}/cvu`, data),
};
