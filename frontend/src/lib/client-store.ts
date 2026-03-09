import { create } from "zustand";
import type { Client, DocumentStatus, ExternalSigner, SignersConfig, BeneficiaryOwner } from "./types";
import { mockClients } from "./mock-data";
import { ENABLED_FIELDS_BY_TYPE } from "./types";

export type ActiveView = "revision" | "clientes";

interface ClientStore {
  clients: Client[];
  selectedClient: Client | null;
  isReviewModalOpen: boolean;
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  setSelectedClient: (client: Client | null) => void;
  openReviewModal: (client: Client) => void;
  closeReviewModal: () => void;
  updateDocumentStatus: (
    clientId: string,
    documentId: string,
    status: DocumentStatus,
    rejectionReason?: string
  ) => void;
  approveClient: (clientId: string) => void;
  rejectClient: (clientId: string, reason: string) => void;
  rejectDocument: (clientId: string, documentId: string, reason: string) => void;
  canApproveClient: (clientId: string) => boolean;
  allRequiredDocsApproved: (clientId: string) => boolean;
  hasConfiguredSigners: (clientId: string) => boolean;
  isPEPBlocked: (clientId: string) => boolean;
  updateSignersConfig: (clientId: string, config: SignersConfig) => void;
  addExternalSigner: (clientId: string, signer: Omit<ExternalSigner, "id">) => void;
  removeExternalSigner: (clientId: string, signerId: string) => void;
  toggleRegisteredSigner: (clientId: string, signerId: string) => void;
  approvePEP: (clientId: string, approvedBy: string) => void;
  rejectPEP: (clientId: string) => void;
  // Beneficiarios finales
  validateBeneficiaryOwners: (clientId: string, validatedBy: string) => void;
  addBeneficiaryOwner: (clientId: string, owner: Omit<BeneficiaryOwner, "id">) => void;
  removeBeneficiaryOwner: (clientId: string, ownerId: string) => void;
  areBeneficiaryOwnersValidated: (clientId: string) => boolean;
}

