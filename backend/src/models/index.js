const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize({
  dialect: dbConfig.dialect,
  storage: dbConfig.storage, // For SQLite
  database: dbConfig.database,
  username: dbConfig.username,
  password: dbConfig.password,
  host: dbConfig.host,
  port: dbConfig.port,
  logging: dbConfig.logging,
  define: dbConfig.define,
  pool: dbConfig.pool,
});

// User Model - Usuarios del sistema (analistas de compliance)
const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('admin', 'analyst', 'supervisor', 'auditor'),
    defaultValue: 'analyst',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  lastLogin: {
    type: DataTypes.DATE,
  },
});

// Client Model - Clientes (personas físicas o jurídicas)
const Client = sequelize.define('Client', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  clientType: {
    type: DataTypes.ENUM('persona_humana', 'persona_juridica'),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pendiente', 'aprobado', 'rechazado', 'baja', 'bloqueado', 'en_proceso'),
    defaultValue: 'pendiente',
  },
  // Datos comunes
  cuit: {
    type: DataTypes.STRING(13),
    allowNull: false,
    unique: true,
  },
  email: {
    type: DataTypes.STRING,
    validate: { isEmail: true },
  },
  phone: {
    type: DataTypes.STRING,
  },
  address: {
    type: DataTypes.STRING,
  },
  city: {
    type: DataTypes.STRING,
  },
  province: {
    type: DataTypes.STRING,
  },
  postalCode: {
    type: DataTypes.STRING,
  },
  country: {
    type: DataTypes.STRING,
    defaultValue: 'Argentina',
  },
  // Persona Humana
  firstName: {
    type: DataTypes.STRING,
  },
  lastName: {
    type: DataTypes.STRING,
  },
  dni: {
    type: DataTypes.STRING,
  },
  birthDate: {
    type: DataTypes.DATEONLY,
  },
  nationality: {
    type: DataTypes.STRING,
  },
  occupation: {
    type: DataTypes.STRING,
  },
  maritalStatus: {
    type: DataTypes.STRING,
  },
  isPep: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  pepPosition: {
    type: DataTypes.STRING,
  },
  pepRelationship: {
    type: DataTypes.STRING,
  },
  // Persona Jurídica
  legalName: {
    type: DataTypes.STRING,
  },
  tradeName: {
    type: DataTypes.STRING,
  },
  legalForm: {
    type: DataTypes.STRING, // SA, SRL, SAS, etc.
  },
  incorporationDate: {
    type: DataTypes.DATEONLY,
  },
  registrationNumber: {
    type: DataTypes.STRING,
  },
  mainActivity: {
    type: DataTypes.STRING,
  },
  secondaryActivity: {
    type: DataTypes.STRING,
  },
  // Riesgo
  riskLevel: {
    type: DataTypes.ENUM('bajo', 'medio', 'alto'),
    defaultValue: 'medio',
  },
  riskScore: {
    type: DataTypes.INTEGER,
  },
  dueDiligenceType: {
    type: DataTypes.ENUM('simplificada', 'media', 'reforzada'),
    defaultValue: 'media',
  },
  lastRiskAssessment: {
    type: DataTypes.DATE,
  },
  nextRiskReview: {
    type: DataTypes.DATE,
  },
  // Perfil transaccional esperado
  expectedMonthlyTransactions: {
    type: DataTypes.INTEGER,
  },
  expectedMonthlyAmount: {
    type: DataTypes.DECIMAL(15, 2),
  },
  transactionTypes: {
    type: DataTypes.JSON, // Changed from ARRAY for SQLite compatibility
  },
  // Flags
  hasFraudFlag: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  fraudFlagReason: {
    type: DataTypes.TEXT,
  },
  fraudFlagDate: {
    type: DataTypes.DATE,
  },
  // Auditoría
  approvedBy: {
    type: DataTypes.UUID,
  },
  approvedAt: {
    type: DataTypes.DATE,
  },
  rejectionReason: {
    type: DataTypes.TEXT,
  },
  notes: {
    type: DataTypes.TEXT,
  },
  // Form data from frontend (stores all entity-specific fields like gestor_es_representante)
  formData: {
    type: DataTypes.JSON,
  },
});

