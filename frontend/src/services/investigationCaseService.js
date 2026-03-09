import api from './api';

export const investigationCaseService = {
  // Casos de investigación
  list: (params) => api.get('/investigation-cases', { params }),
  getById: (id) => api.get(`/investigation-cases/${id}`),
  update: (id, data) => api.put(`/investigation-cases/${id}`, data),
  createFromAlert: (alertId) => api.post(`/investigation-cases/from-alert/${alertId}`),
  createFromUnusualOperation: (unusualOperationId) =>
    api.post(`/investigation-cases/from-unusual-operation/${unusualOperationId}`),
  getStats: () => api.get('/investigation-cases/stats'),

  // Solicitudes de documentación
  createDocumentRequest: (caseId, data) =>
    api.post(`/investigation-cases/${caseId}/requests`, data),
  updateDocumentRequest: (requestId, data) =>
    api.put(`/investigation-cases/requests/${requestId}`, data),

  // Evidencia
  uploadEvidence: (caseId, formData) =>
    api.post(`/investigation-cases/${caseId}/evidence`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // Decisiones finales
  closeAsJustified: (id, data) =>
    api.post(`/investigation-cases/${id}/close-justified`, data),
  escalateAsSuspicious: (id, data) =>
    api.post(`/investigation-cases/${id}/escalate-suspicious`, data),
};
