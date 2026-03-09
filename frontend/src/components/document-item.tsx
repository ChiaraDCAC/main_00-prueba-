"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./status-badge";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import type { Document } from "@/lib/types";
import { useClientStore } from "@/lib/client-store";
import {
  FileText,
  Check,
  X,
  Eye,
  EyeOff,
  AlertTriangle,
  ImageIcon,
  FileIcon,
} from "lucide-react";

interface DocumentItemProps {
  document: Document;
  clientId: string;
  readOnly?: boolean;
}

export function DocumentItem({
  document,
  clientId,
  readOnly = false,
}: DocumentItemProps) {
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const updateDocumentStatus = useClientStore(
    (state) => state.updateDocumentStatus
  );

  const handleApprove = () => {
    updateDocumentStatus(clientId, document.id, "approved");
  };

  const handleReject = () => {
    if (showRejectInput && rejectionReason.trim()) {
      updateDocumentStatus(
        clientId,
        document.id,
        "rejected",
        rejectionReason.trim()
      );
      setShowRejectInput(false);
      setRejectionReason("");
    } else {
      setShowRejectInput(true);
    }
  };

  const handleCancelReject = () => {
    setShowRejectInput(false);
    setRejectionReason("");
  };

  return (
    <div className="border border-border rounded-lg p-4 bg-secondary/30">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="p-2 rounded-md bg-muted">
            <FileText size={18} className="text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-card-foreground truncate">
                {document.name}
              </span>
              {document.required && (
                <Badge variant="outline" className="text-xs shrink-0">
                  Obligatorio
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge status={document.status} size="sm" />
              {document.url && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  {showPreview ? (
                    <>
                      <EyeOff size={12} className="mr-1" />
                      Ocultar
                    </>
                  ) : (
                    <>
                      <Eye size={12} className="mr-1" />
                      Ver documento
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        {!readOnly && document.status === "pending" && (
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-3 border-success/50 text-success hover:bg-success/10 hover:text-success bg-transparent"
              onClick={handleApprove}
            >
              <Check size={14} className="mr-1" />
              Aprobar
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-3 border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive bg-transparent"
              onClick={handleReject}
            >
              <X size={14} className="mr-1" />
              Rechazar
            </Button>
          </div>
        )}
      </div>

      {/* Document Preview */}
      {showPreview && document.url && (
        <div className="mt-4 rounded-lg overflow-hidden border border-border bg-background">
          <div className="flex items-center justify-between p-2 bg-muted/50 border-b border-border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {document.type === "image" ? (
                <ImageIcon size={14} />
              ) : (
                <FileIcon size={14} />
              )}
              <span>Vista previa del documento</span>
            </div>
          </div>
          <div className="p-4">
            {document.type === "image" ? (
              <img
                src={document.url || "/placeholder.svg"}
                alt={document.name}
                className="max-w-full h-auto max-h-[400px] mx-auto rounded-md object-contain"
                crossOrigin="anonymous"
              />
            ) : (
              <iframe
                src={document.url}
                title={document.name}
                className="w-full h-[500px] rounded-md border-0"
              />
            )}
          </div>
        </div>
      )}

      {showRejectInput && (
        <div className="mt-4 space-y-3">
          <Textarea
            placeholder="Ingrese el motivo del rechazo..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            className="min-h-[80px] bg-background"
          />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={handleCancelReject}>
              Cancelar
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectionReason.trim()}
            >
              Confirmar rechazo
            </Button>
          </div>
        </div>
      )}

      {document.status === "rejected" && document.rejectionReason && (
        <div className="mt-3 p-3 rounded-md bg-destructive/10 border border-destructive/20">
          <div className="flex items-start gap-2">
            <AlertTriangle size={14} className="text-destructive mt-0.5 shrink-0" />
            <div className="text-sm">
              <span className="font-medium text-destructive">
                Motivo del rechazo:
              </span>
              <p className="text-muted-foreground mt-1">
                {document.rejectionReason}
              </p>
            </div>
          </div>
        </div>
      )}

      {document.reviewedAt && (
        <div className="mt-2 text-xs text-muted-foreground">
          Revisado por {document.reviewedBy} el{" "}
          {new Date(document.reviewedAt).toLocaleDateString("es-ES", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      )}
    </div>
  );
}