// BeneficialOwner - Beneficiarios Finales
const BeneficialOwner = sequelize.define('BeneficialOwner', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  dni: {
    type: DataTypes.STRING,
  },
  cuit: {
    type: DataTypes.STRING(13),
  },
  birthDate: {
    type: DataTypes.DATEONLY,
  },
  nationality: {
    type: DataTypes.STRING,
  },
  address: {
    type: DataTypes.STRING,
  },
  ownershipPercentage: {
    type: DataTypes.DECIMAL(5, 2),
  },
  isPep: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  pepPosition: {
    type: DataTypes.STRING,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
});

// Signatory - Firmantes
const Signatory = sequelize.define('Signatory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  dni: {
    type: DataTypes.STRING,
  },
  cuit: {
    type: DataTypes.STRING(13),
  },
  position: {
    type: DataTypes.STRING,
  },
  signatureType: {
    type: DataTypes.ENUM('individual', 'conjunta'),
  },
  isPep: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
});

// Attorney - Apoderados
const Attorney = sequelize.define('Attorney', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  dni: {
    type: DataTypes.STRING,
  },
  cuit: {
    type: DataTypes.STRING(13),
  },
  powerType: {
    type: DataTypes.STRING, // General, Especial, etc.
  },
  powerScope: {
    type: DataTypes.TEXT,
  },
  grantDate: {
    type: DataTypes.DATEONLY,
  },
  expirationDate: {
    type: DataTypes.DATEONLY,
  },
  notaryName: {
    type: DataTypes.STRING,
  },
  notaryNumber: {
    type: DataTypes.STRING,
  },
  isPep: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
});

// Authority - Autoridades de la sociedad
const Authority = sequelize.define('Authority', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  dni: {
    type: DataTypes.STRING,
  },
  cuit: {
    type: DataTypes.STRING(13),
  },
  position: {
    type: DataTypes.STRING, // Presidente, Director, Gerente, etc.
  },
  appointmentDate: {
    type: DataTypes.DATEONLY,
  },
  expirationDate: {
    type: DataTypes.DATEONLY,
  },
  isPep: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
});

// Document - Documentos
const Document = sequelize.define('Document', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  documentType: {
    type: DataTypes.STRING, // DNI, Estatuto, Acta, Poder, etc.
    allowNull: false,
  },
  documentCategory: {
    type: DataTypes.ENUM('identificacion', 'societario', 'pep', 'beneficiario_final', 'apoderado', 'otro'),
    allowNull: false,
  },
  fileName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  originalName: {
    type: DataTypes.STRING,
  },
  mimeType: {
    type: DataTypes.STRING,
  },
  size: {
    type: DataTypes.INTEGER,
  },
  path: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  issueDate: {
    type: DataTypes.DATEONLY,
  },
  expirationDate: {
    type: DataTypes.DATEONLY,
  },
  isExpired: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  verifiedBy: {
    type: DataTypes.UUID,
  },
  verifiedAt: {
    type: DataTypes.DATE,
  },
  notes: {
    type: DataTypes.TEXT,
  },
});

// RiskAssessment - Evaluaciones de riesgo
const RiskAssessment = sequelize.define('RiskAssessment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  assessmentType: {
    type: DataTypes.ENUM('inicial', 'periodica', 'evento'),
    allowNull: false,
  },
  // Factores de riesgo
  clientTypeScore: {
    type: DataTypes.INTEGER,
  },
  activityScore: {
    type: DataTypes.INTEGER,
  },
  geographicScore: {
    type: DataTypes.INTEGER,
  },
  productScore: {
    type: DataTypes.INTEGER,
  },
  channelScore: {
    type: DataTypes.INTEGER,
  },
  pepScore: {
    type: DataTypes.INTEGER,
  },
  transactionScore: {
    type: DataTypes.INTEGER,
  },
  // Resultado
  totalScore: {
    type: DataTypes.INTEGER,
  },
  riskLevel: {
    type: DataTypes.ENUM('bajo', 'medio', 'alto'),
    allowNull: false,
  },
  dueDiligenceType: {
    type: DataTypes.ENUM('simplificada', 'media', 'reforzada'),
    allowNull: false,
  },
  justification: {
    type: DataTypes.TEXT,
  },
  assessedBy: {
    type: DataTypes.UUID,
  },
  approvedBy: {
    type: DataTypes.UUID,
  },
  approvedAt: {
    type: DataTypes.DATE,
  },
  nextReviewDate: {
    type: DataTypes.DATE,
  },
});

