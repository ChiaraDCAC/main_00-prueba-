import { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Clock,
  FileText,
  Users,
  PenTool,
  AlertCircle,
  Eye,
  Download,
  RefreshCw,
} from 'lucide-react';

/**
 * ContractStatus - Muestra el estado del contrato y progreso de firmas
 *
 * Estados posibles:
 * - documentation_accepted: Documentación aceptada, contrato en preparación
 * - contract_pending: Contrato subido, esperando firmas
 * - contract_partial: Algunas firmas completadas
 * - contract_completed: Todas las firmas realizadas
 */

const ContractStatus = ({
  client,
  contract,
  currentUserId,
  onRefresh,
  canViewContract = false, // Si el usuario puede ver el contrato (firmantes)
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Calcular estado del contrato
  const getContractState = () => {
    if (!contract) {
      return 'documentation_accepted';
    }

    if (!contract.signatures || contract.signatures.length === 0) {
      return 'contract_pending';
    }

    const totalSignatures = contract.signatures.length;
    const completedSignatures = contract.signatures.filter(s => s.signedAt).length;

    if (completedSignatures === 0) {
      return 'contract_pending';
    } else if (completedSignatures < totalSignatures) {
      return 'contract_partial';
    } else {
      return 'contract_completed';
    }
  };

  const contractState = getContractState();

  // Verificar si el usuario actual es firmante
  const isCurrentUserSigner = contract?.signatures?.some(
    s => s.userId === currentUserId || s.signerId === currentUserId
  );

  // Contar firmas
  const totalSignatures = contract?.signatures?.length || 0;
  const completedSignatures = contract?.signatures?.filter(s => s.signedAt).length || 0;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (onRefresh) {
      await onRefresh();
    }
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Renderizar estado: Documentación aceptada, sin contrato
  if (contractState === 'documentation_accepted') {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col items-center text-center py-8">
          {/* Icono principal */}
          <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
          </div>

          {/* Título */}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            La documentación ha sido aceptada
          </h2>

          {/* Estado del contrato */}
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-4 py-2 rounded-lg mb-4">
            <Clock className="w-5 h-5" />
            <span className="font-medium">Se está preparando el contrato</span>
          </div>

          {/* Mensaje informativo */}
          <p className="text-gray-600 dark:text-gray-400 max-w-md">
            Se informará a los firmantes cuando el contrato esté listo para firmar.
          </p>

          {/* Timeline visual */}
          <div className="mt-8 w-full max-w-sm">
            <div className="flex items-center justify-between">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs mt-2 text-gray-600 dark:text-gray-400">Documentación</span>
                <span className="text-xs text-emerald-600 font-medium">Aprobada</span>
              </div>

              <div className="flex-1 h-1 bg-amber-200 dark:bg-amber-800 mx-2 relative">
                <div className="absolute inset-0 bg-amber-400 animate-pulse" style={{ width: '50%' }} />
              </div>

              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="text-xs mt-2 text-gray-600 dark:text-gray-400">Contrato</span>
                <span className="text-xs text-amber-600 font-medium">En preparación</span>
              </div>

              <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 mx-2" />

              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <PenTool className="w-5 h-5 text-gray-400" />
                </div>
                <span className="text-xs mt-2 text-gray-400">Firmas</span>
                <span className="text-xs text-gray-400">Pendiente</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Renderizar estado: Contrato subido, en proceso de firma
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            contractState === 'contract_completed'
              ? 'bg-emerald-100 dark:bg-emerald-900/30'
              : 'bg-blue-100 dark:bg-blue-900/30'
          }`}>
            {contractState === 'contract_completed' ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {contractState === 'contract_completed'
                ? 'Contrato firmado'
                : 'Contrato en proceso de firma'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {client?.legalName || client?.denominacion || 'Cliente'}
            </p>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          disabled={isRefreshing}
        >
          <RefreshCw className={`w-5 h-5 text-gray-500 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Progress indicator */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Progreso de firmas
          </span>
          <span className={`text-sm font-bold ${
            contractState === 'contract_completed'
              ? 'text-emerald-600'
              : 'text-blue-600'
          }`}>
            {completedSignatures} de {totalSignatures} firmas completadas
          </span>
        </div>

        <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              contractState === 'contract_completed'
                ? 'bg-emerald-500'
                : 'bg-blue-500'
            }`}
            style={{ width: `${totalSignatures > 0 ? (completedSignatures / totalSignatures) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Mensaje según estado */}
      {contractState !== 'contract_completed' && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-blue-800 dark:text-blue-200 font-medium">
                El contrato está en proceso de firma
              </p>
              <p className="text-blue-600 dark:text-blue-300 text-sm mt-1">
                Te avisaremos cuando estén todas las firmas realizadas.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Lista de firmantes */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <Users className="w-4 h-4" />
          Firmantes ({completedSignatures}/{totalSignatures})
        </h3>

        <div className="space-y-2">
          {contract?.signatures?.map((signature, index) => (
            <div
              key={signature.id || index}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                signature.signedAt
                  ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800'
                  : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  signature.signedAt
                    ? 'bg-emerald-500'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}>
                  {signature.signedAt ? (
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  ) : (
                    <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {signature.signerName || `Firmante ${index + 1}`}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {signature.signerRole || signature.signerEmail || 'Socio/Representante'}
                  </p>
                </div>
              </div>

              <div className="text-right">
                {signature.signedAt ? (
                  <div>
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      Firmado
                    </span>
                    <p className="text-xs text-gray-500">
                      {new Date(signature.signedAt).toLocaleDateString('es-AR')}
                    </p>
                  </div>
                ) : (
                  <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                    Pendiente
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Acciones según rol */}
      {(isCurrentUserSigner || canViewContract) && contract?.documentUrl && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-3">
            {canViewContract && (
              <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors">
                <Eye className="w-4 h-4" />
                Ver contrato
              </button>
            )}

            {isCurrentUserSigner && !contract.signatures.find(s =>
              (s.userId === currentUserId || s.signerId === currentUserId) && s.signedAt
            ) && contractState !== 'contract_completed' && (
              <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                <PenTool className="w-4 h-4" />
                Firmar contrato
              </button>
            )}

            {contractState === 'contract_completed' && (
              <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors">
                <Download className="w-4 h-4" />
                Descargar contrato firmado
              </button>
            )}
          </div>
        </div>
      )}

      {/* Mensaje para no firmantes */}
      {!isCurrentUserSigner && !canViewContract && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            Podrás ver el contrato una vez que todas las firmas estén completadas.
          </p>
        </div>
      )}
    </div>
  );
};

export default ContractStatus;
