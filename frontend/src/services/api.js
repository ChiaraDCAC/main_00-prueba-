import axios from 'axios';
import { toast } from 'react-toastify';

// Demo mode data
const DEMO_MODE = false;

// Usuarios del sistema — arranca solo con el admin; los demás se dan de alta desde la página de Usuarios
export const demoSystemUsers = [
  {
    id: 'usr-001',
    firstName: 'Admin',
    lastName: 'Sistema',
    email: 'admin@compliance.com',
    role: 'admin',
    isActive: true,
    lastLogin: '2026-02-18T10:00:00Z',
    createdAt: '2024-01-01T00:00:00Z',
  },
];

// Directorio de personas físicas ya cargadas en el sistema
// Solo se almacenan nombre, apellido, teléfono y email — DNI/CUIT se completan por persona al momento del alta
export const demoPersonasDirectorio = [
  { id: 'per-001', apellido: 'Méndez',    nombre: 'Juan Carlos',   email: 'jmendez@inversur.com',       telefono: '11-4567-8900' },
  { id: 'per-002', apellido: 'González',  nombre: 'María Laura',   email: 'mgonzalez@inversur.com',     telefono: '11-4567-8901' },
  { id: 'per-003', apellido: 'Ramírez',   nombre: 'Pedro',         email: 'pramirez@inversur.com',      telefono: '' },
  { id: 'per-004', apellido: 'Silva',     nombre: 'Roberto',       email: 'rsilva@estudio.com',         telefono: '11-5555-0001' },
  { id: 'per-005', apellido: 'Sánchez',   nombre: 'Roberto',       email: 'rsanchez@tecnoap.com',       telefono: '11-5678-1234' },
  { id: 'per-006', apellido: 'Martínez',  nombre: 'Ana',           email: 'amartinez@tecnoap.com',      telefono: '11-5678-5678' },
  { id: 'per-007', apellido: 'Rodríguez', nombre: 'Carlos Alberto',email: 'carlos.rodriguez@email.com', telefono: '11-2345-6789' },
  { id: 'per-008', apellido: 'López',     nombre: 'Miguel',        email: 'mlopez@lopezyhnos.com',      telefono: '11-9876-5432' },
  { id: 'per-009', apellido: 'López',     nombre: 'Carlos',        email: 'clopez@lopezyhnos.com',      telefono: '11-9876-5433' },
  { id: 'per-010', apellido: 'López',     nombre: 'Fernando',      email: 'flopez@lopezyhnos.com',      telefono: '11-9876-5434' },
  { id: 'per-011', apellido: 'Gómez',     nombre: 'Patricia',      email: 'pgomez@estudio.com',         telefono: '11-3344-5566' },
  { id: 'per-012', apellido: 'Fernández', nombre: 'Laura',         email: 'laura.fernandez@email.com',  telefono: '11-3456-7890' },
];

// Directorio de empleados/personal (fuente: RRHH o directorio corporativo)
// Todos están disponibles para dar de alta — ninguno tiene acceso todavía
export const demoEmployeeDirectory = [
  { id: 'emp-001', firstName: 'Carlos', lastName: 'Suárez', email: 'c.suarez@hcdcac.com', department: 'Compliance', position: 'Analista Sr.' },
  { id: 'emp-002', firstName: 'María', lastName: 'López', email: 'm.lopez@hcdcac.com', department: 'Compliance', position: 'Analista Jr.' },
  { id: 'emp-003', firstName: 'Roberto', lastName: 'Fernández', email: 'r.fernandez@hcdcac.com', department: 'Legal', position: 'Supervisor Legal' },
  { id: 'emp-004', firstName: 'Valeria', lastName: 'Torres', email: 'v.torres@hcdcac.com', department: 'Auditoría', position: 'Auditora' },
  { id: 'emp-005', firstName: 'Diego', lastName: 'Ramírez', email: 'd.ramirez@hcdcac.com', department: 'Compliance', position: 'Analista' },
  { id: 'emp-006', firstName: 'Lucía', lastName: 'Herrera', email: 'l.herrera@hcdcac.com', department: 'Riesgo', position: 'Analista de Riesgo' },
  { id: 'emp-007', firstName: 'Martín', lastName: 'Giménez', email: 'm.gimenez@hcdcac.com', department: 'Compliance', position: 'Supervisor Compliance' },
  { id: 'emp-008', firstName: 'Martín', lastName: 'Giménez', email: 'm.gimenez@hcdcac.com', department: 'Compliance', position: 'Supervisor Compliance' },
  { id: 'emp-009', firstName: 'Ana Paula', lastName: 'Ruiz', email: 'a.ruiz@hcdcac.com', department: 'Auditoría', position: 'Auditora Sr.' },
  { id: 'emp-010', firstName: 'Sebastián', lastName: 'Morales', email: 's.morales@hcdcac.com', department: 'Operaciones', position: 'Analista Operativo' },
  { id: 'emp-011', firstName: 'Florencia', lastName: 'Acosta', email: 'f.acosta@hcdcac.com', department: 'Compliance', position: 'Analista' },
  { id: 'emp-012', firstName: 'Gonzalo', lastName: 'Vega', email: 'g.vega@hcdcac.com', department: 'Legal', position: 'Abogado' },
];