// Transaction - Transacciones (para monitoreo)
const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  transactionType: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'ARS',
  },
  transactionDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  counterparty: {
    type: DataTypes.STRING,
  },
  counterpartyAccount: {
    type: DataTypes.STRING,
  },
  channel: {
    type: DataTypes.STRING,
  },
  branch: {
    type: DataTypes.STRING,
  },
  reference: {
    type: DataTypes.STRING,
  },
  isUnusual: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
});

// Alert - Alertas
const Alert = sequelize.define('Alert', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  alertType: {
    type: DataTypes.ENUM('umbral_monto', 'umbral_frecuencia', 'desvio_perfil', 'pep', 'lista_negra', 'screening', 'documento_vencido', 'otro'),
    allowNull: false,
  },
  severity: {
    type: DataTypes.ENUM('baja', 'media', 'alta', 'critica'),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pendiente', 'en_revision', 'cerrada', 'escalada'),
    defaultValue: 'pendiente',
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  triggerValue: {
    type: DataTypes.STRING,
  },
  thresholdValue: {
    type: DataTypes.STRING,
  },
  assignedTo: {
    type: DataTypes.UUID,
  },
  assignedAt: {
    type: DataTypes.DATE,
  },
  resolvedBy: {
    type: DataTypes.UUID,
  },
  resolvedAt: {
    type: DataTypes.DATE,
  },
  resolution: {
    type: DataTypes.TEXT,
  },
});

// UnusualOperation - Operaciones Inusuales
const UnusualOperation = sequelize.define('UnusualOperation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  operationNumber: {
    type: DataTypes.STRING,
    unique: true,
  },
  detectionDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  operationType: {
    type: DataTypes.STRING,
  },
  amount: {
    type: DataTypes.DECIMAL(15, 2),
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'ARS',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  unusualIndicators: {
    type: DataTypes.JSON, // Changed from ARRAY for SQLite compatibility
  },
  status: {
    type: DataTypes.ENUM('pendiente', 'en_analisis', 'justificada', 'sospechosa'),
    defaultValue: 'pendiente',
  },
  analysis: {
    type: DataTypes.TEXT,
  },
  conclusion: {
    type: DataTypes.TEXT,
  },
  analyzedBy: {
    type: DataTypes.UUID,
  },
  analyzedAt: {
    type: DataTypes.DATE,
  },
  approvedBy: {
    type: DataTypes.UUID,
  },
  approvedAt: {
    type: DataTypes.DATE,
  },
});

// SuspiciousReport - Reporte de Operación Sospechosa (ROS)
const SuspiciousReport = sequelize.define('SuspiciousReport', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  reportNumber: {
    type: DataTypes.STRING,
    unique: true,
  },
  reportDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('borrador', 'enviado', 'confirmado'),
    defaultValue: 'borrador',
  },
  suspicionType: {
    type: DataTypes.STRING,
  },
  suspicionDescription: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  totalAmount: {
    type: DataTypes.DECIMAL(15, 2),
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'ARS',
  },
  relatedTransactions: {
    type: DataTypes.JSON, // Changed from ARRAY for SQLite compatibility
  },
  supportingEvidence: {
    type: DataTypes.TEXT,
  },
  createdBy: {
    type: DataTypes.UUID,
  },
  submittedBy: {
    type: DataTypes.UUID,
  },
  submittedAt: {
    type: DataTypes.DATE,
  },
  uifReference: {
    type: DataTypes.STRING,
  },
  isConfidential: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
});

// ScreeningResult - Resultados de screening
const ScreeningResult = sequelize.define('ScreeningResult', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  screeningType: {
    type: DataTypes.ENUM('alta', 'periodico', 'modificacion'),
    allowNull: false,
  },
  listType: {
    type: DataTypes.STRING, // PEP, RePET, OFAC, ONU, etc.
    allowNull: false,
  },
  searchTerm: {
    type: DataTypes.STRING,
  },
  hasMatch: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  matchDetails: {
    type: DataTypes.JSONB,
  },
  matchScore: {
    type: DataTypes.INTEGER,
  },
  status: {
    type: DataTypes.ENUM('pendiente', 'confirmado', 'descartado'),
    defaultValue: 'pendiente',
  },
  reviewedBy: {
    type: DataTypes.UUID,
  },
  reviewedAt: {
    type: DataTypes.DATE,
  },
  reviewNotes: {
    type: DataTypes.TEXT,
  },
  provider: {
    type: DataTypes.STRING,
  },
  providerReference: {
    type: DataTypes.STRING,
  },
});

