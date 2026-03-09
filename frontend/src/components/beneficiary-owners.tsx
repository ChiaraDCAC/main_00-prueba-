"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useClientStore } from "@/lib/client-store";
import type { Client, BeneficiaryOwner } from "@/lib/types";
import {
  BENEFICIAL_OWNER_THRESHOLD,
  BENEFICIAL_OWNER_MIN_THRESHOLD,
} from "@/lib/types";
import {
  Users,
  UserPlus,
  Check,
  X,
  AlertTriangle,
  ShieldAlert,
  Percent,
  FileText,
  MapPin,
  Calendar,
  Hash,
  Flag,
  CheckCircle2,
  Clock,
  Trash2,
} from "lucide-react";

interface BeneficiaryOwnersProps {
  client: Client;
  readOnly?: boolean;
}

export function BeneficiaryOwners({
  client,
  readOnly = false,
}: BeneficiaryOwnersProps) {
  const { validateBeneficiaryOwners, addBeneficiaryOwner, removeBeneficiaryOwner } =
    useClientStore();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newOwner, setNewOwner] = useState<Partial<BeneficiaryOwner>>({
    name: "",
    cuit: "",
    nationality: "Argentina",
    ownershipPercentage: 0,
    hasControl: false,
    controlDescription: "",
    isPEP: false,
    documentType: "dni",
    documentNumber: "",
    address: "",
    birthDate: "",
  });

  const beneficiaryOwners = client.beneficiaryOwners || [];
  const isValidated = client.beneficiaryOwnersValidated;

  // Calcular totales
  const totalPercentage = beneficiaryOwners.reduce(
    (sum, bo) => sum + bo.ownershipPercentage,
    0
  );
  const ownersAboveThreshold = beneficiaryOwners.filter(
    (bo) => bo.ownershipPercentage >= BENEFICIAL_OWNER_THRESHOLD || bo.hasControl
  );
  const ownersWithControl = beneficiaryOwners.filter((bo) => bo.hasControl);
  const pepOwners = beneficiaryOwners.filter((bo) => bo.isPEP);

  const handleValidate = () => {
    validateBeneficiaryOwners(client.id, "Admin");
  };

  const handleAddOwner = () => {
    if (
      newOwner.name &&
      newOwner.cuit &&
      newOwner.documentNumber &&
      newOwner.ownershipPercentage !== undefined
    ) {
      addBeneficiaryOwner(client.id, newOwner as Omit<BeneficiaryOwner, "id">);
      setNewOwner({
        name: "",
        cuit: "",
        nationality: "Argentina",
        ownershipPercentage: 0,
        hasControl: false,
        controlDescription: "",
        isPEP: false,
        documentType: "dni",
        documentNumber: "",
        address: "",
        birthDate: "",
      });
      setShowAddForm(false);
    }
  };

  const handleRemoveOwner = (ownerId: string) => {
    removeBeneficiaryOwner(client.id, ownerId);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-muted-foreground" />
          <h3 className="font-semibold text-card-foreground">
            Declaración Jurada de Beneficiarios Finales
          </h3>
        </div>
        {isValidated ? (
          <Badge variant="outline" className="text-success border-success/50">
            <CheckCircle2 size={12} className="mr-1" />
            Validada
          </Badge>
        ) : (
          <Badge variant="outline" className="text-warning border-warning/50">
            <Clock size={12} className="mr-1" />
            Pendiente validación
          </Badge>
        )}
      </div>

      {/* Info Banner */}
      <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 dark:bg-blue-950/30 dark:border-blue-900">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Umbral de identificación:</strong> Personas con más del{" "}
          {BENEFICIAL_OWNER_THRESHOLD}% del capital o control efectivo. Umbral
          mínimo de reporte: {BENEFICIAL_OWNER_MIN_THRESHOLD}%.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg bg-secondary/30 border border-border text-center">
          <p className="text-2xl font-bold text-card-foreground">
            {beneficiaryOwners.length}
          </p>
          <p className="text-xs text-muted-foreground">Beneficiarios declarados</p>
        </div>
        <div className="p-3 rounded-lg bg-secondary/30 border border-border text-center">
          <p className="text-2xl font-bold text-card-foreground">
            {totalPercentage}%
          </p>
          <p className="text-xs text-muted-foreground">Capital identificado</p>
        </div>
        <div className="p-3 rounded-lg bg-secondary/30 border border-border text-center">
          <p className="text-2xl font-bold text-card-foreground">
            {ownersAboveThreshold.length}
          </p>
          <p className="text-xs text-muted-foreground">Con +{BENEFICIAL_OWNER_THRESHOLD}% o control</p>
        </div>
        <div
          className={`p-3 rounded-lg border text-center ${
            pepOwners.length > 0
              ? "bg-warning/10 border-warning/30"
              : "bg-secondary/30 border-border"
          }`}
        >
          <p
            className={`text-2xl font-bold ${
              pepOwners.length > 0 ? "text-warning" : "text-card-foreground"
            }`}
          >
            {pepOwners.length}
          </p>
          <p className="text-xs text-muted-foreground">PEP identificados</p>
        </div>
      </div>

      {/* Warning if total is not 100% */}
      {totalPercentage !== 100 && beneficiaryOwners.length > 0 && (
        <div className="p-3 rounded-lg bg-warning/10 border border-warning/30">
          <p className="text-sm text-warning flex items-center gap-2">
            <AlertTriangle size={14} />
            El capital identificado ({totalPercentage}%) no suma 100%. Verifique
            la información declarada.
          </p>
        </div>
      )}

      <Separator />

      {/* Beneficiary List */}
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground font-medium">
          Beneficiarios Finales Declarados:
        </p>

        {beneficiaryOwners.length === 0 ? (
          <p className="text-sm text-muted-foreground italic py-4 text-center">
            No hay beneficiarios finales declarados
          </p>
        ) : (
          beneficiaryOwners.map((owner) => (
            <div
              key={owner.id}
              className={`p-4 rounded-lg border transition-colors ${
                owner.ownershipPercentage >= BENEFICIAL_OWNER_THRESHOLD ||
                owner.hasControl
                  ? "border-primary/30 bg-primary/5"
                  : "border-border bg-secondary/30"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-card-foreground">
                      {owner.name}
                    </span>
                    <Badge
                      variant={
                        owner.ownershipPercentage >= BENEFICIAL_OWNER_THRESHOLD
                          ? "default"
                          : "secondary"
                      }
                      className="text-xs"
                    >
                      <Percent size={10} className="mr-1" />
                      {owner.ownershipPercentage}%
                    </Badge>
                    {owner.hasControl && (
                      <Badge
                        variant="outline"
                        className="text-xs text-primary border-primary/50"
                      >
                        Control
                      </Badge>
                    )}
                    {owner.isPEP && (
                      <Badge
                        variant="outline"
                        className="text-xs text-warning border-warning/50"
                      >
                        <ShieldAlert size={10} className="mr-1" />
                        PEP
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Hash size={10} />
                      CUIT: {owner.cuit}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText size={10} />
                      {owner.documentType.toUpperCase()}: {owner.documentNumber}
                    </span>
                    <span className="flex items-center gap-1">
                      <Flag size={10} />
                      {owner.nationality}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={10} />
                      {new Date(owner.birthDate).toLocaleDateString("es-AR")}
                    </span>
                  </div>

                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin size={10} />
                    {owner.address}
                  </div>

                  {owner.hasControl && owner.controlDescription && (
                    <div className="text-xs text-primary bg-primary/10 p-2 rounded">
                      <strong>Tipo de control:</strong> {owner.controlDescription}
                    </div>
                  )}
                </div>

                {!readOnly && !isValidated && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveOwner(owner.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 size={14} />
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add New Owner Form */}
      {!readOnly && !isValidated && (
        <>
          {!showAddForm ? (
            <Button
              variant="outline"
              onClick={() => setShowAddForm(true)}
              className="w-full gap-2"
            >
              <UserPlus size={16} />
              Agregar Beneficiario Final
            </Button>
          ) : (
            <div className="p-4 rounded-lg border border-border bg-muted/30 space-y-4">
              <p className="text-sm font-medium text-card-foreground">
                Nuevo Beneficiario Final
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">
                    Nombre completo *
                  </label>
                  <Input
                    placeholder="Nombre y Apellido"
                    value={newOwner.name}
                    onChange={(e) =>
                      setNewOwner({ ...newOwner, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">CUIT *</label>
                  <Input
                    placeholder="20-12345678-9"
                    value={newOwner.cuit}
                    onChange={(e) =>
                      setNewOwner({ ...newOwner, cuit: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">
                    Tipo documento
                  </label>
                  <select
                    className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                    value={newOwner.documentType}
                    onChange={(e) =>
                      setNewOwner({
                        ...newOwner,
                        documentType: e.target.value as "dni" | "passport" | "other",
                      })
                    }
                  >
                    <option value="dni">DNI</option>
                    <option value="passport">Pasaporte</option>
                    <option value="other">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">
                    Número documento *
                  </label>
                  <Input
                    placeholder="12345678"
                    value={newOwner.documentNumber}
                    onChange={(e) =>
                      setNewOwner({ ...newOwner, documentNumber: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">
                    Nacionalidad
                  </label>
                  <Input
                    placeholder="Argentina"
                    value={newOwner.nationality}
                    onChange={(e) =>
                      setNewOwner({ ...newOwner, nationality: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">
                    Fecha de nacimiento
                  </label>
                  <Input
                    type="date"
                    value={newOwner.birthDate}
                    onChange={(e) =>
                      setNewOwner({ ...newOwner, birthDate: e.target.value })
                    }
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs text-muted-foreground">
                    Domicilio
                  </label>
                  <Input
                    placeholder="Dirección completa"
                    value={newOwner.address}
                    onChange={(e) =>
                      setNewOwner({ ...newOwner, address: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">
                    Porcentaje de participación *
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0"
                    value={newOwner.ownershipPercentage || ""}
                    onChange={(e) =>
                      setNewOwner({
                        ...newOwner,
                        ownershipPercentage: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="flex items-end gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={newOwner.hasControl}
                      onChange={(e) =>
                        setNewOwner({ ...newOwner, hasControl: e.target.checked })
                      }
                      className="h-4 w-4 rounded border-border"
                    />
                    Tiene control efectivo
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={newOwner.isPEP}
                      onChange={(e) =>
                        setNewOwner({ ...newOwner, isPEP: e.target.checked })
                      }
                      className="h-4 w-4 rounded border-border"
                    />
                    Es PEP
                  </label>
                </div>
                {newOwner.hasControl && (
                  <div className="md:col-span-2">
                    <label className="text-xs text-muted-foreground">
                      Descripción del control
                    </label>
                    <Input
                      placeholder="Ej: Control mayoritario del directorio"
                      value={newOwner.controlDescription}
                      onChange={(e) =>
                        setNewOwner({
                          ...newOwner,
                          controlDescription: e.target.value,
                        })
                      }
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={handleAddOwner}
                  disabled={
                    !newOwner.name ||
                    !newOwner.cuit ||
                    !newOwner.documentNumber ||
                    newOwner.ownershipPercentage === undefined
                  }
                >
                  <UserPlus size={14} className="mr-1" />
                  Agregar
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Validation Info */}
      {isValidated && client.beneficiaryOwnersValidatedAt && (
        <div className="p-3 rounded-lg bg-success/10 border border-success/20">
          <p className="text-sm text-success flex items-center gap-2">
            <CheckCircle2 size={14} />
            Validada por {client.beneficiaryOwnersValidatedBy} el{" "}
            {new Date(client.beneficiaryOwnersValidatedAt).toLocaleDateString(
              "es-AR",
              {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }
            )}
          </p>
        </div>
      )}

      {/* Validate Button */}
      {!readOnly && !isValidated && beneficiaryOwners.length > 0 && (
        <Button onClick={handleValidate} className="w-full gap-2">
          <CheckCircle2 size={16} />
          Validar Declaración Jurada de Beneficiarios Finales
        </Button>
      )}
    </div>
  );
}
