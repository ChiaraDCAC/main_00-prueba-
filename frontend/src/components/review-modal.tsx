"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { DocumentItem } from "./document-item";
import { StatusBadge } from "./status-badge";
import { SignersConfig } from "./signers-config";
import { PEPAlert } from "./pep-alert";
import { BeneficiaryOwners } from "./beneficiary-owners";
import { useClientStore } from "@/lib/client-store";
import { COMPANY_TYPE_LABELS, ENABLED_FIELDS_BY_TYPE } from "@/lib/types";
import {
  Building2,
  Mail,
  Phone,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Ban,
  Clock,
  Hash,
  Calendar,
  FileText,
} from "lucide-react";

export function ReviewModal() {
  const {
    selectedClient,
    isReviewModalOpen,
    closeReviewModal,
    approveClient,
    rejectClient,
    canApproveClient,
    allRequiredDocsApproved,
    hasConfiguredSigners,
    isPEPBlocked,
  } = useClientStore();

  const [showRejectForm, setShowRejectForm] = useState(false);
  const [clientRejectionReason, setClientRejectionReason] = useState("");

  if (!selectedClient) return null;

  const canApprove = canApproveClient(selectedClient.id);
  const docsApproved = allRequiredDocsApproved(selectedClient.id);
  const signersConfigured = hasConfiguredSigners(selectedClient.id);
  const pepBlocked = isPEPBlocked(selectedClient.id);

  const isApproved = selectedClient.status === "approved";
  const isRejected = selectedClient.status === "rejected";
  const isPendingPEP = selectedClient.status === "pending_pep_approval";
  const isFinal = isApproved || isRejected;

  const requiredDocs = selectedClient.documents.filter((doc) => doc.required);
  const optionalDocs = selectedClient.documents.filter((doc) => !doc.required);

  const pendingRequiredDocs = requiredDocs.filter(
    (doc) => doc.status === "pending"
  ).length;
  const rejectedDocs = selectedClient.documents.filter(
    (doc) => doc.status === "rejected"
  ).length;
  const approvedRequiredDocs = requiredDocs.filter(
    (doc) => doc.status === "approved"
  ).length;

  const handleApproveClient = () => {
    approveClient(selectedClient.id);
  };

  const handleRejectClient = () => {
    if (clientRejectionReason.trim()) {
      rejectClient(selectedClient.id, clientRejectionReason.trim());
      setClientRejectionReason("");
      setShowRejectForm(false);
    }
  };

  const handleCancelReject = () => {
    setShowRejectForm(false);
    setClientRejectionReason("");
  };

  return (
    <Dialog open={isReviewModalOpen} onOpenChange={closeReviewModal}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 bg-card border-border">
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl text-card-foreground">
                {isApproved
                  ? "Sociedad Aprobada"
                  : isRejected
                    ? "Sociedad Rechazada"
                    : isPendingPEP
                      ? "Pendiente Aprobación PEP"
                      : "Revisión de Documentación"}
              </DialogTitle>
              <DialogDescription className="mt-1">
                {isApproved
                  ? "Sociedad aprobada y configurada correctamente"
                  : isRejected
                    ? "Esta sociedad ha sido rechazada"
                    : isPendingPEP
                      ? "Esperando aprobación del Oficial de Cumplimiento"
                      : "Revise los documentos y configure los firmantes"}
              </DialogDescription>
            </div>
            <StatusBadge status={selectedClient.status} />
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-200px)]">
          <div className="px-6 pb-6 space-y-6">
            {/* Metadatos de la Sociedad */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Building2 size={18} className="text-muted-foreground" />
                <h3 className="font-semibold text-card-foreground">
                  Datos de la Sociedad
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-secondary/30 border border-border">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Razón Social
                  </p>
                  <p className="font-medium text-card-foreground">
                    {selectedClient.companyName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">CUIT</p>
                  <p className="font-medium text-card-foreground flex items-center gap-1">
                    <Hash size={14} className="text-muted-foreground" />
                    {selectedClient.cuit}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Tipo de Sociedad
                  </p>
                  <Badge variant="secondary" className="mt-1">
                    {COMPANY_TYPE_LABELS[selectedClient.companyType]}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Fecha de Subida
                  </p>
                  <p className="font-medium text-card-foreground flex items-center gap-1">
                    <Calendar size={14} className="text-muted-foreground" />
                    {new Date(selectedClient.submittedAt).toLocaleDateString(
                      "es-AR",
                      {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      }
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Contacto</p>
                  <p className="text-card-foreground">{selectedClient.name}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-sm text-card-foreground">
                    <Mail size={14} className="text-muted-foreground" />
                    {selectedClient.email}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-card-foreground">
                    <Phone size={14} className="text-muted-foreground" />
                    {selectedClient.phone}
                  </div>
                </div>

                {selectedClient.clientId && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground mb-1">
                      ID de Cliente
                    </p>
                    <Badge variant="outline" className="font-mono text-sm">
                      {selectedClient.clientId}
                    </Badge>
                  </div>
                )}

                {isRejected && selectedClient.rejectionReason && (
                  <div className="col-span-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <p className="text-sm font-medium text-destructive flex items-center gap-2 mb-1">
                      <Ban size={14} />
                      Motivo del Rechazo
                    </p>
                    <p className="text-sm text-card-foreground">
                      {selectedClient.rejectionReason}
                    </p>
                    {selectedClient.rejectedAt && (
                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(selectedClient.rejectedAt).toLocaleString(
                          "es-AR"
                        )}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Alerta PEP */}
            {selectedClient.hasPEP && (
              <>
                <Separator />
                <PEPAlert client={selectedClient} isComplianceOfficer={true} />
              </>
            )}

            <Separator />

            {/* Documentos Obligatorios */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-muted-foreground" />
                  <h3 className="font-semibold text-card-foreground">
                    Documentos Obligatorios
                  </h3>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="flex items-center gap-1 text-success">
                    <CheckCircle2 size={14} />
                    {approvedRequiredDocs}/{requiredDocs.length} aprobados
                  </span>
                  {pendingRequiredDocs > 0 && (
                    <span className="flex items-center gap-1 text-warning">
                      <AlertCircle size={14} />
                      {pendingRequiredDocs} pendientes
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                {requiredDocs.map((doc) => (
                  <DocumentItem
                    key={doc.id}
                    document={doc}
                    clientId={selectedClient.id}
                    readOnly={isFinal}
                  />
                ))}
              </div>
            </div>

            {/* Documentos Opcionales */}
            {optionalDocs.length > 0 && (
              <>
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <FileText size={18} className="text-muted-foreground" />
                    <h3 className="font-semibold text-card-foreground">
                      Documentos Opcionales
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {optionalDocs.map((doc) => (
                      <DocumentItem
                        key={doc.id}
                        document={doc}
                        clientId={selectedClient.id}
                        readOnly={isFinal}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Declaración Jurada de Beneficiarios Finales */}
            <Separator />
            <BeneficiaryOwners client={selectedClient} readOnly={isFinal} />

            {/* Configuración de Firmantes - Solo si los docs obligatorios están aprobados */}
            {!isFinal && docsApproved && (
              <>
                <Separator />
                <SignersConfig client={selectedClient} readOnly={false} />
              </>
            )}

            {/* Firmantes configurados (después de aprobar) */}
            {isApproved && selectedClient.signersConfig && (
              <>
                <Separator />
                <SignersConfig client={selectedClient} readOnly={true} />
              </>
            )}

            {/* Campos habilitados (después de aprobar) */}
            {isApproved && selectedClient.enabledFields && (
              <>
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Sparkles size={18} className="text-success" />
                    <h3 className="font-semibold text-card-foreground">
                      Módulos Habilitados
                    </h3>
                  </div>
                  <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                    <p className="text-sm text-muted-foreground mb-3">
                      Los siguientes módulos han sido habilitados según el tipo
                      de sociedad:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedClient.enabledFields.map((field) => (
                        <Badge
                          key={field}
                          variant="outline"
                          className="border-success/50 text-success bg-success/10"
                        >
                          <CheckCircle2 size={12} className="mr-1" />
                          {field}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Vista previa de campos a habilitar */}
            {!isFinal && canApprove && (
              <>
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Sparkles size={18} className="text-muted-foreground" />
                    <h3 className="font-semibold text-card-foreground">
                      Módulos a Habilitar
                    </h3>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50 border border-border">
                    <p className="text-sm text-muted-foreground mb-3">
                      Al aprobar, se habilitarán los siguientes módulos:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {ENABLED_FIELDS_BY_TYPE[selectedClient.companyType].map(
                        (field) => (
                          <Badge key={field} variant="secondary">
                            {field}
                          </Badge>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        {/* Footer Actions */}
        {!isFinal && (
          <div className="p-6 pt-4 border-t border-border bg-card space-y-4">
            {/* Formulario de rechazo */}
            {showRejectForm && (
              <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20 space-y-3">
                <p className="text-sm font-medium text-destructive flex items-center gap-2">
                  <Ban size={14} />
                  Rechazar Solicitud
                </p>
                <Textarea
                  placeholder="Ingrese el motivo del rechazo de la solicitud..."
                  value={clientRejectionReason}
                  onChange={(e) => setClientRejectionReason(e.target.value)}
                  className="min-h-[80px] bg-background"
                />
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="ghost" onClick={handleCancelReject}>
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleRejectClient}
                    disabled={!clientRejectionReason.trim()}
                  >
                    Confirmar Rechazo
                  </Button>
                </div>
              </div>
            )}

            {/* Estado de validaciones */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                {!docsApproved && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <AlertCircle size={14} />
                    Todos los documentos obligatorios deben estar aprobados
                  </p>
                )}
                {docsApproved && !signersConfigured && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <AlertCircle size={14} />
                    Debe configurar al menos un firmante
                  </p>
                )}
                {docsApproved && signersConfigured && pepBlocked && (
                  <p className="text-sm text-warning flex items-center gap-2">
                    <AlertCircle size={14} />
                    Esperando aprobación PEP del Oficial de Cumplimiento
                  </p>
                )}
                {canApprove && (
                  <p className="text-sm text-success flex items-center gap-2">
                    <CheckCircle2 size={14} />
                    Listo para aprobar
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={closeReviewModal}>
                  Cerrar
                </Button>
                {!showRejectForm && (
                  <Button
                    variant="outline"
                    onClick={() => setShowRejectForm(true)}
                    className="gap-2 text-destructive border-destructive/50 hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Ban size={16} />
                    Rechazar Solicitud
                  </Button>
                )}
                <Button
                  onClick={handleApproveClient}
                  disabled={!canApprove}
                  className="gap-2"
                >
                  <CheckCircle2 size={16} />
                  Aceptar Documentación
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Footer para estado final */}
        {isFinal && (
          <div className="p-6 pt-4 border-t border-border bg-card">
            <div className="flex justify-end">
              <Button variant="outline" onClick={closeReviewModal}>
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