// AuditLog - Log de auditoría
const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  entityType: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  entityId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  action: {
    type: DataTypes.ENUM('create', 'update', 'delete', 'view', 'export', 'approve', 'reject'),
    allowNull: false,
  },
  changes: {
    type: DataTypes.JSONB,
  },
  reason: {
    type: DataTypes.TEXT,
  },
  ipAddress: {
    type: DataTypes.STRING,
  },
  userAgent: {
    type: DataTypes.STRING,
  },
});

// RiskMatrix - Matriz de riesgo configurable
const RiskMatrix = sequelize.define('RiskMatrix', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  factor: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  value: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  score: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
});

// AlertThreshold - Umbrales de alerta configurables
const AlertThreshold = sequelize.define('AlertThreshold', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  thresholdType: {
    type: DataTypes.ENUM('monto', 'frecuencia', 'desvio_porcentaje'),
    allowNull: false,
  },
  value: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
  },
  period: {
    type: DataTypes.ENUM('diario', 'semanal', 'mensual'),
  },
  riskLevel: {
    type: DataTypes.ENUM('bajo', 'medio', 'alto'),
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
});

// PepDeclaration - Declaraciones Juradas PEP por persona
const PepDeclaration = sequelize.define('PepDeclaration', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  // Persona a la que pertenece la DDJJ
  personId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  personType: {
    type: DataTypes.ENUM('beneficial_owner', 'signatory', 'attorney', 'authority', 'representative'),
    allowNull: false,
  },
  personName: {
    type: DataTypes.STRING,
  },
  personDni: {
    type: DataTypes.STRING,
  },
  // Datos de la declaración
  isPep: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  pepPosition: {
    type: DataTypes.STRING, // Cargo/función PEP
  },
  pepOrganization: {
    type: DataTypes.STRING, // Organismo
  },
  pepStartDate: {
    type: DataTypes.DATEONLY, // Fecha inicio cargo
  },
  pepEndDate: {
    type: DataTypes.DATEONLY, // Fecha fin cargo (si aplica)
  },
  pepRelationship: {
    type: DataTypes.STRING, // Si es PEP por relación (cónyuge, familiar, etc.)
  },
  // Estado de la declaración
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'pending_approval', 'approved', 'rejected'),
    defaultValue: 'pending',
  },
  // Documento de la DDJJ
  documentUrl: {
    type: DataTypes.STRING,
  },
  fileName: {
    type: DataTypes.STRING,
  },
  declarationDate: {
    type: DataTypes.DATEONLY,
  },
  // Documentación adicional requerida para PEPs
  additionalDocs: {
    type: DataTypes.JSON, // { ddjj_ingresos: true, extractos_bancarios: false, ... }
  },
  additionalDocsComplete: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  // Aprobación del Oficial de Cumplimiento (solo para PEPs)
  approvedBy: {
    type: DataTypes.UUID,
  },
  approvedAt: {
    type: DataTypes.DATE,
  },
  rejectedBy: {
    type: DataTypes.UUID,
  },
  rejectedAt: {
    type: DataTypes.DATE,
  },
  rejectionReason: {
    type: DataTypes.TEXT,
  },
  // Auditoría
  createdBy: {
    type: DataTypes.UUID,
  },
  notes: {
    type: DataTypes.TEXT,
  },
});

// Contract - Contratos de clientes
const Contract = sequelize.define('Contract', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  contractType: {
    type: DataTypes.STRING, // 'onboarding', 'amendment', 'termination', etc.
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('draft', 'pending_upload', 'pending_signatures', 'partially_signed', 'completed', 'cancelled'),
    defaultValue: 'pending_upload',
  },
  documentUrl: {
    type: DataTypes.STRING,
  },
  fileName: {
    type: DataTypes.STRING,
  },
  totalSignaturesRequired: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },
  completedSignatures: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  createdBy: {
    type: DataTypes.UUID,
  },
  uploadedAt: {
    type: DataTypes.DATE,
  },
  completedAt: {
    type: DataTypes.DATE,
  },
  notes: {
    type: DataTypes.TEXT,
  },
});

