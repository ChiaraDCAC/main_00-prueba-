import { useState } from 'react';
import {
  UserCheck,
  FileText,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';

const STATUS_CONFIG = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  completed: { label: 'Completada', color: 'bg-blue-100 text-blue-800', icon: FileText },
  pending_approval: { label: 'Pendiente Aprobación', color: 'bg-orange-100 text-orange-800', icon: Clock },
  approved: { label: 'Aprobada', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  rejected: { label: 'Rechazada', color: 'bg-red-100 text-red-800', icon: AlertTriangle },
};

const PERSON_TYPE_LABELS = {
  beneficial_owner: 'Beneficiario Final',
  signatory: 'Firmante',
  attorney: 'Apoderado',
  authority: 'Autoridad',
  representative: 'Representante',
};

export default function PepDeclarationsList({ declarations = [], clientIsPep = false }) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Filtrar solo las declaraciones donde isPep es true
  const pepDeclarations = declarations.filter(d => d.isPep);
  const hasPepDeclarations = pepDeclarations.length > 0;

  if (!clientIsPep && !hasPepDeclarations) {
    return null;
  }

  return (
    <div className="border rounded-lg border-purple-200 bg-purple-50">
      <div
        className="p-4 cursor-pointer hover:bg-purple-100 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-200 rounded-lg">
              <UserCheck className="w-5 h-5 text-purple-700" />
            </div>
            <div>
              <h4 className="font-semibold text-purple-900">
                Declaraciones PEP del Cliente
              </h4>
              <p className="text-sm text-purple-700">
                {hasPepDeclarations
                  ? `${pepDeclarations.length} persona(s) declarada(s) como PEP`
                  : 'Cliente marcado como PEP - Verificar documentación'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {clientIsPep && (
              <span className="px-3 py-1 bg-purple-200 text-purple-800 rounded-full text-sm font-medium">
                Cliente PEP
              </span>
            )}
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-purple-700" />
            ) : (
              <ChevronDown className="w-5 h-5 text-purple-700" />
            )}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-purple-200 p-4">
          {!hasPepDeclarations ? (
            <div className="text-center py-4">
              <AlertTriangle className="w-10 h-10 mx-auto text-orange-500 mb-2" />
              <p className="text-gray-700 font-medium">
                No se encontraron declaraciones juradas PEP
              </p>
              <p className="text-sm text-gray-500 mt-1">
                El cliente está marcado como PEP pero no hay declaraciones cargadas.
                Solicite la documentación correspondiente.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pepDeclarations.map((declaration) => {
                const StatusIcon = STATUS_CONFIG[declaration.status]?.icon || Clock;
                const statusConfig = STATUS_CONFIG[declaration.status] || STATUS_CONFIG.pending;

                return (
                  <div
                    key={declaration.id}
                    className="bg-white rounded-lg border border-purple-200 p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-gray-900">
                            {declaration.personName || 'Persona no especificada'}
                          </span>
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                            {PERSON_TYPE_LABELS[declaration.personType] || declaration.personType}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs flex items-center gap-1 ${statusConfig.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusConfig.label}
                          </span>
                        </div>

                        {declaration.personDni && (
                          <p className="text-sm text-gray-500 mb-2">
                            DNI: {declaration.personDni}
                          </p>
                        )}

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          {declaration.pepPosition && (
                            <div>
                              <span className="text-gray-500">Cargo PEP:</span>
                              <p className="font-medium text-gray-900">{declaration.pepPosition}</p>
                            </div>
                          )}
                          {declaration.pepOrganization && (
                            <div>
                              <span className="text-gray-500">Organismo:</span>
                              <p className="font-medium text-gray-900">{declaration.pepOrganization}</p>
                            </div>
                          )}
                          {declaration.pepRelationship && (
                            <div>
                              <span className="text-gray-500">Relación PEP:</span>
                              <p className="font-medium text-gray-900">{declaration.pepRelationship}</p>
                            </div>
                          )}
                          {declaration.declarationDate && (
                            <div>
                              <span className="text-gray-500">Fecha declaración:</span>
                              <p className="font-medium text-gray-900">
                                {new Date(declaration.declarationDate).toLocaleDateString('es-AR')}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Documento adjunto */}
                        {declaration.documentUrl && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-purple-600" />
                              <span className="text-sm text-gray-700">
                                {declaration.fileName || 'Declaración Jurada PEP'}
                              </span>
                              <div className="flex gap-1 ml-auto">
                                <button
                                  className="p-1.5 text-purple-600 hover:bg-purple-100 rounded"
                                  title="Ver documento"
                                  onClick={() => window.open(declaration.documentUrl, '_blank')}
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <a
                                  href={declaration.documentUrl}
                                  download={declaration.fileName}
                                  className="p-1.5 text-purple-600 hover:bg-purple-100 rounded"
                                  title="Descargar documento"
                                >
                                  <Download className="w-4 h-4" />
                                </a>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Alerta si no hay documento */}
                        {!declaration.documentUrl && declaration.isPep && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <div className="flex items-center gap-2 text-orange-600">
                              <AlertTriangle className="w-4 h-4" />
                              <span className="text-sm font-medium">
                                Documento de DDJJ PEP no cargado
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Información adicional para investigación */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Nota para el analista:</strong> Verifique que todas las personas declaradas como PEP
              tengan su Declaración Jurada correctamente cargada y aprobada. En caso de inconsistencias,
              utilice las solicitudes de documentación para requerir la información faltante.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
