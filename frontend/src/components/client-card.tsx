"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "./status-badge";
import type { Client } from "@/lib/types";
import { COMPANY_TYPE_LABELS } from "@/lib/types";
import { useClientStore } from "@/lib/client-store";
import {
  Building2,
  Mail,
  Phone,
  FileText,
  Clock,
  Eye,
  CheckCircle2,
  AlertCircle,
  Hash,
  ShieldAlert,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface ClientCardProps {
  client: Client;
}

export function ClientCard({ client }: ClientCardProps) {
  const openReviewModal = useClientStore((state) => state.openReviewModal);

  const requiredDocs = client.documents.filter((doc) => doc.required);
  const pendingDocs = client.documents.filter(
    (doc) => doc.status === "pending"
  ).length;
  const approvedDocs = client.documents.filter(
    (doc) => doc.status === "approved"
  ).length;
  const rejectedDocs = client.documents.filter(
    (doc) => doc.status === "rejected"
  ).length;
  const totalDocs = client.documents.length;

  const allRequiredApproved = requiredDocs.every(
    (doc) => doc.status === "approved"
  );

  const canReview =
    client.status === "pending" || client.status === "pending_pep_approval";

  return (
    <Card className="border-border bg-card hover:border-muted-foreground/30 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-card-foreground truncate">
                {client.companyName}
              </h3>
              <StatusBadge status={client.status} size="sm" />
              {client.hasPEP && (
                <Badge
                  variant="outline"
                  className="text-xs text-warning border-warning/50"
                >
                  <ShieldAlert size={10} className="mr-1" />
                  PEP
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 text-muted-foreground text-sm">
              <span className="flex items-center gap-1">
                <Hash size={12} />
                {client.cuit}
              </span>
              <span className="text-muted-foreground/50">|</span>
              <span>{COMPANY_TYPE_LABELS[client.companyType]}</span>
            </div>
          </div>
          {client.clientId && (
            <Badge variant="outline" className="shrink-0 font-mono text-xs">
              {client.clientId}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 rounded-lg bg-secondary/30 border border-border">
          <p className="text-xs text-muted-foreground mb-1">Contacto</p>
          <p className="font-medium text-sm text-card-foreground">
            {client.name}
          </p>
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Mail size={12} />
              {client.email}
            </span>
            <span className="flex items-center gap-1">
              <Phone size={12} />
              {client.phone}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <FileText size={14} className="text-muted-foreground" />
              <span className="text-muted-foreground">{totalDocs} docs</span>
            </div>
            <div className="flex items-center gap-3">
              {approvedDocs > 0 && (
                <span className="flex items-center gap-1 text-success">
                  <CheckCircle2 size={12} />
                  {approvedDocs}
                </span>
              )}
              {pendingDocs > 0 && (
                <span className="flex items-center gap-1 text-warning">
                  <Clock size={12} />
                  {pendingDocs}
                </span>
              )}
              {rejectedDocs > 0 && (
                <span className="flex items-center gap-1 text-destructive">
                  <AlertCircle size={12} />
                  {rejectedDocs}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock size={12} />
            <span>
              {formatDistanceToNow(new Date(client.submittedAt), {
                addSuffix: true,
                locale: es,
              })}
            </span>
          </div>

          {canReview && (
            <Button
              size="sm"
              onClick={() => openReviewModal(client)}
              className="gap-1.5"
            >
              <Eye size={14} />
              Revisar
              {allRequiredApproved && (
                <CheckCircle2 size={12} className="text-success ml-1" />
              )}
            </Button>
          )}

          {client.status === "approved" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => openReviewModal(client)}
              className="gap-1.5"
            >
              <Eye size={14} />
              Ver detalles
            </Button>
          )}

          {client.status === "rejected" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => openReviewModal(client)}
              className="gap-1.5 text-muted-foreground"
            >
              <Eye size={14} />
              Ver detalles
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
