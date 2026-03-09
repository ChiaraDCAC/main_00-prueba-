"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useClientStore } from "@/lib/client-store";
import type { Client } from "@/lib/types";
import {
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";

interface PEPAlertProps {
  client: Client;
  isComplianceOfficer?: boolean;
}

export function PEPAlert({
  client,
  isComplianceOfficer = false,
}: PEPAlertProps) {
  const { approvePEP, rejectPEP } = useClientStore();

  if (!client.hasPEP) return null;

  const pepSigners = client.registeredSigners.filter((s) => s.isPEP);

  const handleApprovePEP = () => {
    approvePEP(client.id, "Oficial de Cumplimiento");
  };

  const handleRejectPEP = () => {
    rejectPEP(client.id);
  };

  if (client.pepApprovalStatus === "approved") {
    return (
      <div className="p-4 rounded-lg bg-success/10 border border-success/20">
        <div className="flex items-start gap-3">
          <ShieldCheck className="text-success mt-0.5" size={20} />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-medium text-success">PEP Aprobado</h4>
              <Badge
                variant="outline"
                className="text-success border-success/50"
              >
                <CheckCircle2 size={12} className="mr-1" />
                Aprobado
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              La condición PEP ha sido aprobada por el Oficial de Cumplimiento.
            </p>
            {client.pepApprovedBy && client.pepApprovedAt && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock size={12} />
                Aprobado por {client.pepApprovedBy} el{" "}
                {new Date(client.pepApprovedAt).toLocaleDateString("es-AR", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
      <div className="flex items-start gap-3">
        <ShieldAlert className="text-warning mt-0.5" size={20} />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-medium text-warning">
              Persona Expuesta Políticamente (PEP)
            </h4>
            <Badge variant="outline" className="text-warning border-warning/50">
              <AlertTriangle size={12} className="mr-1" />
              Requiere aprobación
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Esta sociedad tiene {pepSigners.length} persona
            {pepSigners.length > 1 ? "s" : ""} declarada
            {pepSigners.length > 1 ? "s" : ""} como PEP. Se requiere aprobación
            del Oficial de Cumplimiento antes de continuar.
          </p>

          <div className="space-y-2 mb-4">
            {pepSigners.map((signer) => (
              <div
                key={signer.id}
                className="flex items-center gap-2 text-sm p-2 rounded bg-background/50"
              >
                <AlertTriangle size={14} className="text-warning" />
                <span className="font-medium">{signer.name}</span>
                <span className="text-muted-foreground">-</span>
                <span className="text-muted-foreground">{signer.role}</span>
                <Badge variant="secondary" className="text-xs ml-auto">
                  CUIT: {signer.cuit}
                </Badge>
              </div>
            ))}
          </div>

          <div className="p-3 rounded bg-background/50 mb-4">
            <p className="text-xs text-muted-foreground">
              <strong>Nota:</strong> Las sociedades con personas PEP requieren
              ajustes de riesgo y mayor frecuencia de revisión según la
              normativa vigente.
            </p>
          </div>

          {isComplianceOfficer && (
            <div className="flex items-center gap-3 pt-2 border-t border-warning/20">
              <Button
                size="sm"
                variant="outline"
                onClick={handleRejectPEP}
                className="gap-1 text-destructive border-destructive/50 hover:bg-destructive/10"
              >
                <XCircle size={14} />
                Rechazar
              </Button>
              <Button
                size="sm"
                onClick={handleApprovePEP}
                className="gap-1 bg-success hover:bg-success/90"
              >
                <CheckCircle2 size={14} />
                Aprobar PEP
              </Button>
            </div>
          )}

          {!isComplianceOfficer && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t border-warning/20">
              <Clock size={14} />
              Esperando aprobación del Oficial de Cumplimiento
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
