import { useState, useEffect } from 'react';
import {
  FileSearch,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  User,
  Building2,
  Calendar,
  FileText,
  ChevronDown,
  ChevronUp,
  Edit3,
  Save,
} from 'lucide-react';
import { useInvestigationCaseStore } from '../../context/investigationCaseStore';
import DocumentRequestList from './DocumentRequestList';
import EvidenceList from './EvidenceList';
import FinalDecisionCard from './FinalDecisionCard';
import PepDeclarationsList from './PepDeclarationsList';

const STATUS_CONFIG = {
  abierto: { label: 'Abierto', color: 'bg-blue-100 text-blue-800', icon: FileSearch },
  en_investigacion: { label: 'En Investigación', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  pendiente_documentacion: { label: 'Pendiente Documentación', color: 'bg-orange-100 text-orange-800', icon: FileText },
  cerrado_justificado: { label: 'Cerrado - Justificado', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  escalado_sospechoso: { label: 'Escalado - Sospechoso', color: 'bg-red-100 text-red-800', icon: AlertTriangle },
};

const PRIORITY_CONFIG = {
  baja: { label: 'Baja', color: 'bg-gray-100 text-gray-800' },
  media: { label: 'Media', color: 'bg-blue-100 text-blue-800' },
  alta: { label: 'Alta', color: 'bg-orange-100 text-orange-800' },
  critica: { label: 'Crítica', color: 'bg-red-100 text-red-800' },
};

export default function InvestigationCaseSection({ caseId, alertId, unusualOperationId, onCaseCreated }) {
  const {
    currentCase,
    loading,
    fetchCaseById,
    createFromAlert,
    createFromUnusualOperation,
    updateCase,
    clearCurrentCase,
  } = useInvestigationCaseStore();

  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [analysisNotes, setAnalysisNotes] = useState('');
  const [riskIndicators, setRiskIndicators] = useState([]);
  const [mitigatingFactors, setMitigatingFactors] = useState([]);
  const [newIndicator, setNewIndicator] = useState('');
  const [newFactor, setNewFactor] = useState('');

  useEffect(() => {
    if (caseId) {
      fetchCaseById(caseId);
    }
    return () => clearCurrentCase();
  }, [caseId]);

  useEffect(() => {
    if (currentCase) {
      setAnalysisNotes(currentCase.analysisNotes || '');
      setRiskIndicators(currentCase.riskIndicators || []);
      setMitigatingFactors(currentCase.mitigatingFactors || []);
    }
  }, [currentCase]);

  const handleCreateCase = async () => {
    let result;
    if (alertId) {
      result = await createFromAlert(alertId);
    } else if (unusualOperationId) {
      result = await createFromUnusualOperation(unusualOperationId);
    }
    if (result?.success && onCaseCreated) {
      onCaseCreated(result.data);
    }
  };

  const handleSaveAnalysis = async () => {
    if (currentCase) {
      await updateCase(currentCase.id, {
        analysisNotes,
        riskIndicators,
        mitigatingFactors,
        status: 'en_investigacion',
      });
      setIsEditing(false);
    }
  };

  const addRiskIndicator = () => {
    if (newIndicator.trim()) {
      setRiskIndicators([...riskIndicators, newIndicator.trim()]);
      setNewIndicator('');
    }
  };

  const removeRiskIndicator = (index) => {
    setRiskIndicators(riskIndicators.filter((_, i) => i !== index));
  };

  const addMitigatingFactor = () => {
    if (newFactor.trim()) {
      setMitigatingFactors([...mitigatingFactors, newFactor.trim()]);
      setNewFactor('');
    }
  };

  const removeMitigatingFactor = (index) => {
    setMitigatingFactors(mitigatingFactors.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!currentCase && !caseId && (alertId || unusualOperationId)) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <div className="text-center py-8">
          <FileSearch className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay caso de investigación
          </h3>
          <p className="text-gray-500 mb-4">
            Inicie un caso de investigación para analizar esta alerta en detalle.
          </p>
          <button
            onClick={handleCreateCase}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Iniciar Caso de Investigación
          </button>
        </div>
      </div>
    );
  }

  if (!currentCase) {
    return null;
  }

  const StatusIcon = STATUS_CONFIG[currentCase.status]?.icon || FileSearch;
  const isClosed = currentCase.status === 'cerrado_justificado' || currentCase.status === 'escalado_sospechoso';

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow">
      {/* Header */}
      <div
        className="p-4 border-b border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <StatusIcon className="w-6 h-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Caso de Investigación
              </h3>
              <p className="text-sm text-gray-500">{currentCase.caseNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_CONFIG[currentCase.status]?.color}`}>
              {STATUS_CONFIG[currentCase.status]?.label}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${PRIORITY_CONFIG[currentCase.priority]?.color}`}>
              {PRIORITY_CONFIG[currentCase.priority]?.label}
            </span>
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="p-6 space-y-6">
          {/* Info General */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Información del Caso
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Título:</span>
                  <span className="font-medium">{currentCase.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Fecha apertura:</span>
                  <span>{new Date(currentCase.openedAt).toLocaleDateString('es-AR')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Fecha límite:</span>
                  <span className={currentCase.dueDate && new Date(currentCase.dueDate) < new Date() ? 'text-red-600 font-medium' : ''}>
                    {currentCase.dueDate ? new Date(currentCase.dueDate).toLocaleDateString('es-AR') : 'No definida'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Última actividad:</span>
                  <span>{new Date(currentCase.lastActivityAt).toLocaleDateString('es-AR')}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                {currentCase.Client?.legalName ? <Building2 className="w-4 h-4" /> : <User className="w-4 h-4" />}
                Cliente Investigado
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Nombre:</span>
                  <span className="font-medium">
                    {currentCase.Client?.legalName || `${currentCase.Client?.firstName} ${currentCase.Client?.lastName}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">CUIT:</span>
                  <span>{currentCase.Client?.cuit}</span>
                </div>
                {currentCase.Alert && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Alerta origen:</span>
                    <span className="text-blue-600">{currentCase.Alert.title}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Descripción */}
          {currentCase.description && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Descripción</h4>
              <p className="text-sm text-gray-700">{currentCase.description}</p>
            </div>
          )}

          {/* Declaraciones PEP del cliente */}
          {(currentCase.Client?.isPep || currentCase.Client?.pepDeclarations?.length > 0) && (
            <PepDeclarationsList
              declarations={currentCase.Client?.pepDeclarations || []}
              clientIsPep={currentCase.Client?.isPep}
            />
          )}

          {/* Análisis */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-900">Notas de Análisis</h4>
              {!isClosed && (
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
                >
                  <Edit3 className="w-4 h-4" />
                  {isEditing ? 'Cancelar' : 'Editar'}
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <textarea
                  value={analysisNotes}
                  onChange={(e) => setAnalysisNotes(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                  placeholder="Escriba sus notas de análisis aquí..."
                />

                {/* Indicadores de riesgo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Indicadores de Riesgo
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {riskIndicators.map((indicator, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm flex items-center gap-1"
                      >
                        {indicator}
                        <button onClick={() => removeRiskIndicator(index)} className="hover:text-red-900">
                          <XCircle className="w-4 h-4" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newIndicator}
                      onChange={(e) => setNewIndicator(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addRiskIndicator()}
                      className="flex-1 px-3 py-2 border rounded-lg text-sm"
                      placeholder="Agregar indicador de riesgo..."
                    />
                    <button
                      onClick={addRiskIndicator}
                      className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                    >
                      Agregar
                    </button>
                  </div>
                </div>

                {/* Factores atenuantes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Factores Atenuantes
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {mitigatingFactors.map((factor, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm flex items-center gap-1"
                      >
                        {factor}
                        <button onClick={() => removeMitigatingFactor(index)} className="hover:text-green-900">
                          <XCircle className="w-4 h-4" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newFactor}
                      onChange={(e) => setNewFactor(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addMitigatingFactor()}
                      className="flex-1 px-3 py-2 border rounded-lg text-sm"
                      placeholder="Agregar factor atenuante..."
                    />
                    <button
                      onClick={addMitigatingFactor}
                      className="px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                    >
                      Agregar
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleSaveAnalysis}
                  className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Guardar Análisis
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {currentCase.analysisNotes || 'Sin notas de análisis registradas.'}
                </p>

                {currentCase.riskIndicators?.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Indicadores de riesgo:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {currentCase.riskIndicators.map((indicator, index) => (
                        <span key={index} className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                          {indicator}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {currentCase.mitigatingFactors?.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Factores atenuantes:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {currentCase.mitigatingFactors.map((factor, index) => (
                        <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                          {factor}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Solicitudes de documentación */}
          <DocumentRequestList
            caseId={currentCase.id}
            requests={currentCase.documentRequests || []}
            disabled={isClosed}
          />

          {/* Evidencia */}
          <EvidenceList
            caseId={currentCase.id}
            evidence={currentCase.evidence || []}
            disabled={isClosed}
          />

          {/* Decisión final */}
          {!isClosed && (
            <FinalDecisionCard
              caseId={currentCase.id}
              riskIndicators={currentCase.riskIndicators || []}
              mitigatingFactors={currentCase.mitigatingFactors || []}
            />
          )}

          {/* Resultado final (si está cerrado) */}
          {isClosed && (
            <div className={`rounded-lg p-4 ${currentCase.finalDecision === 'justified' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <h4 className={`font-medium mb-2 ${currentCase.finalDecision === 'justified' ? 'text-green-800' : 'text-red-800'}`}>
                {currentCase.finalDecision === 'justified' ? (
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" /> Caso Cerrado - Justificado
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" /> Caso Escalado - Sospechoso
                  </span>
                )}
              </h4>
              <p className="text-sm text-gray-700 mt-2">
                <strong>Justificación:</strong> {currentCase.decisionJustification}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Decisión tomada el {new Date(currentCase.decisionDate).toLocaleDateString('es-AR')}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
