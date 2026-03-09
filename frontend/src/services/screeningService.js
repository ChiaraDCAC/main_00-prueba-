import api from './api';

export const screeningService = {
  performScreening: (clientId, screeningType) => api.post(`/screening/client/${clientId}`, { screeningType }),
  getHistory: (clientId) => api.get(`/screening/history/${clientId}`),
  reviewResult: (resultId, status, reviewNotes) => api.post(`/screening/review/${resultId}`, { status, reviewNotes }),
  runPeriodic: () => api.post('/screening/periodic'),
  getPendingMatches: () => api.get('/screening/pending-matches'),
};