const demoClients = [
  {
    id: '1',
    clientType: 'persona_juridica',
    entityType: 'sa',
    legalForm: 'sa',
    status: 'pendiente',
    cuit: '30-71234567-8',
    legalName: 'Inversiones del Sur S.A.',
    tradeName: 'INVERSUR',
    email: 'contacto@inversur.com.ar',
    phone: '11-4567-8900',
    address: 'Av. Corrientes 1234, Piso 5',
    city: 'Buenos Aires',
    province: 'CABA',
    country: 'Argentina',
    riskLevel: 'medio',
    riskScore: 25,
    dueDiligenceType: 'media',
    isPep: false,
    hasFraudFlag: false,
    mainActivity: 'Servicios financieros',
    createdAt: '2024-01-15T10:00:00Z',
    // Simulated uploaded documents
    documents: {
      estatuto: { dataUrl: 'data:application/pdf;base64,fake', name: 'estatuto_inversur.pdf' },
      acta_autoridades: { dataUrl: 'data:application/pdf;base64,fake', name: 'acta_directorio_2024.pdf' },
      registro_accionistas: { dataUrl: 'data:application/pdf;base64,fake', name: 'libro_accionistas.pdf' },
      constancia_cuit: { dataUrl: 'data:application/pdf;base64,fake', name: 'constancia_afip.pdf' },
      ddjj_beneficiarios_finales: { dataUrl: 'data:application/pdf;base64,fake', name: 'ddjj_bf.pdf' },
      ddjj_pep: { dataUrl: 'data:application/pdf;base64,fake', name: 'ddjj_pep.pdf' },
      formulario_vinculo: { dataUrl: 'data:application/pdf;base64,fake', name: 'formulario_vinculo.pdf' },
    },
    documentStatuses: {},
    beneficialOwners: [
      { id: '1', firstName: 'Juan Carlos', lastName: 'Méndez', dni: '12345678', cuit: '20-12345678-9', email: 'jmendez@inversur.com', ownershipPercentage: 60, isPep: false, isActive: true },
      { id: '2', firstName: 'María Laura', lastName: 'González', dni: '23456789', cuit: '27-23456789-0', email: 'mgonzalez@inversur.com', ownershipPercentage: 40, isPep: false, isActive: true },
    ],
    signatories: [
      { id: '1', firstName: 'Juan Carlos', lastName: 'Méndez', dni: '12345678', cuit: '20-12345678-9', email: 'jmendez@inversur.com', position: 'firmante_contratos', isActive: true },
      { id: '2', firstName: 'Pedro', lastName: 'Ramírez', dni: '34567890', cuit: '20-34567890-1', email: 'pramirez@inversur.com', position: 'firmante_cheques', isActive: true },
    ],
    attorneys: [
      { id: '1', firstName: 'Dr. Roberto', lastName: 'Silva', dni: '11223344', cuit: '20-11223344-5', email: 'rsilva@estudio.com', powerType: 'general', isActive: true },
    ],
    authorities: [
      { id: '1', firstName: 'Juan Carlos', lastName: 'Méndez', dni: '12345678', cuit: '20-12345678-9', email: 'jmendez@inversur.com', position: 'presidente', isActive: true },
      { id: '2', firstName: 'María Laura', lastName: 'González', dni: '23456789', cuit: '27-23456789-0', email: 'mgonzalez@inversur.com', position: 'director', isActive: true },
    ],
    riskAssessments: [],
    screeningResults: [],
  },
  {
    id: '2',
    clientType: 'persona_juridica',
    entityType: 'srl',
    legalForm: 'srl',
    status: 'pendiente',
    cuit: '30-65432109-7',
    legalName: 'Tecnología Aplicada S.R.L.',
    tradeName: 'TECNOAP',
    email: 'info@tecnoap.com.ar',
    phone: '11-5678-1234',
    address: 'Lavalle 890',
    city: 'Buenos Aires',
    province: 'CABA',
    country: 'Argentina',
    riskLevel: 'bajo',
    riskScore: 15,
    dueDiligenceType: 'simplificada',
    isPep: false,
    hasFraudFlag: false,
    mainActivity: 'Desarrollo de software',
    createdAt: '2024-01-18T14:30:00Z',
    documents: {
      contrato_social: { dataUrl: 'data:application/pdf;base64,fake', name: 'contrato_social.pdf' },
      acta_asamblea: { dataUrl: 'data:application/pdf;base64,fake', name: 'acta_socios.pdf' },
      registro_socios: { dataUrl: 'data:application/pdf;base64,fake', name: 'libro_socios.pdf' },
      constancia_cuit: { dataUrl: 'data:application/pdf;base64,fake', name: 'cuit_tecnoap.pdf' },
      ddjj_beneficiarios_finales: { dataUrl: 'data:application/pdf;base64,fake', name: 'bf_tecnoap.pdf' },
      ddjj_pep: { dataUrl: 'data:application/pdf;base64,fake', name: 'pep_tecnoap.pdf' },
      formulario_vinculo: { dataUrl: 'data:application/pdf;base64,fake', name: 'vinculo_tecnoap.pdf' },
    },
    documentStatuses: {},
    beneficialOwners: [
      { id: '1', firstName: 'Roberto', lastName: 'Sánchez', dni: '34567890', cuit: '20-34567890-1', email: 'rsanchez@tecnoap.com', ownershipPercentage: 50, isPep: false, isActive: true },
      { id: '2', firstName: 'Ana', lastName: 'Martínez', dni: '45678901', cuit: '27-45678901-2', email: 'amartinez@tecnoap.com', ownershipPercentage: 50, isPep: false, isActive: true },
    ],
    signatories: [
      { id: '1', firstName: 'Roberto', lastName: 'Sánchez', dni: '34567890', cuit: '20-34567890-1', email: 'rsanchez@tecnoap.com', position: 'firmante_general', isActive: true },
    ],
    attorneys: [],
    authorities: [
      { id: '1', firstName: 'Roberto', lastName: 'Sánchez', dni: '34567890', cuit: '20-34567890-1', email: 'rsanchez@tecnoap.com', position: 'socio_gerente', isActive: true },
      { id: '2', firstName: 'Ana', lastName: 'Martínez', dni: '45678901', cuit: '27-45678901-2', email: 'amartinez@tecnoap.com', position: 'socio_gerente', isActive: true },
    ],
    riskAssessments: [],
    screeningResults: [],
  },
  {
    id: '3',
    clientType: 'persona_humana',
    entityType: 'persona_humana',
    legalForm: 'monotributista',
    status: 'pendiente',
    cuit: '20-34567890-1',
    firstName: 'Carlos Alberto',
    lastName: 'Rodríguez',
    dni: '34567890',
    email: 'carlos.rodriguez@email.com',
    phone: '11-2345-6789',
    address: 'Calle Florida 567',
    city: 'Buenos Aires',
    province: 'CABA',
    country: 'Argentina',
    riskLevel: 'bajo',
    riskScore: 12,
    dueDiligenceType: 'simplificada',
    isPep: false,
    hasFraudFlag: false,
    occupation: 'Comerciante',
    birthDate: '1985-03-15',
    nationality: 'Argentina',
    createdAt: '2024-01-20T14:30:00Z',
    documents: {
      dni_frente: { dataUrl: 'data:image/jpeg;base64,fake', name: 'dni_frente.jpg' },
      dni_dorso: { dataUrl: 'data:image/jpeg;base64,fake', name: 'dni_dorso.jpg' },
      constancia_cuil: { dataUrl: 'data:application/pdf;base64,fake', name: 'cuil.pdf' },
      comprobante_domicilio: { dataUrl: 'data:application/pdf;base64,fake', name: 'servicio_luz.pdf' },
      ddjj_beneficiarios_finales: { dataUrl: 'data:application/pdf;base64,fake', name: 'ddjj_bf.pdf' },
      ddjj_pep: { dataUrl: 'data:application/pdf;base64,fake', name: 'ddjj_pep.pdf' },
      formulario_vinculo: { dataUrl: 'data:application/pdf;base64,fake', name: 'formulario.pdf' },
    },
    documentStatuses: {},
    beneficialOwners: [],
    signatories: [],
    attorneys: [],
    authorities: [],
    riskAssessments: [],
    screeningResults: [],
  },
  {
    id: '4',
    clientType: 'persona_juridica',
    entityType: 'sh',
    legalForm: 'sh',
    status: 'pendiente',
    cuit: '30-98765432-1',
    legalName: 'López y Hermanos SH',
    email: 'lopezyhnos@gmail.com',
    phone: '11-9876-5432',
    address: 'San Martín 456',
    city: 'Córdoba',
    province: 'Córdoba',
    country: 'Argentina',
    riskLevel: 'medio',
    riskScore: 28,
    dueDiligenceType: 'media',
    isPep: false,
    hasFraudFlag: false,
    mainActivity: 'Comercio minorista',
    createdAt: '2024-01-22T09:00:00Z',
    documents: {
      contrato_privado: { dataUrl: 'data:application/pdf;base64,fake', name: 'contrato_sh.pdf' },
      dni_socios: { dataUrl: 'data:application/pdf;base64,fake', name: 'dnis_socios.pdf' },
      ddjj_beneficiarios_finales: { dataUrl: 'data:application/pdf;base64,fake', name: 'ddjj_bf.pdf' },
      ddjj_pep: { dataUrl: 'data:application/pdf;base64,fake', name: 'ddjj_pep.pdf' },
      formulario_vinculo: { dataUrl: 'data:application/pdf;base64,fake', name: 'formulario.pdf' },
    },
    documentStatuses: {},
    beneficialOwners: [
      { id: '1', firstName: 'Miguel', lastName: 'López', dni: '22334455', cuit: '20-22334455-6', email: 'mlopez@lopezyhnos.com', ownershipPercentage: 33.33, isPep: false, isActive: true },
      { id: '2', firstName: 'Carlos', lastName: 'López', dni: '22334456', cuit: '20-22334456-7', email: 'clopez@lopezyhnos.com', ownershipPercentage: 33.33, isPep: false, isActive: true },
      { id: '3', firstName: 'Fernando', lastName: 'López', dni: '22334457', cuit: '20-22334457-8', email: 'flopez@lopezyhnos.com', ownershipPercentage: 33.34, isPep: false, isActive: true },
    ],
    signatories: [
      { id: '1', firstName: 'Miguel', lastName: 'López', dni: '22334455', cuit: '20-22334455-6', email: 'mlopez@lopezyhnos.com', position: 'firmante_contratos', isActive: true },
    ],
    attorneys: [
      { id: '1', firstName: 'Dra. Patricia', lastName: 'Gómez', dni: '33445566', cuit: '27-33445566-7', email: 'pgomez@estudio.com', powerType: 'especial', isActive: true },
    ],
    authorities: [],
    riskAssessments: [],
    screeningResults: [],
  },
  {
    id: '5',
    clientType: 'persona_humana',
    entityType: 'monotributista',
    legalForm: 'monotributista',
    status: 'pendiente',
    cuit: '20-45678901-2',
    firstName: 'Laura',
    lastName: 'Fernández',
    dni: '45678901',
    email: 'laura.fernandez@email.com',
    phone: '11-3456-7890',
    address: 'Belgrano 789',
    city: 'Rosario',
    province: 'Santa Fe',
    country: 'Argentina',
    riskLevel: 'bajo',
    riskScore: 8,
    dueDiligenceType: 'simplificada',
    isPep: false,
    hasFraudFlag: false,
    occupation: 'Diseñadora gráfica',
    birthDate: '1990-07-22',
    nationality: 'Argentina',
    createdAt: '2024-01-24T11:00:00Z',
    documents: {
      dni_frente: { dataUrl: 'data:image/jpeg;base64,fake', name: 'dni_frente_laura.jpg' },
      dni_dorso: { dataUrl: 'data:image/jpeg;base64,fake', name: 'dni_dorso_laura.jpg' },
      constancia_monotributo: { dataUrl: 'data:application/pdf;base64,fake', name: 'monotributo.pdf' },
      comprobante_domicilio: { dataUrl: 'data:application/pdf;base64,fake', name: 'factura_gas.pdf' },
      ddjj_beneficiarios_finales: { dataUrl: 'data:application/pdf;base64,fake', name: 'ddjj_bf.pdf' },
      ddjj_pep: { dataUrl: 'data:application/pdf;base64,fake', name: 'ddjj_pep.pdf' },
      formulario_vinculo: { dataUrl: 'data:application/pdf;base64,fake', name: 'formulario.pdf' },
    },
    documentStatuses: {},
    beneficialOwners: [],
    signatories: [],
    attorneys: [],
    authorities: [],
    riskAssessments: [],
    screeningResults: [],
  },
  {
    id: '6',
    clientType: 'persona_juridica',
    entityType: 'sa',
    legalForm: 'sa',
    status: 'aprobado',
    clientNumber: 'CLI-ABC123XY',
    cuit: '30-87654321-0',
    legalName: 'Comercial del Norte S.A.',
    tradeName: 'COMNORTE',
    email: 'info@comnorte.com.ar',
    phone: '11-8765-4321',
    address: 'Av. Santa Fe 2000',
    city: 'Buenos Aires',
    province: 'CABA',
    country: 'Argentina',
    riskLevel: 'bajo',
    riskScore: 10,
    dueDiligenceType: 'simplificada',
    isPep: false,
    hasFraudFlag: false,
    mainActivity: 'Importación y exportación',
    createdAt: '2024-01-05T10:00:00Z',
    approvedAt: '2024-01-08T15:30:00Z',
    documents: {},
    documentStatuses: {},
    beneficialOwners: [],
    signatories: [],
    attorneys: [],
    authorities: [],
    riskAssessments: [],
    screeningResults: [],
  },
  {
    id: '7',
    clientType: 'persona_juridica',
    entityType: 'srl',
    legalForm: 'srl',
    status: 'rechazado',
    cuit: '30-11223344-5',
    legalName: 'Servicios Varios S.R.L.',
    email: 'contacto@serviciosvarios.com',
    phone: '11-1122-3344',
    address: 'Av. de Mayo 500',
    city: 'Buenos Aires',
    province: 'CABA',
    country: 'Argentina',
    riskLevel: 'alto',
    riskScore: 55,
    dueDiligenceType: 'reforzada',
    isPep: true,
    pepPosition: 'Familiar de funcionario público',
    hasFraudFlag: false,
    mainActivity: 'Consultoría',
    createdAt: '2024-01-10T09:00:00Z',
    rejectedAt: '2024-01-12T14:00:00Z',
    rejectionReason: 'Documentación incompleta y falta de declaración de origen de fondos',
    documents: {},
    documentStatuses: {},
    beneficialOwners: [],
    signatories: [],
    attorneys: [],
    authorities: [],
    riskAssessments: [],
    screeningResults: [],
  },
  {
    id: '8',
    clientType: 'persona_juridica',
    entityType: 'sucesion',
    legalForm: 'sucesion',
    status: 'pendiente',
    cuit: '30-71234570-1',
    legalName: 'Sucesión de María González',
    email: 'sucesion.gonzalez@email.com',
    phone: '11-5555-1234',
    address: 'Av. Rivadavia 3000',
    city: 'Buenos Aires',
    province: 'CABA',
    country: 'Argentina',
    riskLevel: 'alto',
    riskScore: 35,
    dueDiligenceType: 'reforzada',
    isPep: false,
    hasFraudFlag: false,
    mainActivity: 'Administración de bienes',
    createdAt: '2024-01-26T10:00:00Z',
    documents: {},
    documentStatuses: {},
    beneficialOwners: [],
    signatories: [],
    attorneys: [],
    authorities: [],
    riskAssessments: [],
    screeningResults: [],
  },
];

