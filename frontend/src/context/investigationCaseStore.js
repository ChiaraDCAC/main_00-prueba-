import { create } from 'zustand';
import { investigationCaseService } from '../services/investigationCaseService';
import { toast } from 'react-toastify';

// Demo data for investigation cases
const demoCases = [
  {
    id: 'inv-1',
    caseNumber: 'INV-2024-000001',
    alertId: '1',
    clientId: '6',
    title: 'Investigación: Transacción supera umbral mensual',
    description: 'El cliente realizó una transacción de $5.000.000 que supera el umbral configurado de $2.000.000',
    status: 'en_investigacion',
    priority: 'alta',
    analysisNotes: 'Se está analizando el origen de los fondos.',
    riskIndicators: ['monto_elevado', 'sin_justificacion_aparente'],
    mitigatingFactors: [],
    openedAt: '2024-01-25T16:30:00Z',
    lastActivityAt: '2024-01-26T10:00:00Z',
    dueDate: '2024-02-25T16:30:00Z',
    createdBy: 'demo-user-001',
    assignedTo: 'demo-user-001',
    Client: {
      id: '6',
      legalName: 'Comercial del Norte S.A.',
      cuit: '30-87654321-0',
      isPep: false,
      pepDeclarations: [],
    },
    Alert: {
      id: '1',
      alertType: 'umbral_monto',
      severity: 'alta',
      title: 'Transacción supera umbral mensual',
    },
    documentRequests: [
      {
        id: 'req-1',
        requestType: 'origen_fondos',
        description: 'Declaración jurada sobre origen de los fondos transferidos',
        status: 'enviada',
        priority: 'alta',
        sentAt: '2024-01-26T09:00:00Z',
        dueDate: '2024-02-02T09:00:00Z',
      },
    ],
    evidence: [],
  },
  {
    id: 'inv-2',
    caseNumber: 'INV-2024-000002',
    alertId: '2',
    clientId: '7',
    title: 'Investigación: Match en lista PEP',
    description: 'Se encontró coincidencia con lista de Personas Expuestas Políticamente',
    status: 'pendiente_documentacion',
    priority: 'critica',
    analysisNotes: 'Cliente identificado como familiar de funcionario público. Requiere documentación adicional.',
    riskIndicators: ['pep_familiar', 'alto_riesgo'],
    mitigatingFactors: [],
    openedAt: '2024-01-24T12:00:00Z',
    lastActivityAt: '2024-01-25T14:00:00Z',
    dueDate: '2024-02-24T12:00:00Z',
    createdBy: 'demo-user-001',
    assignedTo: 'demo-user-001',
    Client: {
      id: '7',
      legalName: 'Servicios Varios S.R.L.',
      cuit: '30-11223344-5',
      isPep: true,
      pepDeclarations: [
        {
          id: 'pep-decl-1',
          personId: 'auth-1',
          personType: 'authority',
          personName: 'Roberto García',
          personDni: '25456789',
          isPep: true,
          pepPosition: 'Director Nacional de Transporte',
          pepOrganization: 'Ministerio de Transporte',
          pepRelationship: null,
          pepStartDate: '2020-01-15',
          pepEndDate: null,
          status: 'approved',
          documentUrl: '/uploads/pep/ddjj_pep_roberto_garcia.pdf',
          fileName: 'DDJJ_PEP_Roberto_Garcia.pdf',
          declarationDate: '2024-01-10',
          approvedAt: '2024-01-12T10:00:00Z',
        },
        {
          id: 'pep-decl-2',
          personId: 'bo-1',
          personType: 'beneficial_owner',
          personName: 'María García de López',
          personDni: '28123456',
          isPep: true,
          pepPosition: null,
          pepOrganization: null,
          pepRelationship: 'Cónyuge de funcionario público',
          pepStartDate: null,
          pepEndDate: null,
          status: 'pending',
          documentUrl: null,
          fileName: null,
          declarationDate: null,
        },
      ],
    },
    Alert: {
      id: '2',
      alertType: 'screening',
      severity: 'critica',
      title: 'Match en lista PEP',
    },
    documentRequests: [
      {
        id: 'req-2',
        requestType: 'ddjj_patrimonio',
        description: 'Declaración jurada de patrimonio y origen de fondos',
        status: 'pendiente',
        priority: 'alta',
        dueDate: '2024-02-01T12:00:00Z',
      },
      {
        id: 'req-3',
        requestType: 'comprobante_ingresos',
        description: 'Últimos 6 recibos de sueldo o certificación de ingresos',
        status: 'recibida',
        priority: 'media',
        receivedAt: '2024-01-25T14:00:00Z',
        dueDate: '2024-02-01T12:00:00Z',
      },
    ],
    evidence: [
      {
        id: 'ev-1',
        evidenceType: 'documento',
        title: 'Certificación de ingresos',
        description: 'Certificación contable de ingresos del último año fiscal',
        fileName: 'certificacion_ingresos.pdf',
        source: 'cliente',
        relevance: 'alta',
        uploadedAt: '2024-01-25T14:00:00Z',
      },
    ],
  },
];

