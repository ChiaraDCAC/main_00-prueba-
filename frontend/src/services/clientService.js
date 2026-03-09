import api from './api';

// Demo mode - hardcoded for testing
const DEMO_MODE = false;

// IDs fijos de clientes hardcodeados (no se persisten)
const HARDCODED_IDS = new Set(['1', '2', '3', '4', '5']);
const DEMO_PERSIST_KEY = 'demo_created_clients_v1';

const _loadPersistedClients = () => {
  try {
    const raw = localStorage.getItem(DEMO_PERSIST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

const _persistCreatedClients = () => {
  try {
    const created = demoClients.filter(c => !HARDCODED_IDS.has(String(c.id)));
    localStorage.setItem(DEMO_PERSIST_KEY, JSON.stringify(created));
  } catch {}
};

let demoClients = [
  {
    id: '1',
    clientType: 'persona_juridica',
    legalForm: 'sa',
    status: 'pendiente',
    cuit: '30-71234567-8',
    legalName: 'Inversiones del Sur S.A.',
    tradeName: 'INVERSUR',
    createdAt: '2024-01-15T10:00:00Z',
    riskLevel: 'medio',
    documents: {
      estatuto: { dataUrl: 'data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKL01lZGlhQm94IFswIDAgNjEyIDc5Ml0KPj4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMSA0IDAgUgo+Pgo+PgovQ29udGVudHMgNSAwIFIKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iago1IDAgb2JqCjw8Ci9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCi9GMSAxOCBUZgo1MCA3MDAgVGQKKEVzdGF0dXRvIFNvY2lhbCAtIEludmVyc2lvbmVzIGRlbCBTdXIgUy5BLikgVGoKRVQKZW5kc3RyZWFtCmVuZG9iagp4cmVmCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMDkgMDAwMDAgbiAKMDAwMDAwMDA1OCAwMDAwMCBuIAowMDAwMDAwMTQ3IDAwMDAwIG4gCjAwMDAwMDAyNzYgMDAwMDAgbiAKMDAwMDAwMDM1NSAwMDAwMCBuIAp0cmFpbGVyCjw8Ci9TaXplIDYKL1Jvb3QgMSAwIFIKPj4Kc3RhcnR4cmVmCjQ1MQolJUVPRg==', name: 'estatuto_inversur.pdf' },
      acta_autoridades: { dataUrl: 'data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKL01lZGlhQm94IFswIDAgNjEyIDc5Ml0KPj4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMSA0IDAgUgo+Pgo+PgovQ29udGVudHMgNSAwIFIKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iago1IDAgb2JqCjw8Ci9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCi9GMSAxOCBUZgo1MCA3MDAgVGQKKEFjdGEgZGUgQXV0b3JpZGFkZXMgLSBJbnZlcnNpb25lcyBkZWwgU3VyIFMuQS4pIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAwNTggMDAwMDAgbiAKMDAwMDAwMDE0NyAwMDAwMCBuIAowMDAwMDAwMjc2IDAwMDAwIG4gCjAwMDAwMDAzNTUgMDAwMDAgbiAKdHJhaWxlcgo8PAovU2l6ZSA2Ci9Sb290IDEgMCBSCj4+CnN0YXJ0eHJlZgo0NTEKJSVFT0Y=', name: 'acta_directorio_2024.pdf' },
      registro_accionistas: { dataUrl: 'data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKL01lZGlhQm94IFswIDAgNjEyIDc5Ml0KPj4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMSA0IDAgUgo+Pgo+PgovQ29udGVudHMgNSAwIFIKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iago1IDAgb2JqCjw8Ci9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCi9GMSAxOCBUZgo1MCA3MDAgVGQKKFJlZ2lzdHJvIGRlIEFjY2lvbmlzdGFzIC0gSW52ZXJzaW9uZXMgZGVsIFN1ciBTLkEuKSBUagpFVAplbmRzdHJlYW0KZW5kb2JqCnhyZWYKMCA2CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAwOSAwMDAwMCBuIAowMDAwMDAwMDU4IDAwMDAwIG4gCjAwMDAwMDAxNDcgMDAwMDAgbiAKMDAwMDAwMDI3NiAwMDAwMCBuIAowMDAwMDAwMzU1IDAwMDAwIG4gCnRyYWlsZXIKPDwKL1NpemUgNgovUm9vdCAxIDAgUgo+PgpzdGFydHhyZWYKNDUxCiUlRU9G', name: 'libro_accionistas.pdf' },
      poder_administracion: { dataUrl: 'data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKL01lZGlhQm94IFswIDAgNjEyIDc5Ml0KPj4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMSA0IDAgUgo+Pgo+PgovQ29udGVudHMgNSAwIFIKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iago1IDAgb2JqCjw8Ci9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCi9GMSAxOCBUZgo1MCA3MDAgVGQKKFBvZGVyIEdlbmVyYWwgZGUgQWRtaW5pc3RyYWNpw7NuIC0gSW52ZXJzaW9uZXMgZGVsIFN1ciBTLkEuKSBUagpFVAplbmRzdHJlYW0KZW5kb2JqCnhyZWYKMCA2CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAwOSAwMDAwMCBuIAowMDAwMDAwMDU4IDAwMDAwIG4gCjAwMDAwMDAxNDcgMDAwMDAgbiAKMDAwMDAwMDI3NiAwMDAwMCBuIAowMDAwMDAwMzU1IDAwMDAwIG4gCnRyYWlsZXIKPDwKL1NpemUgNgovUm9vdCAxIDAgUgo+PgpzdGFydHhyZWYKNDUxCiUlRU9G', name: 'poder_administracion.pdf' },
      constancia_cuit: { dataUrl: 'data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKL01lZGlhQm94IFswIDAgNjEyIDc5Ml0KPj4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMSA0IDAgUgo+Pgo+PgovQ29udGVudHMgNSAwIFIKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iago1IDAgb2JqCjw8Ci9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCi9GMSAxOCBUZgo1MCA3MDAgVGQKKENvbnN0YW5jaWEgQ1VJVCAtIDMwLTcxMjM0NTY3LTgpIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAwNTggMDAwMDAgbiAKMDAwMDAwMDE0NyAwMDAwMCBuIAowMDAwMDAwMjc2IDAwMDAwIG4gCjAwMDAwMDAzNTUgMDAwMDAgbiAKdHJhaWxlcgo8PAovU2l6ZSA2Ci9Sb290IDEgMCBSCj4+CnN0YXJ0eHJlZgo0NTEKJSVFT0Y=', name: 'constancia_afip.pdf' },
    },
    beneficialOwners: [
      { id: '1', firstName: 'Juan Carlos', lastName: 'Méndez', dni: '12345678', cuit: '20-12345678-9', email: 'jmendez@inversur.com', ownershipPercentage: 60 },
      { id: '2', firstName: 'María Laura', lastName: 'González', dni: '23456789', cuit: '27-23456789-0', email: 'mgonzalez@inversur.com', ownershipPercentage: 40 },
    ],
    signatories: [
      { id: '1', firstName: 'Juan Carlos', lastName: 'Méndez', dni: '12345678', cuit: '20-12345678-9', email: 'jmendez@inversur.com', position: 'firmante_contratos' },
    ],
    attorneys: [
      { id: '1', firstName: 'Dr. Roberto', lastName: 'Silva', dni: '11223344', cuit: '20-11223344-5', email: 'rsilva@estudio.com', powerType: 'general' },
    ],
    authorities: [
      { id: '1', firstName: 'Juan Carlos', lastName: 'Méndez', dni: '12345678', cuit: '20-12345678-9', email: 'jmendez@inversur.com', position: 'presidente' },
      { id: '2', firstName: 'María Laura', lastName: 'González', dni: '23456789', cuit: '27-23456789-0', email: 'mgonzalez@inversur.com', position: 'director' },
    ],
  },
  {
    id: '2',
    clientType: 'persona_juridica',
    legalForm: 'srl',
    status: 'pendiente',
    cuit: '30-65432109-7',
    legalName: 'Tecnología Aplicada S.R.L.',
    tradeName: 'TECNOAP',
    createdAt: '2024-01-18T14:30:00Z',
    riskLevel: 'bajo',
    documents: {
      contrato_social: { dataUrl: 'data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKL01lZGlhQm94IFswIDAgNjEyIDc5Ml0KPj4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMSA0IDAgUgo+Pgo+PgovQ29udGVudHMgNSAwIFIKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iago1IDAgb2JqCjw8Ci9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCi9GMSAxOCBUZgo1MCA3MDAgVGQKKENvbnRyYXRvIFNvY2lhbCAtIFRlY25vbG9nw61hIEFwbGljYWRhIFMuUi5MLikgVGoKRVQKZW5kc3RyZWFtCmVuZG9iagp4cmVmCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMDkgMDAwMDAgbiAKMDAwMDAwMDA1OCAwMDAwMCBuIAowMDAwMDAwMTQ3IDAwMDAwIG4gCjAwMDAwMDAyNzYgMDAwMDAgbiAKMDAwMDAwMDM1NSAwMDAwMCBuIAp0cmFpbGVyCjw8Ci9TaXplIDYKL1Jvb3QgMSAwIFIKPj4Kc3RhcnR4cmVmCjQ1MQolJUVPRg==', name: 'contrato_social.pdf' },
      acta_asamblea_srl: { dataUrl: 'data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKL01lZGlhQm94IFswIDAgNjEyIDc5Ml0KPj4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMSA0IDAgUgo+Pgo+PgovQ29udGVudHMgNSAwIFIKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iago1IDAgb2JqCjw8Ci9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCi9GMSAxOCBUZgo1MCA3MDAgVGQKKEFjdGEgZGUgQXNhbWJsZWEgLSBUZWNub2xvZ8OtYSBBcGxpY2FkYSBTLlIuTC4pIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAwNTggMDAwMDAgbiAKMDAwMDAwMDE0NyAwMDAwMCBuIAowMDAwMDAwMjc2IDAwMDAwIG4gCjAwMDAwMDAzNTUgMDAwMDAgbiAKdHJhaWxlcgo8PAovU2l6ZSA2Ci9Sb290IDEgMCBSCj4+CnN0YXJ0eHJlZgo0NTEKJSVFT0Y=', name: 'acta_asamblea_srl.pdf' },
      registro_socios_srl: { dataUrl: 'data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKL01lZGlhQm94IFswIDAgNjEyIDc5Ml0KPj4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMSA0IDAgUgo+Pgo+PgovQ29udGVudHMgNSAwIFIKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iago1IDAgb2JqCjw8Ci9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCi9GMSAxOCBUZgo1MCA3MDAgVGQKKFJlZ2lzdHJvIGRlIFNvY2lvcyAtIFRlY25vbG9nw61hIEFwbGljYWRhIFMuUi5MLikgVGoKRVQKZW5kc3RyZWFtCmVuZG9iagp4cmVmCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMDkgMDAwMDAgbiAKMDAwMDAwMDA1OCAwMDAwMCBuIAowMDAwMDAwMTQ3IDAwMDAwIG4gCjAwMDAwMDAyNzYgMDAwMDAgbiAKMDAwMDAwMDM1NSAwMDAwMCBuIAp0cmFpbGVyCjw8Ci9TaXplIDYKL1Jvb3QgMSAwIFIKPj4Kc3RhcnR4cmVmCjQ1MQolJUVPRg==', name: 'registro_socios_srl.pdf' },
    },
    beneficialOwners: [
      { id: '1', firstName: 'Roberto', lastName: 'Sánchez', dni: '34567890', cuit: '20-34567890-1', email: 'rsanchez@tecnoap.com', ownershipPercentage: 50 },
      { id: '2', firstName: 'Ana', lastName: 'Martínez', dni: '45678901', cuit: '27-45678901-2', email: 'amartinez@tecnoap.com', ownershipPercentage: 50 },
    ],
    signatories: [],
    attorneys: [],
    authorities: [
      { id: '1', firstName: 'Roberto', lastName: 'Sánchez', dni: '34567890', cuit: '20-34567890-1', email: 'rsanchez@tecnoap.com', position: 'socio_gerente' },
    ],
  },
  {
    id: '3',
    clientType: 'persona_juridica',
    legalForm: 'sh',
    status: 'pendiente',
    cuit: '30-98765432-1',
    legalName: 'López y Hermanos SH',
    createdAt: '2024-01-22T09:00:00Z',
    riskLevel: 'medio',
    documents: {
      contrato_privado: { dataUrl: 'data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKL01lZGlhQm94IFswIDAgNjEyIDc5Ml0KPj4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMSA0IDAgUgo+Pgo+PgovQ29udGVudHMgNSAwIFIKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iago1IDAgb2JqCjw8Ci9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCi9GMSAxOCBUZgo1MCA3MDAgVGQKKENvbnRyYXRvIFNvY2lhbCBQcml2YWRvIC0gTMOzcGV6IHkgSGVybWFub3MgU0gpIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAwNTggMDAwMDAgbiAKMDAwMDAwMDE0NyAwMDAwMCBuIAowMDAwMDAwMjc2IDAwMDAwIG4gCjAwMDAwMDAzNTUgMDAwMDAgbiAKdHJhaWxlcgo8PAovU2l6ZSA2Ci9Sb290IDEgMCBSCj4+CnN0YXJ0eHJlZgo0NTEKJSVFT0Y=', name: 'contrato_privado.pdf' },
      dni_socios: { dataUrl: 'data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKL01lZGlhQm94IFswIDAgNjEyIDc5Ml0KPj4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMSA0IDAgUgo+Pgo+PgovQ29udGVudHMgNSAwIFIKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iago1IDAgb2JqCjw8Ci9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCi9GMSAxOCBUZgo1MCA3MDAgVGQKKEROSSBkZSB0b2RvcyBsb3Mgc29jaW9zIC0gTMOzcGV6IHkgSGVybWFub3MgU0gpIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAwNTggMDAwMDAgbiAKMDAwMDAwMDE0NyAwMDAwMCBuIAowMDAwMDAwMjc2IDAwMDAwIG4gCjAwMDAwMDAzNTUgMDAwMDAgbiAKdHJhaWxlcgo8PAovU2l6ZSA2Ci9Sb290IDEgMCBSCj4+CnN0YXJ0eHJlZgo0NTEKJSVFT0Y=', name: 'dni_socios.pdf' },
    },
    beneficialOwners: [
      { id: '1', firstName: 'Miguel', lastName: 'López', dni: '22334455', cuit: '20-22334455-6', email: 'mlopez@lopezyhnos.com', ownershipPercentage: 33.33 },
      { id: '2', firstName: 'Carlos', lastName: 'López', dni: '22334456', cuit: '20-22334456-7', email: 'clopez@lopezyhnos.com', ownershipPercentage: 33.33 },
      { id: '3', firstName: 'Fernando', lastName: 'López', dni: '22334457', cuit: '20-22334457-8', email: 'flopez@lopezyhnos.com', ownershipPercentage: 33.34 },
    ],
    signatories: [
      { id: '1', firstName: 'Miguel', lastName: 'López', dni: '22334455', cuit: '20-22334455-6', email: 'mlopez@lopezyhnos.com', position: 'firmante_contratos' },
    ],
    attorneys: [
      { id: '1', firstName: 'Dra. Patricia', lastName: 'Gómez', dni: '33445566', cuit: '27-33445566-7', email: 'pgomez@estudio.com', powerType: 'especial' },
    ],
    authorities: [],
  },
  {
    id: '4',
    clientType: 'persona_humana',
    legalForm: 'monotributista',
    status: 'pendiente',
    cuit: '20-28456789-3',
    firstName: 'Carlos Alberto',
    lastName: 'Fernández',
    legalName: 'Carlos Alberto Fernández',
    createdAt: '2024-01-25T11:00:00Z',
    riskLevel: 'bajo',
    documents: {
      ddjj_pep_monotributo: { dataUrl: 'data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKL01lZGlhQm94IFswIDAgNjEyIDc5Ml0KPj4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMSA0IDAgUgo+Pgo+PgovQ29udGVudHMgNSAwIFIKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iago1IDAgb2JqCjw8Ci9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCi9GMSAxOCBUZgo1MCA3MDAgVGQKKERlY2xhcmFjacOzbiBKdXJhZGEgUEVQIC0gQ2FybG9zIEFsYmVydG8gRmVybsOhbmRleikgVGoKRVQKZW5kc3RyZWFtCmVuZG9iagp4cmVmCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMDkgMDAwMDAgbiAKMDAwMDAwMDA1OCAwMDAwMCBuIAowMDAwMDAwMTQ3IDAwMDAwIG4gCjAwMDAwMDAyNzYgMDAwMDAgbiAKMDAwMDAwMDM1NSAwMDAwMCBuIAp0cmFpbGVyCjw8Ci9TaXplIDYKL1Jvb3QgMSAwIFIKPj4Kc3RhcnR4cmVmCjQ1MQolJUVPRg==', name: 'ddjj_pep_monotributo.pdf' },
    },
    beneficialOwners: [],
    signatories: [],
    attorneys: [],
    authorities: [],
  },
  {
    id: '5',
    clientType: 'persona_juridica',
    legalForm: 'sucesion',
    status: 'pendiente',
    cuit: '30-55667788-9',
    legalName: 'Sucesión de María Elena Rodríguez',
    createdAt: '2024-01-28T14:30:00Z',
    riskLevel: 'alto',
    documents: {
      declaratoria_herederos: { dataUrl: 'data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKL01lZGlhQm94IFswIDAgNjEyIDc5Ml0KPj4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMSA0IDAgUgo+Pgo+PgovQ29udGVudHMgNSAwIFIKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iago1IDAgb2JqCjw8Ci9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCi9GMSAxOCBUZgo1MCA3MDAgVGQKKERlY2xhcmF0b3JpYSBkZSBIZXJlZGVyb3MgLSBTdWNlc2nDs24gUm9kcsOtZ3VleikgVGoKRVQKZW5kc3RyZWFtCmVuZG9iagp4cmVmCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMDkgMDAwMDAgbiAKMDAwMDAwMDA1OCAwMDAwMCBuIAowMDAwMDAwMTQ3IDAwMDAwIG4gCjAwMDAwMDAyNzYgMDAwMDAgbiAKMDAwMDAwMDM1NSAwMDAwMCBuIAp0cmFpbGVyCjw8Ci9TaXplIDYKL1Jvb3QgMSAwIFIKPj4Kc3RhcnR4cmVmCjQ1MQolJUVPRg==', name: 'declaratoria_herederos.pdf' },
      ficha_sucesion: { dataUrl: 'data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKL01lZGlhQm94IFswIDAgNjEyIDc5Ml0KPj4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMSA0IDAgUgo+Pgo+PgovQ29udGVudHMgNSAwIFIKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iago1IDAgb2JqCjw8Ci9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCi9GMSAxOCBUZgo1MCA3MDAgVGQKKEZpY2hhIGRlIFN1Y2VzacOzbiAtIFJlc3VtZW4gQ29tcGxpYW5jZSkgVGoKRVQKZW5kc3RyZWFtCmVuZG9iagp4cmVmCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMDkgMDAwMDAgbiAKMDAwMDAwMDA1OCAwMDAwMCBuIAowMDAwMDAwMTQ3IDAwMDAwIG4gCjAwMDAwMDAyNzYgMDAwMDAgbiAKMDAwMDAwMDM1NSAwMDAwMCBuIAp0cmFpbGVyCjw8Ci9TaXplIDYKL1Jvb3QgMSAwIFIKPj4Kc3RhcnR4cmVmCjQ1MQolJUVPRg==', name: 'ficha_sucesion.pdf' },
      dni_herederos: { dataUrl: 'data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKL01lZGlhQm94IFswIDAgNjEyIDc5Ml0KPj4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMSA0IDAgUgo+Pgo+PgovQ29udGVudHMgNSAwIFIKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iago1IDAgb2JqCjw8Ci9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCi9GMSAxOCBUZgo1MCA3MDAgVGQKKEROSSBkZSBIZXJlZGVyb3MgLSBTdWNlc2nDs24gUm9kcsOtZ3VleikgVGoKRVQKZW5kc3RyZWFtCmVuZG9iagp4cmVmCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMDkgMDAwMDAgbiAKMDAwMDAwMDA1OCAwMDAwMCBuIAowMDAwMDAwMTQ3IDAwMDAwIG4gCjAwMDAwMDAyNzYgMDAwMDAgbiAKMDAwMDAwMDM1NSAwMDAwMCBuIAp0cmFpbGVyCjw8Ci9TaXplIDYKL1Jvb3QgMSAwIFIKPj4Kc3RhcnR4cmVmCjQ1MQolJUVPRg==', name: 'dni_herederos.pdf' },
    },
    beneficialOwners: [
      { id: '1', firstName: 'Juan Pablo', lastName: 'Rodríguez', dni: '25678901', cuit: '20-25678901-2', email: 'jprodriguez@email.com', ownershipPercentage: 50 },
      { id: '2', firstName: 'Ana María', lastName: 'Rodríguez', dni: '25678902', cuit: '27-25678902-3', email: 'amrodriguez@email.com', ownershipPercentage: 50 },
    ],
    signatories: [],
    attorneys: [
      { id: '1', firstName: 'Dr. Martín', lastName: 'García', dni: '18765432', cuit: '20-18765432-1', email: 'mgarcia@estudio.com', powerType: 'judicial' },
    ],
    authorities: [],
  },
];

// Merge hardcoded clients with any previously created ones from localStorage
demoClients = [...demoClients, ..._loadPersistedClients()];

export const clientService = {
  list: (params) => {
    if (DEMO_MODE) {
      let filtered = [...demoClients];
      if (params?.status) {
        filtered = filtered.filter(c => c.status === params.status);
      }
      if (params?.clientType) {
        filtered = filtered.filter(c => c.clientType === params.clientType || c.legalForm === params.clientType);
      }
      if (params?.riskLevel) {
        filtered = filtered.filter(c => c.riskLevel === params.riskLevel);
      }
      if (params?.search) {
        const q = params.search.toLowerCase();
        filtered = filtered.filter(c =>
          c.legalName?.toLowerCase().includes(q) ||
          c.cuit?.toLowerCase().includes(q) ||
          String(c.id).includes(q)
        );
      }
      return Promise.resolve({
        data: {
          success: true,
          data: filtered,
          pagination: { total: filtered.length, page: 1, limit: 20, totalPages: 1 }
        }
      });
    }
    return api.get('/clients', { params });
  },
  getAccepted: () => {
    if (DEMO_MODE) {
      return Promise.resolve({ data: { success: true, data: [], pagination: { total: 0 } } });
    }
    return api.get('/clients', { params: { status: 'aprobado', limit: 100 } });
  },
  getById: (id) => {
    if (DEMO_MODE) {
      const client = demoClients.find(c => c.id === id);
      return Promise.resolve({ data: { success: true, data: client || null } });
    }
    return api.get(`/clients/${id}`);
  },
  create: (data) => {
    if (DEMO_MODE) {
      const allData = {};
      if (data.formData) Object.values(data.formData).forEach(d => Object.assign(allData, d));
      const cuit = data.datosSociedad?.cuit || allData.sa_cuit || allData.srl_cuit || '';
      // Validar duplicado por CUIT — solo bloquea si ya existe uno aprobado/activo
      if (cuit) {
        const existente = demoClients.find(c => c.cuit === cuit && c.status === 'aprobado');
        if (existente) {
          return Promise.reject({
            response: { data: { message: `Ya existe un cliente activo con CUIT ${cuit} (${existente.legalName}). No se puede dar de alta dos veces.` } }
          });
        }
      }
      const newClient = {
        id: String(Date.now()).slice(-6),
        clientType: data.clientType || 'persona_juridica',
        legalForm: data.legalForm,
        legalName: data.datosSociedad?.razonSocial || allData.denominacion_social || allData.srl_razon_social || 'Nuevo Cliente',
        cuit,
        status: data.status || 'pendiente',
        riskLevel: data.riskLevel || 'medio',
        createdAt: new Date().toISOString(),
        solicitudAt: new Date().toISOString(),
        docsRevisadasAt: data.status === 'aprobado' ? new Date().toISOString() : null,
        aprobadoAt: data.status === 'aprobado' ? new Date().toISOString() : null,
        // Full onboarding data stored for ClientDetail
        datosSociedad: data.datosSociedad || {},
        formData: data.formData || {},
        dd: data.dd || {},
        riskFactors: data.riskFactors || {},
        comentariosInternos: data.comentariosInternos || [],
        personas: data.personas || [],
        authorities: data.authorities || [],
        beneficialOwners: [],
        signatories: [],
        attorneys: [],
        documents: data.uploadedDocsData || {},
      };
      demoClients.push(newClient);
      _persistCreatedClients();
      console.info('[DEMO] Cliente creado:', newClient.id, newClient.legalName);
      return Promise.resolve({ data: { success: true, data: newClient } });
    }
    return api.post('/clients', data);
  },
  update: (id, data) => {
    if (DEMO_MODE) {
      const idx = demoClients.findIndex(c => c.id === id);
      if (idx !== -1) {
        demoClients[idx] = { ...demoClients[idx], ...data };
        _persistCreatedClients();
        return Promise.resolve({ data: { success: true, data: demoClients[idx] } });
      }
      return Promise.resolve({ data: { success: false, message: 'No encontrado' } });
    }
    return api.put(`/clients/${id}`, data);
  },
  deactivate: (id, reason) => api.post(`/clients/${id}/deactivate`, { reason }),
  approve: (id) => api.post(`/clients/${id}/approve`),
  reject: (id, reason) => api.post(`/clients/${id}/reject`, { reason }),
  setFraudFlag: (id, hasFraudFlag, reason) => api.post(`/clients/${id}/fraud-flag`, { hasFraudFlag, reason }),
  getAuditHistory: (id) => api.get(`/clients/${id}/audit`),
  uploadDocument: (id, formData) => api.post(`/documents/client/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),

  // Beneficiarios finales
  getBeneficialOwners: (clientId) => api.get(`/clients/${clientId}/beneficial-owners`),
  createBeneficialOwner: (clientId, data) => api.post(`/clients/${clientId}/beneficial-owners`, data),
  updateBeneficialOwner: (clientId, boId, data) => api.put(`/clients/${clientId}/beneficial-owners/${boId}`, data),
  deleteBeneficialOwner: (clientId, boId, reason) => api.delete(`/clients/${clientId}/beneficial-owners/${boId}`, { data: { reason } }),

  // Firmantes
  getSignatories: (clientId) => api.get(`/clients/${clientId}/signatories`),
  createSignatory: (clientId, data) => api.post(`/clients/${clientId}/signatories`, data),
  updateSignatory: (clientId, sigId, data) => api.put(`/clients/${clientId}/signatories/${sigId}`, data),
  deleteSignatory: (clientId, sigId, reason) => api.delete(`/clients/${clientId}/signatories/${sigId}`, { data: { reason } }),

  // Apoderados
  getAttorneys: (clientId) => api.get(`/clients/${clientId}/attorneys`),
  createAttorney: (clientId, data) => api.post(`/clients/${clientId}/attorneys`, data),
  updateAttorney: (clientId, attId, data) => api.put(`/clients/${clientId}/attorneys/${attId}`, data),
  deleteAttorney: (clientId, attId, reason) => api.delete(`/clients/${clientId}/attorneys/${attId}`, { data: { reason } }),

  // Autoridades
  getAuthorities: (clientId) => api.get(`/clients/${clientId}/authorities`),
  createAuthority: (clientId, data) => api.post(`/clients/${clientId}/authorities`, data),
  updateAuthority: (clientId, authId, data) => api.put(`/clients/${clientId}/authorities/${authId}`, data),
  deleteAuthority: (clientId, authId, reason) => api.delete(`/clients/${clientId}/authorities/${authId}`, { data: { reason } }),
};
