import api from './api';

export const reportService = {
  generateBasePadron: (year, month) => api.get(`/reports/base-padron/${year}/${month}`, { responseType: 'blob' }),
  generateApartados: (year, month) => api.get(`/reports/apartados/${year}/${month}`, { responseType: 'blob' }),
  generateBPReport: (year, month) => api.get(`/reports/bp/${year}/${month}`, { responseType: 'blob' }),
  validateReport: (content, reportType) => api.post('/reports/validate', { content, reportType }),
  getSummary: (year, month) => api.get(`/reports/summary/${year}/${month}`),
};
