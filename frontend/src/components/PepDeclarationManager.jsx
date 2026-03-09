import { useState, useEffect } from 'react';
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Upload,
  User,
  FileText,
  XCircle,
  ChevronDown,
  ChevronUp,
  Eye,
  Plus,
} from 'lucide-react';

/**
 * PepDeclarationManager - Gestiona las DDJJ PEP de todas las personas vinculadas
 *
 * Requerido para:
 * - Representantes legales
 * - Apoderados
 * - Firmantes
 * - Beneficiarios finales
 *
 * Si es PEP:
 * - Requiere aprobación del Oficial de Cumplimiento
 * - Requiere documentación adicional (origen de fondos, patrimonio)
 */

const PepDeclarationManager = ({
  clientId,
  persons = [], // Lista de personas que requieren DDJJ PEP
  pepDeclarations = [], // DDJJ PEP existentes
  onUploadDeclaration,
  onUpdateDeclaration,
  onApprove,
  onReject,
  isOfficialCumplimiento = false, // Si el usuario actual es Oficial de Cumplimiento
  readOnly = false,
}) => {
  const [expandedPerson, setExpandedPerson] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);

  // Agrupar personas por tipo
  const groupedPersons = {
    beneficiarios: persons.filter(p => p.type === 'beneficial_owner'),
    representantes: persons.filter(p => p.type === 'authority' || p.type === 'representative'),
    apoderados: persons.filter(p => p.type === 'attorney'),
    firmantes: persons.filter(p => p.type === 'signatory'),
  };

  // Obtener DDJJ PEP de una persona
  const getPersonDeclaration = (personId) => {
    return pepDeclarations.find(d => d.personId === personId);
  };

  // Calcular estadísticas
  const stats = {
    total: persons.length,
    completed: pepDeclarations.filter(d => d.status === 'completed' || d.status === 'approved').length,
    pending: pepDeclarations.filter(d => d.status === 'pending').length,
    pendingApproval: pepDeclarations.filter(d => d.isPep && d.status === 'pending_approval').length,
    rejected: pepDeclarations.filter(d => d.status === 'rejected').length,
    missing: persons.length - pepDeclarations.length,
  };

  // Estado de la persona
  const getPersonStatus = (person) => {
    const declaration = getPersonDeclaration(person.id);

    if (!declaration) {
      return { status: 'missing', label: 'Sin DDJJ', color: 'red' };
    }

    if (declaration.status === 'rejected') {
      return { status: 'rejected', label: 'Rechazada', color: 'red' };
    }

    if (declaration.isPep) {
      if (declaration.status === 'pending_approval') {
        return { status: 'pending_approval', label: 'Pendiente aprobación OC', color: 'amber' };
      }
      if (declaration.status === 'approved') {
        return { status: 'approved', label: 'PEP Aprobado', color: 'emerald' };
      }
      if (!declaration.additionalDocsComplete) {
        return { status: 'pending_docs', label: 'Faltan docs adicionales', color: 'amber' };
      }
    }

    if (declaration.status === 'completed' || declaration.status === 'approved') {
      return { status: 'completed', label: declaration.isPep ? 'PEP - Completo' : 'No PEP', color: 'emerald' };
    }

    return { status: 'pending', label: 'En proceso', color: 'blue' };
  };

  const renderStatusBadge = (status) => {
    const colors = {
      red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status.color]}`}>
        {status.label}
      </span>
    );
  };

  const renderPersonCard = (person, index) => {
    const status = getPersonStatus(person);
    const declaration = getPersonDeclaration(person.id);
    const isExpanded = expandedPerson === person.id;

    return (
      <div
        key={person.id || index}
        className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
      >
        {/* Header */}
        <div
          className={`p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
            declaration?.isPep ? 'bg-amber-50 dark:bg-amber-900/10' : ''
          }`}
          onClick={() => setExpandedPerson(isExpanded ? null : person.id)}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              status.color === 'emerald' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
              status.color === 'red' ? 'bg-red-100 dark:bg-red-900/30' :
              status.color === 'amber' ? 'bg-amber-100 dark:bg-amber-900/30' :
              'bg-gray-100 dark:bg-gray-700'
            }`}>
              {status.status === 'completed' || status.status === 'approved' ? (
                <CheckCircle2 className={`w-5 h-5 ${
                  declaration?.isPep ? 'text-amber-600' : 'text-emerald-600'
                }`} />
              ) : status.status === 'missing' || status.status === 'rejected' ? (
                <XCircle className="w-5 h-5 text-red-600" />
              ) : (
                <Clock className="w-5 h-5 text-amber-600" />
              )}
            </div>

            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {person.firstName} {person.lastName}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {person.dni && `DNI: ${person.dni}`}
                {person.role && ` • ${person.role}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {declaration?.isPep && (
              <span className="px-2 py-1 bg-amber-500 text-white text-xs font-bold rounded">
                PEP
              </span>
            )}
            {renderStatusBadge(status)}
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>

        {/* Expanded content */}
        {isExpanded && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50">
            {!declaration ? (
              // No declaration yet
              <div className="text-center py-4">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Esta persona no tiene DDJJ PEP cargada
                </p>
                {!readOnly && (
                  <button
                    onClick={() => {
                      setSelectedPerson(person);
                      setShowUploadModal(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
                  >
                    <Upload className="w-4 h-4" />
                    Cargar DDJJ PEP
                  </button>
                )}
              </div>
            ) : (
              // Declaration exists
              <div className="space-y-4">
                {/* Declaration info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Estado:</span>
                    <span className="ml-2 font-medium">{status.label}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">¿Es PEP?:</span>
                    <span className={`ml-2 font-bold ${declaration.isPep ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {declaration.isPep ? 'SÍ' : 'NO'}
                    </span>
                  </div>
                  {declaration.isPep && (
                    <>
                      <div className="col-span-2">
                        <span className="text-gray-500 dark:text-gray-400">Cargo/Función:</span>
                        <span className="ml-2">{declaration.pepPosition || '-'}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-500 dark:text-gray-400">Organismo:</span>
                        <span className="ml-2">{declaration.pepOrganization || '-'}</span>
                      </div>
                    </>
                  )}
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Fecha DDJJ:</span>
                    <span className="ml-2">
                      {declaration.declarationDate
                        ? new Date(declaration.declarationDate).toLocaleDateString('es-AR')
                        : '-'}
                    </span>
                  </div>
                </div>

                {/* PEP additional requirements */}
                {declaration.isPep && (
                  <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                    <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Requisitos adicionales PEP
                    </h4>

                    <div className="space-y-2">
                      {/* Approval status */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Aprobación Oficial de Cumplimiento
                        </span>
                        {declaration.status === 'approved' ? (
                          <span className="text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" /> Aprobado
                          </span>
                        ) : declaration.status === 'rejected' ? (
                          <span className="text-red-600 flex items-center gap-1">
                            <XCircle className="w-4 h-4" /> Rechazado
                          </span>
                        ) : (
                          <span className="text-amber-600 flex items-center gap-1">
                            <Clock className="w-4 h-4" /> Pendiente
                          </span>
                        )}
                      </div>

                      {/* Additional documents */}
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Documentación adicional requerida:
                        </p>
                        <ul className="space-y-1 text-sm">
                          {[
                            { id: 'ddjj_ingresos', label: 'DDJJ de Ingresos', uploaded: declaration.additionalDocs?.ddjj_ingresos },
                            { id: 'extractos_bancarios', label: 'Extractos Bancarios', uploaded: declaration.additionalDocs?.extractos_bancarios },
                            { id: 'ddjj_patrimonio', label: 'DDJJ Patrimonio / Balances', uploaded: declaration.additionalDocs?.ddjj_patrimonio },
                            { id: 'origen_fondos', label: 'Documentación Origen de Fondos', uploaded: declaration.additionalDocs?.origen_fondos },
                          ].map(doc => (
                            <li key={doc.id} className="flex items-center gap-2">
                              {doc.uploaded ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-400" />
                              )}
                              <span className={doc.uploaded ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500'}>
                                {doc.label}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Rejection reason */}
                      {declaration.status === 'rejected' && declaration.rejectionReason && (
                        <div className="mt-3 p-3 bg-red-100 dark:bg-red-900/30 rounded text-sm text-red-700 dark:text-red-300">
                          <strong>Motivo de rechazo:</strong> {declaration.rejectionReason}
                        </div>
                      )}
                    </div>

                    {/* Approval actions for Oficial de Cumplimiento */}
                    {isOfficialCumplimiento && declaration.status === 'pending_approval' && (
                      <div className="mt-4 flex gap-3">
                        <button
                          onClick={() => onApprove(declaration.id)}
                          className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                        >
                          Aprobar PEP
                        </button>
                        <button
                          onClick={() => onReject(declaration.id)}
                          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          Rechazar
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* View document button */}
                {declaration.documentUrl && (
                  <button className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    Ver DDJJ PEP
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderPersonGroup = (title, persons, icon) => {
    if (persons.length === 0) return null;

    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
          {icon}
          {title} ({persons.length})
        </h3>
        <div className="space-y-2">
          {persons.map((person, index) => renderPersonCard(person, index))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Declaraciones Juradas PEP
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Una por cada representante, apoderado, firmante y beneficiario final
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
          <p className="text-xs text-gray-500">Total personas</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-emerald-600">{stats.completed}</p>
          <p className="text-xs text-gray-500">Completadas</p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-amber-600">{stats.pendingApproval}</p>
          <p className="text-xs text-gray-500">PEP pendientes OC</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-red-600">{stats.missing}</p>
          <p className="text-xs text-gray-500">Sin DDJJ</p>
        </div>
      </div>

      {/* Alert if there are PEPs pending approval */}
      {stats.pendingApproval > 0 && (
        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-200">
                {stats.pendingApproval} persona(s) declarada(s) como PEP requieren aprobación
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                El Oficial de Cumplimiento debe aprobar antes de continuar con la operación.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Person lists */}
      {renderPersonGroup('Beneficiarios Finales', groupedPersons.beneficiarios, <User className="w-4 h-4" />)}
      {renderPersonGroup('Representantes Legales / Autoridades', groupedPersons.representantes, <User className="w-4 h-4" />)}
      {renderPersonGroup('Apoderados', groupedPersons.apoderados, <FileText className="w-4 h-4" />)}
      {renderPersonGroup('Firmantes', groupedPersons.firmantes, <User className="w-4 h-4" />)}

      {/* All complete message */}
      {stats.missing === 0 && stats.pendingApproval === 0 && stats.rejected === 0 && (
        <div className="mt-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            <div>
              <p className="font-medium text-emerald-800 dark:text-emerald-200">
                Todas las DDJJ PEP están completas y aprobadas
              </p>
              <p className="text-sm text-emerald-700 dark:text-emerald-300">
                Se puede continuar con el proceso.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PepDeclarationManager;