const demoAlerts = [
  {
    id: '1',
    alertType: 'umbral_monto',
    severity: 'alta',
    status: 'pendiente',
    title: 'Transacción supera umbral mensual',
    description: 'El cliente realizó una transacción de $5.000.000 que supera el umbral configurado de $2.000.000',
    clientId: '6',
    Client: demoClients[5],
    createdAt: '2024-01-25T16:00:00Z',
    triggerValue: '$5.000.000',
    thresholdValue: '$2.000.000',
  },
  {
    id: '2',
    alertType: 'screening',
    severity: 'critica',
    status: 'pendiente',
    title: 'Match en lista PEP',
    description: 'Se encontró coincidencia con lista de Personas Expuestas Políticamente',
    clientId: '7',
    Client: demoClients[6],
    createdAt: '2024-01-24T11:30:00Z',
  },
  {
    id: '3',
    alertType: 'documento_vencido',
    severity: 'media',
    status: 'en_revision',
    title: 'DNI próximo a vencer',
    description: 'El documento de identidad vence en 30 días',
    clientId: '3',
    Client: demoClients[2],
    createdAt: '2024-01-23T09:15:00Z',
  },
];

const demoUnusualOps = [
  {
    id: '1',
    operationNumber: 'OI-2024-000001',
    clientId: '6',
    Client: demoClients[5],
    detectionDate: '2024-01-25T10:00:00Z',
    operationType: 'Transferencia',
    amount: 5000000,
    currency: 'ARS',
    description: 'Transferencia de alto monto sin justificación económica aparente',
    unusualIndicators: ['monto_alto', 'sin_justificacion'],
    status: 'pendiente',
  },
  {
    id: '2',
    operationNumber: 'OI-2024-000002',
    clientId: '7',
    Client: demoClients[6],
    detectionDate: '2024-01-20T14:00:00Z',
    operationType: 'Depósito en efectivo',
    amount: 1500000,
    currency: 'ARS',
    description: 'Múltiples depósitos en efectivo fraccionados',
    unusualIndicators: ['fraccionamiento', 'efectivo'],
    status: 'en_analisis',
    analysis: 'Se detectaron 5 depósitos en efectivo de $300.000 cada uno en el mismo día.',
  },
  {
    id: '3',
    operationNumber: 'OI-2024-000003',
    clientId: '1',
    Client: demoClients[0],
    detectionDate: '2024-01-15T11:30:00Z',
    operationType: 'Transferencia Internacional',
    amount: 8500000,
    currency: 'ARS',
    description: 'Transferencia a país de alto riesgo sin documentación de respaldo',
    unusualIndicators: ['pais_riesgo', 'sin_documentacion'],
    status: 'sospechosa',
    analysis: 'Transferencia a cuenta en Panamá. Cliente no pudo justificar origen de fondos.',
    conclusion: 'Se determina sospechosa por falta de justificación y destino de alto riesgo.',
    suspiciousReport: { id: 'ros-1', reportNumber: 'ROS-2024-000001' },
  },
  {
    id: '4',
    operationNumber: 'OI-2024-000004',
    clientId: '2',
    Client: demoClients[1],
    detectionDate: '2024-01-10T09:00:00Z',
    operationType: 'Depósito en efectivo',
    amount: 2000000,
    currency: 'ARS',
    description: 'Depósito en efectivo superior al perfil transaccional',
    unusualIndicators: ['perfil_transaccional', 'efectivo'],
    status: 'justificada',
    analysis: 'Se solicitó documentación de respaldo al cliente.',
    conclusion: 'Cliente presentó boleto de compraventa de vehículo que justifica el origen de los fondos.',
  },
  {
    id: '5',
    operationNumber: 'OI-2024-000005',
    clientId: '3',
    Client: demoClients[2],
    detectionDate: '2024-01-18T16:45:00Z',
    operationType: 'Múltiples transferencias',
    amount: 3200000,
    currency: 'ARS',
    description: 'Patrón de transferencias a múltiples cuentas en corto período',
    unusualIndicators: ['multiples_destinos', 'patron_inusual'],
    status: 'sospechosa',
    analysis: 'Se detectaron 12 transferencias a cuentas diferentes en 48 horas.',
    conclusion: 'Patrón consistente con posible lavado de activos.',
    suspiciousReport: { id: 'ros-2', reportNumber: 'ROS-2024-000002' },
  },
  {
    id: '6',
    operationNumber: 'OI-2024-000006',
    clientId: '4',
    Client: demoClients[3],
    detectionDate: '2024-01-22T14:20:00Z',
    operationType: 'Retiro de efectivo',
    amount: 950000,
    currency: 'ARS',
    description: 'Retiro de efectivo cercano al límite reportable',
    unusualIndicators: ['cercano_limite', 'efectivo'],
    status: 'justificada',
    analysis: 'Retiro de $950.000 en efectivo, monto cercano al umbral de reporte.',
    conclusion: 'Cliente justificó retiro para pago de haberes a empleados rurales. Actividad consistente con su perfil.',
  },
];

