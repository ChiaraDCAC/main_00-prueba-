"use client";

import { useClientStore } from "@/lib/client-store";
import { Button } from "@/components/ui/button";
import { Users, Clock, CheckCircle2, XCircle, ClipboardList, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function DashboardHeader() {
  const clients = useClientStore((state) => state.clients);

  const stats = {
    total: clients.length,
    pending: clients.filter((c) => c.status === "pending").length,
    approved: clients.filter((c) => c.status === "approved").length,
    rejected: clients.filter((c) => c.status === "rejected").length,
  };

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Panel de Revisión
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Gestión de clientes y documentos
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-muted">
                <Users size={18} className="text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-warning/20">
                <Clock size={18} className="text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {stats.pending}
                </p>
                <p className="text-xs text-muted-foreground">Pendientes</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-success/20">
                <CheckCircle2 size={18} className="text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {stats.approved}
                </p>
                <p className="text-xs text-muted-foreground">Aprobados</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-destructive/20">
                <XCircle size={18} className="text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {stats.rejected}
                </p>
                <p className="text-xs text-muted-foreground">Rechazados</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
