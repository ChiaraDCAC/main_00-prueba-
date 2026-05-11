import api from './api';

export const riskService = {
  getEvaluacion:  (id_sociedad) => api.get(`/risk/${id_sociedad}`),
  getHistorial:   (id_sociedad) => api.get(`/risk/${id_sociedad}/historial`),
  getPepDetectado:(id_sociedad) => api.get(`/risk/${id_sociedad}/pep-detectado`),
  guardar: (id_sociedad, data)  => api.post(`/risk/${id_sociedad}`, data),
};

// ─── Cálculo local (mismo algoritmo que el backend) ──────────
// tipo_sociedad: 'monotributista' → humana | cualquier otro → jurídica
export function calcularRiesgoLocal({ personas = [], residencia, nacionalidad, actividad, antiguedad, materialidad, tipo_sociedad }) {
  const es_pep = personas.some(p => p.esPep === true);
  if (es_pep) return { puntaje: 5.00, nivel: 'alto', es_pep: true };

  const esHumana = tipo_sociedad === 'monotributista';
  const puntaje = esHumana
    ? (residencia   || 0) * 0.10 + (nacionalidad || 0) * 0.10 + (actividad || 0) * 0.30 + (antiguedad || 0) * 0.20 + (materialidad || 0) * 0.30
    : (residencia   || 0) * 0.20 +                               (actividad || 0) * 0.30 + (antiguedad || 0) * 0.20 + (materialidad || 0) * 0.30;

  const nivel = puntaje <= 2.00 ? 'bajo' : puntaje <= 3.00 ? 'medio' : 'alto';
  return { puntaje: Math.round(puntaje * 100) / 100, nivel, es_pep: false };
}