// Filter clients by status helper
const filterClients = (params = {}) => {
  let filtered = [...demoClients];

  if (params.status) {
    filtered = filtered.filter(c => c.status === params.status);
  }
  if (params.clientType) {
    filtered = filtered.filter(c => c.clientType === params.clientType);
  }
  if (params.riskLevel) {
    filtered = filtered.filter(c => c.riskLevel === params.riskLevel);
  }
  if (params.search) {
    const search = params.search.toLowerCase();
    filtered = filtered.filter(c =>
      c.legalName?.toLowerCase().includes(search) ||
      c.firstName?.toLowerCase().includes(search) ||
      c.lastName?.toLowerCase().includes(search) ||
      c.cuit?.includes(search)
    );
  }

  const limit = params.limit || 20;
  const page = params.page || 1;
  const start = (page - 1) * limit;
  const paginatedData = filtered.slice(start, start + limit);

  return {
    success: true,
    data: paginatedData,
    pagination: {
      total: filtered.length,
      page,
      limit,
      totalPages: Math.ceil(filtered.length / limit),
    },
  };
};

// Demo API responses
const demoResponses = {
  '/alerts': { success: true, data: demoAlerts, pagination: { total: demoAlerts.length, page: 1, limit: 20, totalPages: 1 } },
  '/alerts/stats': { success: true, data: { byStatusAndSeverity: [], pendingByType: [] } },
  '/unusual-operations': { success: true, data: demoUnusualOps, pagination: { total: demoUnusualOps.length, page: 1, limit: 20, totalPages: 1 } },
  '/ros': { success: true, data: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 1 } },
  '/screening/pending-matches': { success: true, data: [] },
  '/risk/matrix': { success: true, data: [] },
  '/investigation-cases': { success: true, data: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 1 } },
  '/investigation-cases/stats': { success: true, data: { totalCases: 0, openCases: 0, closedJustified: 0, escalatedSuspicious: 0, pendingDocuments: 0, byPriority: [] } },
};

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for demo mode
api.interceptors.request.use(
  (config) => {
    // Attach auth token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (DEMO_MODE) {
      const url = config.url || '';
      const params = config.params || {};

      // Handle users list
      if (url === '/auth/users') {
        return Promise.reject({
          config,
          __DEMO_RESPONSE__: { data: { success: true, data: demoSystemUsers } }
        });
      }

      // Handle POST to register new user
      if (config.method === 'post' && url === '/auth/register') {
        const data = JSON.parse(config.data || '{}');
        const newUser = {
          id: `usr-${String(demoSystemUsers.length + 1).padStart(3, '0')}`,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          role: data.role || 'analyst',
          isActive: true,
          lastLogin: null,
          createdAt: new Date().toISOString(),
        };
        demoSystemUsers.push(newUser);
        return Promise.reject({
          config,
          __DEMO_RESPONSE__: { data: { success: true, data: newUser, message: 'Usuario creado exitosamente' } }
        });
      }

      // Handle PUT to update user
      const userUpdateMatch = url.match(/\/auth\/users\/([^/]+)$/);
      if (config.method === 'put' && userUpdateMatch) {
        const userId = userUpdateMatch[1];
        const data = JSON.parse(config.data || '{}');
        const userIdx = demoSystemUsers.findIndex(u => u.id === userId);
        if (userIdx >= 0) {
          demoSystemUsers[userIdx] = { ...demoSystemUsers[userIdx], ...data };
          return Promise.reject({
            config,
            __DEMO_RESPONSE__: { data: { success: true, data: demoSystemUsers[userIdx] } }
          });
        }
      }

      // Handle clients list with filters
      if (url === '/clients' || url.endsWith('/clients')) {
        const result = filterClients(params);
        return Promise.reject({
          config,
          __DEMO_RESPONSE__: { data: result }
        });
      }

      // Handle alerts list
      if (url === '/alerts' || url.startsWith('/alerts')) {
        return Promise.reject({
          config,
          __DEMO_RESPONSE__: { data: demoResponses['/alerts'] }
        });
      }

      // Handle unusual-operations list
      if (url === '/unusual-operations' || url.startsWith('/unusual-operations')) {
        return Promise.reject({
          config,
          __DEMO_RESPONSE__: { data: demoResponses['/unusual-operations'] }
        });
      }

      // Check for specific client request
      const clientMatch = url.match(/\/clients\/([^/]+)$/);
      if (clientMatch) {
        const client = demoClients.find(c => c.id === clientMatch[1]);
        if (client) {
          return Promise.reject({
            config,
            __DEMO_RESPONSE__: { data: { success: true, data: client } }
          });
        }
      }

      // Handle POST to create unusual operation
      if (config.method === 'post' && url === '/unusual-operations') {
        const newId = String(demoUnusualOps.length + 1);
        const data = JSON.parse(config.data || '{}');
        const client = demoClients.find(c => c.id === data.clientId);
        const newOp = {
          id: newId,
          operationNumber: `OI-2024-${String(demoUnusualOps.length + 1).padStart(6, '0')}`,
          clientId: data.clientId,
          Client: client,
          detectionDate: data.detectionDate || new Date().toISOString(),
          operationType: data.operationType,
          amount: data.amount,
          currency: data.currency || 'ARS',
          description: data.description,
          unusualIndicators: data.unusualIndicators || [],
          status: 'pendiente',
        };
        demoUnusualOps.push(newOp);
        return Promise.reject({
          config,
          __DEMO_RESPONSE__: { data: { success: true, data: newOp } }
        });
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle demo mode responses
    if (error.__DEMO_RESPONSE__) {
      return error.__DEMO_RESPONSE__;
    }

    // In demo mode, return mock data instead of errors
    if (DEMO_MODE) {
      const url = error.config?.url || '';
      const params = error.config?.params || {};

      // Handle clients list with filters
      if (url === '/clients' || url.endsWith('/clients')) {
        return { data: filterClients(params) };
      }

      // Check for specific client request
      const clientMatch = url.match(/\/clients\/([^/]+)$/);
      if (clientMatch) {
        const client = demoClients.find(c => c.id === clientMatch[1]);
        if (client) {
          return { data: { success: true, data: client } };
        }
      }

      // Check for specific alert request
      const alertMatch = url.match(/\/alerts\/([^/]+)$/);
      if (alertMatch) {
        const alert = demoAlerts.find(a => a.id === alertMatch[1]);
        if (alert) {
          return { data: { success: true, data: alert } };
        }
      }

      // Check for specific unusual operation request
      const oiMatch = url.match(/\/unusual-operations\/([^/]+)$/);
      if (oiMatch) {
        const oi = demoUnusualOps.find(o => o.id === oiMatch[1]);
        if (oi) {
          return { data: { success: true, data: oi } };
        }
      }

      // Check for report summary
      if (url.includes('/reports/summary')) {
        return {
          data: {
            success: true,
            data: {
              period: '2024-01',
              newClients: 15,
              modifiedClients: 8,
              deactivatedClients: 2,
              unusualOperations: 5,
              suspiciousReports: 1,
              alerts: 12,
            }
          }
        };
      }

      // Generic demo responses
      for (const [key, value] of Object.entries(demoResponses)) {
        if (url.includes(key)) {
          return { data: value };
        }
      }

      // Default empty response for unknown endpoints
      return { data: { success: true, data: [] } };
    }

    const message = error.response?.data?.message || 'Error de conexión';

    if (error.response?.status === 401) {
      localStorage.removeItem('auth-storage');
      window.location.href = '/login';
      toast.error('Sesión expirada. Por favor inicie sesión nuevamente.');
    } else if (error.response?.status === 403) {
      toast.error('No tiene permisos para realizar esta acción');
    } else if (error.response?.status >= 500) {
      toast.error('Error del servidor. Intente nuevamente.');
    } else {
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

export default api;
