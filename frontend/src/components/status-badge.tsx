"use client";

import { cn } from "@/lib/utils";
import type { DocumentStatus } from "@/lib/types";
import { CheckCircle2, Clock, XCircle, ShieldAlert } from "lucide-react";

interface StatusBadgeProps {
  status: DocumentStatus | "pending" | "approved" | "rejected" | "pending_pep_approval";
  size?: "sm" | "md";
}

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const sizeClasses = size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-2.5 py-1";
  const iconSize = size === "sm" ? 12 : 14;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        sizeClasses,
        {
          "bg-warning/20 text-warning": status === "pending",
          "bg-success/20 text-success": status === "approved",
          "bg-destructive/20 text-destructive": status === "rejected",
          "bg-orange-500/20 text-orange-600": status === "pending_pep_approval",
        }
      )}
    >
      {status === "pending" && <Clock size={iconSize} />}
      {status === "approved" && <CheckCircle2 size={iconSize} />}
      {status === "rejected" && <XCircle size={iconSize} />}
      {status === "pending_pep_approval" && <ShieldAlert size={iconSize} />}
      {status === "pending" && "Pendiente"}
      {status === "approved" && "Aprobado"}
      {status === "rejected" && "Rechazado"}
      {status === "pending_pep_approval" && "Pendiente PEP"}
    </span>
  );
}