// ContractSignature - Firmas de contrato
const ContractSignature = sequelize.define('ContractSignature', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  signerName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  signerEmail: {
    type: DataTypes.STRING,
  },
  signerDni: {
    type: DataTypes.STRING,
  },
  signerRole: {
    type: DataTypes.STRING, // 'socio', 'representante', 'apoderado', 'presidente', etc.
  },
  signerId: {
    type: DataTypes.UUID, // Reference to BeneficialOwner, Signatory, Attorney, or Authority
  },
  signerType: {
    type: DataTypes.STRING, // 'beneficial_owner', 'signatory', 'attorney', 'authority', 'external'
  },
  status: {
    type: DataTypes.ENUM('pending', 'signed', 'rejected'),
    defaultValue: 'pending',
  },
  signedAt: {
    type: DataTypes.DATE,
  },
  signatureMethod: {
    type: DataTypes.STRING, // 'digital', 'holographic', 'electronic'
  },
  signatureData: {
    type: DataTypes.TEXT, // Signature image or certificate data
  },
  ipAddress: {
    type: DataTypes.STRING,
  },
  rejectionReason: {
    type: DataTypes.TEXT,
  },
  notifiedAt: {
    type: DataTypes.DATE,
  },
  reminderCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  lastReminderAt: {
    type: DataTypes.DATE,
  },
});

// Associations
User.hasMany(Client, { foreignKey: 'createdBy', as: 'createdClients' });
Client.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

Client.hasMany(BeneficialOwner, { foreignKey: 'clientId', as: 'beneficialOwners' });
BeneficialOwner.belongsTo(Client, { foreignKey: 'clientId' });

Client.hasMany(Signatory, { foreignKey: 'clientId', as: 'signatories' });
Signatory.belongsTo(Client, { foreignKey: 'clientId' });

Client.hasMany(Attorney, { foreignKey: 'clientId', as: 'attorneys' });
Attorney.belongsTo(Client, { foreignKey: 'clientId' });

Client.hasMany(Authority, { foreignKey: 'clientId', as: 'authorities' });
Authority.belongsTo(Client, { foreignKey: 'clientId' });

Client.hasMany(Document, { foreignKey: 'clientId', as: 'documents' });
Document.belongsTo(Client, { foreignKey: 'clientId' });

Client.hasMany(RiskAssessment, { foreignKey: 'clientId', as: 'riskAssessments' });
RiskAssessment.belongsTo(Client, { foreignKey: 'clientId' });

Client.hasMany(Transaction, { foreignKey: 'clientId', as: 'transactions' });
Transaction.belongsTo(Client, { foreignKey: 'clientId' });

Client.hasMany(Alert, { foreignKey: 'clientId', as: 'alerts' });
Alert.belongsTo(Client, { foreignKey: 'clientId' });

Client.hasMany(UnusualOperation, { foreignKey: 'clientId', as: 'unusualOperations' });
UnusualOperation.belongsTo(Client, { foreignKey: 'clientId' });

UnusualOperation.hasOne(SuspiciousReport, { foreignKey: 'unusualOperationId', as: 'suspiciousReport' });
SuspiciousReport.belongsTo(UnusualOperation, { foreignKey: 'unusualOperationId' });

Client.hasMany(SuspiciousReport, { foreignKey: 'clientId', as: 'suspiciousReports' });
SuspiciousReport.belongsTo(Client, { foreignKey: 'clientId' });

Client.hasMany(ScreeningResult, { foreignKey: 'clientId', as: 'screeningResults' });
ScreeningResult.belongsTo(Client, { foreignKey: 'clientId' });

User.hasMany(AuditLog, { foreignKey: 'userId', as: 'auditLogs' });
AuditLog.belongsTo(User, { foreignKey: 'userId' });

Alert.belongsTo(Transaction, { foreignKey: 'transactionId', as: 'transaction' });
Transaction.hasMany(Alert, { foreignKey: 'transactionId', as: 'alerts' });

// Contract associations
Client.hasMany(Contract, { foreignKey: 'clientId', as: 'contracts' });
Contract.belongsTo(Client, { foreignKey: 'clientId' });

