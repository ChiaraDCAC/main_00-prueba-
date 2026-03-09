export type DocumentStatus = "pending" | "approved" | "rejected";

export type CompanyType =
  | "sociedad_anonima"
  | "srl"
  | "sas"
  | "sociedad_colectiva";

export type DocumentType = "pdf" | "image";

export interface Document {
  id: string;
  name: string;
  type: DocumentType;
  status: DocumentStatus;
  required: boolean;
  url?: string;
  rejectionReason?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  uploadedAt?: string;
}

// Firmante registrado en la sociedad
export interface RegisteredSigner {
  id: string;
  name: string;
  cuit: string;
  email: string;
  role: string;
  isPEP: boolean;
  pepApprovedBy?: string;
  pepApprovedAt?: string;
}

// Firmante externo agregado por el admin
export interface ExternalSigner {
  id: string;
  name: string;
  cuit: string;
  email: string;
}

// Beneficiario Final - Persona con más del 20% del capital o control
export interface BeneficiaryOwner {
  id: string;
  name: string;
  cuit: string;
  nationality: string;
  ownershipPercentage: number; // Porcentaje de participación
  hasControl: boolean; // Tiene control aunque no tenga 20%+
  controlDescription?: string; // Descripción del tipo de control
  isPEP: boolean;
  documentType: "dni" | "passport" | "other";
  documentNumber: string;
  address: string;
  birthDate: string;
}

export interface SignersConfig {
  registeredSigners: string[]; // IDs de firmantes seleccionados
  externalSigners: ExternalSigner[];
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  cuit: string;
  companyType: CompanyType;
  companyName: string;
  submittedAt: string;
  status: "pending" | "approved" | "rejected" | "pending_pep_approval";
  documents: Document[];
  registeredSigners: RegisteredSigner[];
  signersConfig?: SignersConfig;
  beneficiaryOwners: BeneficiaryOwner[]; // Beneficiarios finales declarados
  beneficiaryOwnersValidated?: boolean; // Si la DDJJ fue validada
  beneficiaryOwnersValidatedAt?: string;
  beneficiaryOwnersValidatedBy?: string;
  hasPEP: boolean;
  pepApprovalStatus?: "pending" | "approved" | "rejected";
  pepApprovedBy?: string;
  pepApprovedAt?: string;
  clientId?: string;
  enabledFields?: string[];
  rejectionReason?: string;
  rejectedAt?: string;
  rejectedBy?: string;
}

// Constantes para umbrales de beneficiario final
export const BENEFICIAL_OWNER_THRESHOLD = 20; // Porcentaje para ser considerado beneficiario
export const BENEFICIAL_OWNER_MIN_THRESHOLD = 10; // Umbral mínimo para reportar

// Documentos obligatorios para todas las sociedades argentinas
export const REQUIRED_DOCUMENTS = [
  "Contrato Social",
  "Acta",
  "Libro de Socios",
];

// Documentos opcionales
export const OPTIONAL_DOCUMENTS = ["Poder"];

export const REQUIRED_DOCUMENTS_BY_TYPE: Record<CompanyType, string[]> = {
  sociedad_anonima: [...REQUIRED_DOCUMENTS],
  srl: [...REQUIRED_DOCUMENTS],
  sas: [...REQUIRED_DOCUMENTS],
  sociedad_colectiva: [...REQUIRED_DOCUMENTS],
};

export const OPTIONAL_DOCUMENTS_BY_TYPE: Record<CompanyType, string[]> = {
  sociedad_anonima: [...OPTIONAL_DOCUMENTS],
  srl: [...OPTIONAL_DOCUMENTS],
  sas: [...OPTIONAL_DOCUMENTS],
  sociedad_colectiva: [...OPTIONAL_DOCUMENTS],
};

export const ENABLED_FIELDS_BY_TYPE: Record<CompanyType, string[]> = {
  sociedad_anonima: [
    "Facturación",
    "Contratos",
    "Impuestos",
    "Asamblea de accionistas",
  ],
  srl: [
    "Facturación",
    "Contratos",
    "Impuestos",
    "Reunión de socios",
  ],
  sas: [
    "Facturación",
    "Contratos",
    "Impuestos",
    "Reunión de accionistas",
  ],
  sociedad_colectiva: [
    "Facturación",
    "Contratos",
    "Impuestos",
    "Reunión de socios",
  ],
};

export const COMPANY_TYPE_LABELS: Record<CompanyType, string> = {
  sociedad_anonima: "Sociedad Anónima (S.A.)",
  srl: "Sociedad de Responsabilidad Limitada (S.R.L.)",
  sas: "Sociedad por Acciones Simplificada (S.A.S.)",
  sociedad_colectiva: "Sociedad Colectiva",
};
