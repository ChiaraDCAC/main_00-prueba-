import api from './api';

export const riskService = {
  calculate: (clientId, assessmentType) => api.post(`/risk/calculate/${clientId}`, { assessmentType }),
  getHistory: (clientId) => api.get(`/risk/history/${clientId}`),
  approve: (assessmentId) => api.post(`/risk/approve/${assessmentId}`),
  recalculateExpired: () => api.post('/risk/recalculate-expired'),
  getClientsByRiskLevel: (riskLevel) => api.get(`/risk/clients/${riskLevel}`),

  // Matriz de riesgo
  getMatrix: () => api.get('/risk/matrix'),
  createMatrixEntry: (data) => api.post('/risk/matrix', data),
  updateMatrixEntry: (id, data) => api.put(`/risk/matrix/${id}`, data),
  deleteMatrixEntry: (id) => api.delete(`/risk/matrix/${id}`),
};