Contract.hasMany(ContractSignature, { foreignKey: 'contractId', as: 'signatures' });
ContractSignature.belongsTo(Contract, { foreignKey: 'contractId' });

// PepDeclaration associations
Client.hasMany(PepDeclaration, { foreignKey: 'clientId', as: 'pepDeclarations' });
PepDeclaration.belongsTo(Client, { foreignKey: 'clientId' });

// InvestigationCase - Caso de investigación para operaciones inusuales
const InvestigationCase = sequelize.define('InvestigationCase', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  caseNumber: {
    type: DataTypes.STRING,
    unique: true,
  },
  status: {
    type: DataTypes.ENUM('abierto', 'en_investigacion', 'pendiente_documentacion', 'cerrado_justificado', 'escalado_sospechoso'),
    defaultValue: 'abierto',
  },
  priority: {
    type: DataTypes.ENUM('baja', 'media', 'alta', 'critica'),
    defaultValue: 'media',
  },
  // Resumen del caso
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  // Análisis y conclusiones
  analysisNotes: {
    type: DataTypes.TEXT,
  },
  riskIndicators: {
    type: DataTypes.JSON, // Array de indicadores de riesgo detectados
  },
  mitigatingFactors: {
    type: DataTypes.JSON, // Array de factores atenuantes
  },
  // Decisión final
  finalDecision: {
    type: DataTypes.ENUM('justified', 'suspicious'),
  },
  decisionJustification: {
    type: DataTypes.TEXT,
  },
  decisionDate: {
    type: DataTypes.DATE,
  },
  decidedBy: {
    type: DataTypes.UUID,
  },
  // Fechas de seguimiento
  openedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  lastActivityAt: {
    type: DataTypes.DATE,
  },
  closedAt: {
    type: DataTypes.DATE,
  },
  dueDate: {
    type: DataTypes.DATE, // Fecha límite para resolución
  },
  // Referencias
  createdBy: {
    type: DataTypes.UUID,
  },
  assignedTo: {
    type: DataTypes.UUID,
  },
});

// DocumentRequest - Solicitudes de documentación al cliente
const DocumentRequest = sequelize.define('DocumentRequest', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  requestType: {
    type: DataTypes.STRING, // 'origen_fondos', 'comprobante_operacion', 'contrato', 'factura', 'otro'
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pendiente', 'enviada', 'recibida', 'aprobada', 'rechazada', 'vencida'),
    defaultValue: 'pendiente',
  },
  priority: {
    type: DataTypes.ENUM('baja', 'media', 'alta'),
    defaultValue: 'media',
  },
  // Comunicación
  sentAt: {
    type: DataTypes.DATE,
  },
  sentBy: {
    type: DataTypes.UUID,
  },
  sentMethod: {
    type: DataTypes.STRING, // 'email', 'telefono', 'presencial', 'carta'
  },
  // Respuesta
  receivedAt: {
    type: DataTypes.DATE,
  },
  responseNotes: {
    type: DataTypes.TEXT,
  },
  // Documento recibido
  documentUrl: {
    type: DataTypes.STRING,
  },
  fileName: {
    type: DataTypes.STRING,
  },
  // Revisión
  reviewedAt: {
    type: DataTypes.DATE,
  },
  reviewedBy: {
    type: DataTypes.UUID,
  },
  reviewNotes: {
    type: DataTypes.TEXT,
  },
  // Fechas límite
  dueDate: {
    type: DataTypes.DATE,
  },
  reminderSentAt: {
    type: DataTypes.DATE,
  },
  reminderCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
});

// CaseEvidence - Evidencia adjunta al caso
const CaseEvidence = sequelize.define('CaseEvidence', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  evidenceType: {
    type: DataTypes.STRING, // 'documento', 'captura_pantalla', 'correo', 'nota_interna', 'reporte_externo'
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  // Archivo
  fileUrl: {
    type: DataTypes.STRING,
  },
  fileName: {
    type: DataTypes.STRING,
  },
  mimeType: {
    type: DataTypes.STRING,
  },
  fileSize: {
    type: DataTypes.INTEGER,
  },
  // Metadata
  source: {
    type: DataTypes.STRING, // 'cliente', 'interno', 'externo', 'sistema'
  },
  relevance: {
    type: DataTypes.ENUM('alta', 'media', 'baja'),
    defaultValue: 'media',
  },
  // Auditoría
  uploadedBy: {
    type: DataTypes.UUID,
  },
  uploadedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  notes: {
    type: DataTypes.TEXT,
  },
});