function generateClientId(): string {
  const prefix = "CLI";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

function generateSignerId(): string {
  return `ext-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
}

export const useClientStore = create<ClientStore>((set, get) => ({
  clients: mockClients,
  selectedClient: null,
  isReviewModalOpen: false,
  activeView: "revision",

  setActiveView: (view) => set({ activeView: view }),

  setSelectedClient: (client) => set({ selectedClient: client }),

  openReviewModal: (client) =>
    set({ selectedClient: client, isReviewModalOpen: true }),

  closeReviewModal: () =>
    set({ selectedClient: null, isReviewModalOpen: false }),

  updateDocumentStatus: (clientId, documentId, status, rejectionReason) => {
    set((state) => ({
      clients: state.clients.map((client) => {
        if (client.id !== clientId) return client;
        return {
          ...client,
          documents: client.documents.map((doc) => {
            if (doc.id !== documentId) return doc;
            return {
              ...doc,
              status,
              rejectionReason: status === "rejected" ? rejectionReason : undefined,
              reviewedAt: new Date().toISOString(),
              reviewedBy: "Admin",
            };
          }),
        };
      }),
      selectedClient:
        state.selectedClient?.id === clientId
          ? {
              ...state.selectedClient,
              documents: state.selectedClient.documents.map((doc) => {
                if (doc.id !== documentId) return doc;
                return {
                  ...doc,
                  status,
                  rejectionReason:
                    status === "rejected" ? rejectionReason : undefined,
                  reviewedAt: new Date().toISOString(),
                  reviewedBy: "Admin",
                };
              }),
            }
          : state.selectedClient,
    }));
  },

  rejectDocument: (clientId, documentId, reason) => {
    get().updateDocumentStatus(clientId, documentId, "rejected", reason);
  },

  approveClient: (clientId) => {
    set((state) => ({
      clients: state.clients.map((client) => {
        if (client.id !== clientId) return client;
        return {
          ...client,
          status: "approved",
          clientId: generateClientId(),
          enabledFields: ENABLED_FIELDS_BY_TYPE[client.companyType],
        };
      }),
      isReviewModalOpen: false,
      selectedClient: null,
    }));
  },

  rejectClient: (clientId, reason) => {
    set((state) => ({
      clients: state.clients.map((client) => {
        if (client.id !== clientId) return client;
        return {
          ...client,
          status: "rejected",
          rejectionReason: reason,
          rejectedAt: new Date().toISOString(),
          rejectedBy: "Admin",
        };
      }),
      isReviewModalOpen: false,
      selectedClient: null,
    }));
  },

  // Solo verifica documentos OBLIGATORIOS (required: true)
  allRequiredDocsApproved: (clientId) => {
    const client = get().clients.find((c) => c.id === clientId);
    if (!client) return false;
    const requiredDocs = client.documents.filter((doc) => doc.required);
    return requiredDocs.every((doc) => doc.status === "approved");
  },

  // Verifica si tiene al menos un firmante configurado
  hasConfiguredSigners: (clientId) => {
    const client = get().clients.find((c) => c.id === clientId);
    if (!client || !client.signersConfig) return false;
    const totalSigners =
      client.signersConfig.registeredSigners.length +
      client.signersConfig.externalSigners.length;
    return totalSigners > 0;
  },

  // Verifica si está bloqueado por PEP
  isPEPBlocked: (clientId) => {
    const client = get().clients.find((c) => c.id === clientId);
    if (!client) return false;
    return client.hasPEP && client.pepApprovalStatus !== "approved";
  },

  // Puede aprobar cliente si:
  // 1. Todos los documentos obligatorios están aprobados
  // 2. Tiene al menos un firmante configurado
  // 3. Si tiene PEP, debe estar aprobado por el Oficial de Cumplimiento
  canApproveClient: (clientId) => {
    const state = get();
    const allDocsApproved = state.allRequiredDocsApproved(clientId);
    const hasSigners = state.hasConfiguredSigners(clientId);
    const pepBlocked = state.isPEPBlocked(clientId);

    return allDocsApproved && hasSigners && !pepBlocked;
  },

  updateSignersConfig: (clientId, config) => {
    set((state) => {
      const updatedClients = state.clients.map((client) => {
        if (client.id !== clientId) return client;
        return {
          ...client,
          signersConfig: config,
        };
      });

      const updatedSelectedClient = state.selectedClient?.id === clientId
        ? { ...state.selectedClient, signersConfig: config }
        : state.selectedClient;

      return {
        clients: updatedClients,
        selectedClient: updatedSelectedClient,
      };
    });
  },

  addExternalSigner: (clientId, signer) => {
    set((state) => {
      const client = state.clients.find((c) => c.id === clientId);
      if (!client) return state;

      const newSigner: ExternalSigner = {
        ...signer,
        id: generateSignerId(),
      };

      const currentConfig = client.signersConfig || {
        registeredSigners: [],
        externalSigners: [],
      };

      const updatedConfig: SignersConfig = {
        ...currentConfig,
        externalSigners: [...currentConfig.externalSigners, newSigner],
      };

      const updatedClients = state.clients.map((c) => {
        if (c.id !== clientId) return c;
        return { ...c, signersConfig: updatedConfig };
      });

      const updatedSelectedClient = state.selectedClient?.id === clientId
        ? { ...state.selectedClient, signersConfig: updatedConfig }
        : state.selectedClient;

      return {
        clients: updatedClients,
        selectedClient: updatedSelectedClient,
      };
    });
  },

  removeExternalSigner: (clientId, signerId) => {
    set((state) => {
      const client = state.clients.find((c) => c.id === clientId);
      if (!client || !client.signersConfig) return state;

      const updatedConfig: SignersConfig = {
        ...client.signersConfig,
        externalSigners: client.signersConfig.externalSigners.filter(
          (s) => s.id !== signerId
        ),
      };

      const updatedClients = state.clients.map((c) => {
        if (c.id !== clientId) return c;
        return { ...c, signersConfig: updatedConfig };
      });

      const updatedSelectedClient = state.selectedClient?.id === clientId
        ? { ...state.selectedClient, signersConfig: updatedConfig }
        : state.selectedClient;

      return {
        clients: updatedClients,
        selectedClient: updatedSelectedClient,
      };
    });
  },

  toggleRegisteredSigner: (clientId, signerId) => {
    set((state) => {
      const client = state.clients.find((c) => c.id === clientId);
      if (!client) return state;

      const currentConfig = client.signersConfig || {
        registeredSigners: [],
        externalSigners: [],
      };

      const isSelected = currentConfig.registeredSigners.includes(signerId);
      const updatedRegisteredSigners = isSelected
        ? currentConfig.registeredSigners.filter((id) => id !== signerId)
        : [...currentConfig.registeredSigners, signerId];

      const updatedConfig: SignersConfig = {
        ...currentConfig,
        registeredSigners: updatedRegisteredSigners,
      };

      const updatedClients = state.clients.map((c) => {
        if (c.id !== clientId) return c;
        return { ...c, signersConfig: updatedConfig };
      });

      const updatedSelectedClient = state.selectedClient?.id === clientId
        ? { ...state.selectedClient, signersConfig: updatedConfig }
        : state.selectedClient;

      return {
        clients: updatedClients,
        selectedClient: updatedSelectedClient,
      };
    });
  },

  approvePEP: (clientId, approvedBy) => {
    set((state) => {
      const updatedClients = state.clients.map((client) => {
        if (client.id !== clientId) return client;
        return {
          ...client,
          pepApprovalStatus: "approved" as const,
          pepApprovedBy: approvedBy,
          pepApprovedAt: new Date().toISOString(),
          status: client.status === "pending_pep_approval" ? "pending" as const : client.status,
        };
      });

      const updatedSelectedClient = state.selectedClient?.id === clientId
        ? {
            ...state.selectedClient,
            pepApprovalStatus: "approved" as const,
            pepApprovedBy: approvedBy,
            pepApprovedAt: new Date().toISOString(),
            status: state.selectedClient.status === "pending_pep_approval"
              ? "pending" as const
              : state.selectedClient.status,
          }
        : state.selectedClient;

      return {
        clients: updatedClients,
        selectedClient: updatedSelectedClient,
      };
    });
  },

  rejectPEP: (clientId) => {
    set((state) => ({
      clients: state.clients.map((client) => {
        if (client.id !== clientId) return client;
        return {
          ...client,
          pepApprovalStatus: "rejected" as const,
          status: "rejected" as const,
          rejectionReason: "Rechazado por el Oficial de Cumplimiento debido a condición PEP",
          rejectedAt: new Date().toISOString(),
          rejectedBy: "Oficial de Cumplimiento",
        };
      }),
      isReviewModalOpen: false,
      selectedClient: null,
    }));
  },

  // Beneficiarios finales
  validateBeneficiaryOwners: (clientId, validatedBy) => {
    set((state) => {
      const updatedClients = state.clients.map((client) => {
        if (client.id !== clientId) return client;
        return {
          ...client,
          beneficiaryOwnersValidated: true,
          beneficiaryOwnersValidatedAt: new Date().toISOString(),
          beneficiaryOwnersValidatedBy: validatedBy,
        };
      });

      const updatedSelectedClient = state.selectedClient?.id === clientId
        ? {
            ...state.selectedClient,
            beneficiaryOwnersValidated: true,
            beneficiaryOwnersValidatedAt: new Date().toISOString(),
            beneficiaryOwnersValidatedBy: validatedBy,
          }
        : state.selectedClient;

      return {
        clients: updatedClients,
        selectedClient: updatedSelectedClient,
      };
    });
  },

  addBeneficiaryOwner: (clientId, owner) => {
    set((state) => {
      const newOwner: BeneficiaryOwner = {
        ...owner,
        id: `bo-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      };

      const updatedClients = state.clients.map((client) => {
        if (client.id !== clientId) return client;
        return {
          ...client,
          beneficiaryOwners: [...(client.beneficiaryOwners || []), newOwner],
          beneficiaryOwnersValidated: false, // Invalidate on changes
        };
      });

      const updatedSelectedClient = state.selectedClient?.id === clientId
        ? {
            ...state.selectedClient,
            beneficiaryOwners: [...(state.selectedClient.beneficiaryOwners || []), newOwner],
            beneficiaryOwnersValidated: false,
          }
        : state.selectedClient;

      return {
        clients: updatedClients,
        selectedClient: updatedSelectedClient,
      };
    });
  },

  removeBeneficiaryOwner: (clientId, ownerId) => {
    set((state) => {
      const updatedClients = state.clients.map((client) => {
        if (client.id !== clientId) return client;
        return {
          ...client,
          beneficiaryOwners: (client.beneficiaryOwners || []).filter(
            (bo) => bo.id !== ownerId
          ),
          beneficiaryOwnersValidated: false, // Invalidate on changes
        };
      });

      const updatedSelectedClient = state.selectedClient?.id === clientId
        ? {
            ...state.selectedClient,
            beneficiaryOwners: (state.selectedClient.beneficiaryOwners || []).filter(
              (bo) => bo.id !== ownerId
            ),
            beneficiaryOwnersValidated: false,
          }
        : state.selectedClient;

      return {
        clients: updatedClients,
        selectedClient: updatedSelectedClient,
      };
    });
  },

  areBeneficiaryOwnersValidated: (clientId) => {
    const client = get().clients.find((c) => c.id === clientId);
    return client?.beneficiaryOwnersValidated || false;
  },
}));
