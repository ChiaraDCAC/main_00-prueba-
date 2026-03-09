"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useClientStore } from "@/lib/client-store";
import type { Client } from "@/lib/types";
import {
  Users,
  UserPlus,
  Check,
  X,
  AlertTriangle,
  Mail,
  Hash,
} from "lucide-react";

interface SignersConfigProps {
  client: Client;
  readOnly?: boolean;
}

export function SignersConfig({ client, readOnly = false }: SignersConfigProps) {
  const { toggleRegisteredSigner, addExternalSigner, removeExternalSigner } =
    useClientStore();

  const [showAddExternal, setShowAddExternal] = useState(false);
  const [externalName, setExternalName] = useState("");
  const [externalCuit, setExternalCuit] = useState("");
  const [externalEmail, setExternalEmail] = useState("");

  const signersConfig = client.signersConfig || {
    registeredSigners: [],
    externalSigners: [],
  };

  const totalSigners =
    signersConfig.registeredSigners.length +
    signersConfig.externalSigners.length;

  const handleAddExternal = () => {
    if (externalName.trim() && externalCuit.trim() && externalEmail.trim()) {
      addExternalSigner(client.id, {
        name: externalName.trim(),
        cuit: externalCuit.trim(),
        email: externalEmail.trim(),
      });
      setExternalName("");
      setExternalCuit("");
      setExternalEmail("");
      setShowAddExternal(false);
    }
  };

  const handleCancelAdd = () => {
    setExternalName("");
    setExternalCuit("");
    setExternalEmail("");
    setShowAddExternal(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-muted-foreground" />
          <h3 className="font-semibold text-card-foreground">
            Configuración de Firmantes
          </h3>
        </div>
        {totalSigners === 0 && !readOnly && (
          <Badge variant="outline" className="text-warning border-warning/50">
            <AlertTriangle size={12} className="mr-1" />
            Sin firmantes
          </Badge>
        )}
        {totalSigners > 0 && (
          <Badge variant="outline" className="text-success border-success/50">
            <Check size={12} className="mr-1" />
            {totalSigners} firmante{totalSigners > 1 ? "s" : ""} configurado
            {totalSigners > 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {/* Firmantes Registrados */}
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Usuarios registrados en la sociedad:
        </p>
        <div className="space-y-2">
          {client.registeredSigners.map((signer) => {
            const isSelected = signersConfig.registeredSigners.includes(
              signer.id
            );
            return (
              <div
                key={signer.id}
                className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                  isSelected
                    ? "border-primary/50 bg-primary/5"
                    : "border-border bg-secondary/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  {!readOnly && (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() =>
                        toggleRegisteredSigner(client.id, signer.id)
                      }
                      className="h-4 w-4 rounded border-border"
                    />
                  )}
                  {readOnly && isSelected && (
                    <Check size={16} className="text-success" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-card-foreground">
                        {signer.name}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {signer.role}
                      </Badge>
                      {signer.isPEP && (
                        <Badge
                          variant="outline"
                          className="text-xs text-warning border-warning/50"
                        >
                          PEP
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Hash size={10} />
                        {signer.cuit}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail size={10} />
                        {signer.email}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* Firmantes Externos */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Firmantes externos:</p>
          {!readOnly && !showAddExternal && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAddExternal(true)}
              className="gap-1"
            >
              <UserPlus size={14} />
              Agregar externo
            </Button>
          )}
        </div>

        {signersConfig.externalSigners.length === 0 && !showAddExternal && (
          <p className="text-sm text-muted-foreground italic">
            No hay firmantes externos configurados
          </p>
        )}

        {signersConfig.externalSigners.map((signer) => (
          <div
            key={signer.id}
            className="flex items-center justify-between p-3 rounded-lg border border-border bg-secondary/30"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-card-foreground">
                  {signer.name}
                </span>
                <Badge variant="outline" className="text-xs">
                  Externo
                </Badge>
              </div>
              <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Hash size={10} />
                  {signer.cuit}
                </span>
                <span className="flex items-center gap-1">
                  <Mail size={10} />
                  {signer.email}
                </span>
              </div>
            </div>
            {!readOnly && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeExternalSigner(client.id, signer.id)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <X size={14} />
              </Button>
            )}
          </div>
        ))}

        {showAddExternal && (
          <div className="p-4 rounded-lg border border-border bg-muted/30 space-y-3">
            <p className="text-sm font-medium text-card-foreground">
              Nuevo firmante externo
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input
                placeholder="Nombre completo"
                value={externalName}
                onChange={(e) => setExternalName(e.target.value)}
              />
              <Input
                placeholder="CUIT (ej: 20-12345678-9)"
                value={externalCuit}
                onChange={(e) => setExternalCuit(e.target.value)}
              />
              <Input
                type="email"
                placeholder="Email"
                value={externalEmail}
                onChange={(e) => setExternalEmail(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={handleCancelAdd}>
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleAddExternal}
                disabled={
                  !externalName.trim() ||
                  !externalCuit.trim() ||
                  !externalEmail.trim()
                }
              >
                <UserPlus size={14} className="mr-1" />
                Agregar
              </Button>
            </div>
          </div>
        )}
      </div>

      {totalSigners === 0 && !readOnly && (
        <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
          <p className="text-sm text-warning flex items-center gap-2">
            <AlertTriangle size={14} />
            Debe seleccionar al menos un firmante para aprobar la documentación
          </p>
        </div>
      )}
    </div>
  );
}