// DatosGenerales - Personas físicas (nuevas o existentes en DCAC)
const DatosGenerales = sequelize.define('DatosGenerales', {
  uuid: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  nombre: { type: DataTypes.STRING, allowNull: false },
  apellido: { type: DataTypes.STRING, allowNull: false },
  dni: { type: DataTypes.STRING },
  cuit: { type: DataTypes.STRING(13) },
  sexo: { type: DataTypes.STRING },
  nacionalidad: { type: DataTypes.STRING },
  fechaNacimiento: { type: DataTypes.DATEONLY },
  calle: { type: DataTypes.STRING },
  numero: { type: DataTypes.STRING },
  piso: { type: DataTypes.STRING },
  depto: { type: DataTypes.STRING },
  localidad: { type: DataTypes.STRING },
  provincia: { type: DataTypes.STRING },
  codigoPostal: { type: DataTypes.STRING },
  email: { type: DataTypes.STRING },
  telefono: { type: DataTypes.STRING },
  fechaEmisionDni: { type: DataTypes.DATEONLY },
  fechaVencimientoDni: { type: DataTypes.DATEONLY },
  nroTramiteDni: { type: DataTypes.STRING },
  dniVigente: { type: DataTypes.BOOLEAN },
});

// DatosGeneralesSociedades - Relación M:N entre personas y sociedades
const DatosGeneralesSociedades = sequelize.define('DatosGeneralesSociedades', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  uuid: { type: DataTypes.UUID, allowNull: false },
  id_sociedad: { type: DataTypes.UUID, allowNull: false },
  rol: { type: DataTypes.STRING }, // socio, representante, apoderado, etc.
});

// SAData - Datos específicos Sociedad Anónima
const SAData = sequelize.define('SAData', {
  sa_id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  id_sociedad: { type: DataTypes.UUID, allowNull: false },
  duracionSocietaria: { type: DataTypes.STRING },
  capitalSuscripto: { type: DataTypes.DECIMAL(15, 2) },
  mandatoVigente: { type: DataTypes.BOOLEAN },
  anioInicioMandato: { type: DataTypes.INTEGER },
  anioFinMandato: { type: DataTypes.INTEGER },
  totalAccionesEmitidas: { type: DataTypes.INTEGER },
  fechaUltimaAnotacionLibro: { type: DataTypes.DATEONLY },
  denominacionSocialCoincide: { type: DataTypes.BOOLEAN },
  poderVerificadoVigente: { type: DataTypes.BOOLEAN },
  observacionesPoder: { type: DataTypes.TEXT },
  fechaDdjjBf: { type: DataTypes.DATEONLY },
  observacionesDdjjBf: { type: DataTypes.TEXT },
  completadoPor: { type: DataTypes.UUID },
  completadoAt: { type: DataTypes.DATE },
});

// SRLData - Datos específicos Sociedad de Responsabilidad Limitada
const SRLData = sequelize.define('SRLData', {
  srl_id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  id_sociedad: { type: DataTypes.UUID, allowNull: false },
  plazo: { type: DataTypes.STRING },
  capitalSocial: { type: DataTypes.DECIMAL(15, 2) },
  fechaAsamblea: { type: DataTypes.DATEONLY },
  mandatoVigente: { type: DataTypes.BOOLEAN },
  inicioMandato: { type: DataTypes.INTEGER },
  finMandato: { type: DataTypes.INTEGER },
  totalCuotasEmitidas: { type: DataTypes.INTEGER },
  fechaUltimaAnotacion: { type: DataTypes.DATEONLY },
  losDatosCoincidentArca: { type: DataTypes.BOOLEAN },
  poderVerificadoVigente: { type: DataTypes.BOOLEAN },
  observacionesPoder: { type: DataTypes.TEXT },
  fechaDdjjBf: { type: DataTypes.DATEONLY },
  observacionesDdjjBf: { type: DataTypes.TEXT },
  fechaDdjjPep: { type: DataTypes.DATEONLY },
  observacionesDdjjPep: { type: DataTypes.TEXT },
  completadoPor: { type: DataTypes.UUID },
  completadoAt: { type: DataTypes.DATE },
});