const demoStats = {
  totalCases: 2,
  openCases: 2,
  closedJustified: 0,
  escalatedSuspicious: 0,
  pendingDocuments: 1,
  byPriority: [
    { priority: 'critica', count: 1 },
    { priority: 'alta', count: 1 },
  ],
};

const DEMO_MODE = true;

export const useInvestigationCaseStore = create((set, get) => ({
  cases: DEMO_MODE ? demoCases : [],
  currentCase: null,
  stats: DEMO_MODE ? demoStats : null,
  loading: false,
  error: null,

  // Cargar lista de casos
  fetchCases: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      if (DEMO_MODE) {
        let filtered = [...demoCases];
        if (params.status) {
          filtered = filtered.filter(c => c.status === params.status);
        }
        if (params.priority) {
          filtered = filtered.filter(c => c.priority === params.priority);
        }
        set({ cases: filtered, loading: false });
        return { success: true, data: filtered };
      }

      const response = await investigationCaseService.list(params);
      set({ cases: response.data.data, loading: false });
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Cargar caso por ID
  fetchCaseById: async (id) => {
    set({ loading: true, error: null });
    try {
      if (DEMO_MODE) {
        const foundCase = demoCases.find(c => c.id === id);
        set({ currentCase: foundCase, loading: false });
        return { success: true, data: foundCase };
      }

      const response = await investigationCaseService.getById(id);
      set({ currentCase: response.data.data, loading: false });
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Crear caso desde alerta
  createFromAlert: async (alertId) => {
    set({ loading: true, error: null });
    try {
      if (DEMO_MODE) {
        const newCase = {
          id: `inv-${Date.now()}`,
          caseNumber: `INV-2024-${String(demoCases.length + 1).padStart(6, '0')}`,
          alertId,
          status: 'abierto',
          priority: 'media',
          title: `Investigación desde alerta ${alertId}`,
          description: 'Caso creado para investigación',
          openedAt: new Date().toISOString(),
          lastActivityAt: new Date().toISOString(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          documentRequests: [],
          evidence: [],
        };
        demoCases.push(newCase);
        set({ currentCase: newCase, cases: [...demoCases], loading: false });
        toast.success('Caso de investigación creado exitosamente');
        return { success: true, data: newCase };
      }

      const response = await investigationCaseService.createFromAlert(alertId);
      set({ currentCase: response.data.data, loading: false });
      toast.success('Caso de investigación creado exitosamente');
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      toast.error('Error al crear caso de investigación');
      return { success: false, error: error.message };
    }
  },

  // Crear caso desde operación inusual
  createFromUnusualOperation: async (unusualOperationId) => {
    set({ loading: true, error: null });
    try {
      if (DEMO_MODE) {
        const newCase = {
          id: `inv-${Date.now()}`,
          caseNumber: `INV-2024-${String(demoCases.length + 1).padStart(6, '0')}`,
          unusualOperationId,
          status: 'abierto',
          priority: 'alta',
          title: `Investigación desde operación inusual`,
          description: 'Caso creado para investigación de operación inusual',
          openedAt: new Date().toISOString(),
          lastActivityAt: new Date().toISOString(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          documentRequests: [],
          evidence: [],
          riskIndicators: [],
          mitigatingFactors: [],
        };
        demoCases.push(newCase);
        set({ currentCase: newCase, cases: [...demoCases], loading: false });
        toast.success('Caso de investigación creado exitosamente');
        return { success: true, data: newCase };
      }

      const response = await investigationCaseService.createFromUnusualOperation(unusualOperationId);
      set({ currentCase: response.data.data, loading: false });
      toast.success('Caso de investigación creado exitosamente');
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      toast.error('Error al crear caso de investigación');
      return { success: false, error: error.message };
    }
  },

  // Actualizar caso
  updateCase: async (id, data) => {
    set({ loading: true, error: null });
    try {
      if (DEMO_MODE) {
        const index = demoCases.findIndex(c => c.id === id);
        if (index !== -1) {
          demoCases[index] = { ...demoCases[index], ...data, lastActivityAt: new Date().toISOString() };
          set({ currentCase: demoCases[index], cases: [...demoCases], loading: false });
        }
        toast.success('Caso actualizado exitosamente');
        return { success: true, data: demoCases[index] };
      }

      const response = await investigationCaseService.update(id, data);
      set({ currentCase: response.data.data, loading: false });
      toast.success('Caso actualizado exitosamente');
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      toast.error('Error al actualizar caso');
      return { success: false, error: error.message };
    }
  },

  // Crear solicitud de documentación
  createDocumentRequest: async (caseId, data) => {
    set({ loading: true, error: null });
    try {
      if (DEMO_MODE) {
        const caseIndex = demoCases.findIndex(c => c.id === caseId);
        if (caseIndex !== -1) {
          const newRequest = {
            id: `req-${Date.now()}`,
            ...data,
            status: 'pendiente',
            createdAt: new Date().toISOString(),
          };
          demoCases[caseIndex].documentRequests.push(newRequest);
          demoCases[caseIndex].status = 'pendiente_documentacion';
          demoCases[caseIndex].lastActivityAt = new Date().toISOString();
          set({ currentCase: { ...demoCases[caseIndex] }, loading: false });
        }
        toast.success('Solicitud de documentación creada');
        return { success: true };
      }

      const response = await investigationCaseService.createDocumentRequest(caseId, data);
      await get().fetchCaseById(caseId);
      toast.success('Solicitud de documentación creada');
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      toast.error('Error al crear solicitud');
      return { success: false, error: error.message };
    }
  },

  // Actualizar solicitud de documentación
  updateDocumentRequest: async (requestId, data) => {
    set({ loading: true, error: null });
    try {
      if (DEMO_MODE) {
        for (const c of demoCases) {
          const reqIndex = c.documentRequests.findIndex(r => r.id === requestId);
          if (reqIndex !== -1) {
            c.documentRequests[reqIndex] = { ...c.documentRequests[reqIndex], ...data };
            c.lastActivityAt = new Date().toISOString();
            set({ currentCase: { ...c }, loading: false });
            break;
          }
        }
        toast.success('Solicitud actualizada');
        return { success: true };
      }

      const response = await investigationCaseService.updateDocumentRequest(requestId, data);
      set({ loading: false });
      toast.success('Solicitud actualizada');
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      toast.error('Error al actualizar solicitud');
      return { success: false, error: error.message };
    }
  },

  // Subir evidencia
  uploadEvidence: async (caseId, formData) => {
    set({ loading: true, error: null });
    try {
      if (DEMO_MODE) {
        const caseIndex = demoCases.findIndex(c => c.id === caseId);
        if (caseIndex !== -1) {
          const newEvidence = {
            id: `ev-${Date.now()}`,
            evidenceType: formData.get('evidenceType'),
            title: formData.get('title'),
            description: formData.get('description'),
            source: formData.get('source') || 'interno',
            relevance: formData.get('relevance') || 'media',
            fileName: formData.get('file')?.name || 'archivo.pdf',
            uploadedAt: new Date().toISOString(),
          };
          demoCases[caseIndex].evidence.push(newEvidence);
          demoCases[caseIndex].lastActivityAt = new Date().toISOString();
          set({ currentCase: { ...demoCases[caseIndex] }, loading: false });
        }
        toast.success('Evidencia agregada exitosamente');
        return { success: true };
      }

      const response = await investigationCaseService.uploadEvidence(caseId, formData);
      await get().fetchCaseById(caseId);
      toast.success('Evidencia agregada exitosamente');
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      toast.error('Error al subir evidencia');
      return { success: false, error: error.message };
    }
  },

  // Cerrar caso como justificado
  closeAsJustified: async (id, data) => {
    set({ loading: true, error: null });
    try {
      if (DEMO_MODE) {
        const index = demoCases.findIndex(c => c.id === id);
        if (index !== -1) {
          demoCases[index] = {
            ...demoCases[index],
            status: 'cerrado_justificado',
            finalDecision: 'justified',
            decisionJustification: data.decisionJustification,
            mitigatingFactors: data.mitigatingFactors || demoCases[index].mitigatingFactors,
            decisionDate: new Date().toISOString(),
            closedAt: new Date().toISOString(),
            lastActivityAt: new Date().toISOString(),
          };
          set({ currentCase: { ...demoCases[index] }, cases: [...demoCases], loading: false });
        }
        toast.success('Caso cerrado como justificado');
        return { success: true };
      }

      const response = await investigationCaseService.closeAsJustified(id, data);
      set({ currentCase: response.data.data, loading: false });
      toast.success('Caso cerrado como justificado');
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      toast.error('Error al cerrar caso');
      return { success: false, error: error.message };
    }
  },

  // Escalar caso como sospechoso
  escalateAsSuspicious: async (id, data) => {
    set({ loading: true, error: null });
    try {
      if (DEMO_MODE) {
        const index = demoCases.findIndex(c => c.id === id);
        if (index !== -1) {
          demoCases[index] = {
            ...demoCases[index],
            status: 'escalado_sospechoso',
            finalDecision: 'suspicious',
            decisionJustification: data.decisionJustification,
            riskIndicators: data.riskIndicators || demoCases[index].riskIndicators,
            decisionDate: new Date().toISOString(),
            closedAt: new Date().toISOString(),
            lastActivityAt: new Date().toISOString(),
          };
          set({ currentCase: { ...demoCases[index] }, cases: [...demoCases], loading: false });
        }
        toast.success('Caso escalado como sospechoso. ROS generado.');
        return { success: true, data: { ros: { reportNumber: 'ROS-2024-000003' } } };
      }

      const response = await investigationCaseService.escalateAsSuspicious(id, data);
      set({ currentCase: response.data.data.investigationCase, loading: false });
      toast.success('Caso escalado como sospechoso. ROS generado.');
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      toast.error('Error al escalar caso');
      return { success: false, error: error.message };
    }
  },

  // Cargar estadísticas
  fetchStats: async () => {
    try {
      if (DEMO_MODE) {
        set({ stats: demoStats });
        return { success: true, data: demoStats };
      }

      const response = await investigationCaseService.getStats();
      set({ stats: response.data.data });
      return response.data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Limpiar caso actual
  clearCurrentCase: () => {
    set({ currentCase: null });
  },
}));