// SHData - Datos específicos Sociedad de Hecho
const SHData = sequelize.define('SHData', {
  sh_id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  id_sociedad: { type: DataTypes.UUID, allowNull: false },
  fechaConstitucion: { type: DataTypes.DATEONLY },
  calle: { type: DataTypes.STRING },
  numero: { type: DataTypes.STRING },
  piso: { type: DataTypes.STRING },
  depto: { type: DataTypes.STRING },
  localidad: { type: DataTypes.STRING },
  provincia: { type: DataTypes.STRING },
  codigoPostal: { type: DataTypes.STRING },
  objetoSociedad: { type: DataTypes.TEXT },
  duracion: { type: DataTypes.STRING },
  capital: { type: DataTypes.DECIMAL(15, 2) },
  fechaDeclaracionBf: { type: DataTypes.DATEONLY },
  observacionBf: { type: DataTypes.TEXT },
  fechaDeclaracionPep: { type: DataTypes.DATEONLY },
  observacionPep: { type: DataTypes.TEXT },
  completadoPor: { type: DataTypes.UUID },
  completadoAt: { type: DataTypes.DATE },
});

// SucesionData - Datos específicos Sucesión / Sucesión Indivisa
const SucesionData = sequelize.define('SucesionData', {
  sucesion_id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  id_sociedad: { type: DataTypes.UUID, allowNull: false },
  juzgado: { type: DataTypes.STRING },
  nroExpediente: { type: DataTypes.STRING },
  caratula: { type: DataTypes.STRING },
  tipoSucesion: { type: DataTypes.STRING },
  estadoTramite: { type: DataTypes.STRING },
  existeAdministrador: { type: DataTypes.BOOLEAN },
  fechaDesignacionAdministrador: { type: DataTypes.DATEONLY },
  estadoAceptacionCargo: { type: DataTypes.STRING },
  completadoPor: { type: DataTypes.UUID },
  completadoAt: { type: DataTypes.DATE },
});

// MonotributistaData - Datos específicos Monotributista
const MonotributistaData = sequelize.define('MonotributistaData', {
  monotributista_id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  id_sociedad: { type: DataTypes.UUID, allowNull: false },
  completadoPor: { type: DataTypes.UUID },
  completadoAt: { type: DataTypes.DATE },
});

// DatosGenerales associations
DatosGenerales.hasMany(DatosGeneralesSociedades, { foreignKey: 'uuid', as: 'sociedades' });
DatosGeneralesSociedades.belongsTo(DatosGenerales, { foreignKey: 'uuid' });

// InvestigationCase associations
Alert.hasOne(InvestigationCase, { foreignKey: 'alertId', as: 'investigationCase' });
InvestigationCase.belongsTo(Alert, { foreignKey: 'alertId' });

UnusualOperation.hasOne(InvestigationCase, { foreignKey: 'unusualOperationId', as: 'investigationCase' });
InvestigationCase.belongsTo(UnusualOperation, { foreignKey: 'unusualOperationId' });

Client.hasMany(InvestigationCase, { foreignKey: 'clientId', as: 'investigationCases' });
InvestigationCase.belongsTo(Client, { foreignKey: 'clientId' });

InvestigationCase.hasMany(DocumentRequest, { foreignKey: 'caseId', as: 'documentRequests' });
DocumentRequest.belongsTo(InvestigationCase, { foreignKey: 'caseId' });

InvestigationCase.hasMany(CaseEvidence, { foreignKey: 'caseId', as: 'evidence' });
CaseEvidence.belongsTo(InvestigationCase, { foreignKey: 'caseId' });

module.exports = {
  sequelize,
  User,
  Client,
  BeneficialOwner,
  Signatory,
  Attorney,
  Authority,
  Document,
  RiskAssessment,
  Transaction,
  Alert,
  UnusualOperation,
  SuspiciousReport,
  ScreeningResult,
  AuditLog,
  RiskMatrix,
  AlertThreshold,
  Contract,
  ContractSignature,
  PepDeclaration,
  InvestigationCase,
  DocumentRequest,
  CaseEvidence,
  DatosGenerales,
  DatosGeneralesSociedades,
  SAData,
  SRLData,
  SHData,
  SucesionData,
  MonotributistaData,
};
