import { useState } from 'react';
import {
  Scale,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Shield,
  AlertOctagon,
} from 'lucide-react';
import { useInvestigationCaseStore } from '../../context/investigationCaseStore';

export default function FinalDecisionCard({ caseId, riskIndicators = [], mitigatingFactors = [] }) {
  const { closeAsJustified, escalateAsSuspicious, loading } = useInvestigationCaseStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [decision, setDecision] = useState(null); // 'justified' | 'suspicious'
  const [justification, setJustification] = useState('');
  const [suspicionDescription, setSuspicionDescription] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleDecision = async () => {
    if (decision === 'justified') {
      await closeAsJustified(caseId, {
        decisionJustification: justification,
        mitigatingFactors,
      });
    } else if (decision === 'suspicious') {
      await escalateAsSuspicious(caseId, {
        decisionJustification: justification,
        suspicionDescription,
        riskIndicators,
      });
    }
    setShowConfirmation(false);
  };

  const canMakeDecision = justification.length >= 50;

  return (
    <div className="border rounded-lg border-gray-300">
      <div
        className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 cursor-pointer hover:from-gray-100 hover:to-gray-150 rounded-t-lg"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Scale className="w-6 h-6 text-gray-700" />
            <div>
              <h4 className="font-semibold text-gray-900">Tomar Decisión Final</h4>
              <p className="text-sm text-gray-500">
                Evalúe la evidencia y cierre el caso o escale como sospechoso
              </p>
            </div>
          </div>
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-6">
          {/* Resumen de indicadores */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-red-50 rounded-lg p-4">
              <h5 className="font-medium text-red-800 flex items-center gap-2 mb-2">
                <AlertOctagon className="w-4 h-4" />
                Indicadores de Riesgo ({riskIndicators.length})
              </h5>
              {riskIndicators.length > 0 ? (
                <ul className="text-sm text-red-700 space-y-1">
                  {riskIndicators.map((indicator, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                      {indicator}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-red-600 italic">No se registraron indicadores de riesgo</p>
              )}
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <h5 className="font-medium text-green-800 flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4" />
                Factores Atenuantes ({mitigatingFactors.length})
              </h5>
              {mitigatingFactors.length > 0 ? (
                <ul className="text-sm text-green-700 space-y-1">
                  {mitigatingFactors.map((factor, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                      {factor}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-green-600 italic">No se registraron factores atenuantes</p>
              )}
            </div>
          </div>

          {/* Selección de decisión */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Seleccione su decisión:
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setDecision('justified')}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  decision === 'justified'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle2 className={`w-6 h-6 ${decision === 'justified' ? 'text-green-600' : 'text-gray-400'}`} />
                  <span className="font-semibold text-gray-900">Cerrar como Justificado</span>
                </div>
                <p className="text-sm text-gray-600">
                  La operación fue analizada y se encontró justificación razonable.
                  No requiere reporte a la UIF.
                </p>
              </button>

              <button
                onClick={() => setDecision('suspicious')}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  decision === 'suspicious'
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-red-300 hover:bg-red-50'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <AlertTriangle className={`w-6 h-6 ${decision === 'suspicious' ? 'text-red-600' : 'text-gray-400'}`} />
                  <span className="font-semibold text-gray-900">Escalar como Sospechoso</span>
                </div>
                <p className="text-sm text-gray-600">
                  La operación presenta indicios de actividad sospechosa.
                  Se generará un ROS para reporte a la UIF.
                </p>
              </button>
            </div>
          </div>

          {/* Formulario según decisión */}
          {decision && (
            <div className="space-y-4 pt-4 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Justificación de la decisión * <span className="text-gray-400">(mínimo 50 caracteres)</span>
                </label>
                <textarea
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder={
                    decision === 'justified'
                      ? 'Explique por qué la operación se considera justificada. Incluya la documentación analizada y los factores considerados...'
                      : 'Explique por qué la operación se considera sospechosa. Detalle los indicadores de riesgo identificados...'
                  }
                />
                <div className="text-xs text-gray-500 mt-1 text-right">
                  {justification.length} / 50 caracteres mínimos
                </div>
              </div>

              {decision === 'suspicious' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción de la sospecha para el ROS *
                  </label>
                  <textarea
                    value={suspicionDescription}
                    onChange={(e) => setSuspicionDescription(e.target.value)}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Describa la naturaleza de la sospecha para incluir en el Reporte de Operación Sospechosa..."
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => {
                    setDecision(null);
                    setJustification('');
                    setSuspicionDescription('');
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => setShowConfirmation(true)}
                  disabled={!canMakeDecision || (decision === 'suspicious' && !suspicionDescription)}
                  className={`px-6 py-2 rounded-lg font-medium flex items-center gap-2 ${
                    decision === 'justified'
                      ? 'bg-green-600 hover:bg-green-700 text-white disabled:bg-green-300'
                      : 'bg-red-600 hover:bg-red-700 text-white disabled:bg-red-300'
                  } disabled:cursor-not-allowed`}
                >
                  {decision === 'justified' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Cerrar Caso
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4" />
                      Escalar y Generar ROS
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal de confirmación */}
      {showConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className={`p-4 rounded-t-lg ${decision === 'justified' ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="flex items-center gap-3">
                {decision === 'justified' ? (
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                ) : (
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                )}
                <h3 className="text-lg font-semibold">
                  {decision === 'justified' ? 'Confirmar cierre del caso' : 'Confirmar escalamiento'}
                </h3>
              </div>
            </div>
            <div className="p-4">
              {decision === 'justified' ? (
                <p className="text-gray-700">
                  Esta acción cerrará el caso como <strong>justificado</strong> y marcará la alerta como resuelta.
                  Esta acción no se puede deshacer.
                </p>
              ) : (
                <div className="space-y-3">
                  <p className="text-gray-700">
                    Esta acción escalará el caso como <strong>sospechoso</strong> y generará automáticamente
                    un <strong>Reporte de Operación Sospechosa (ROS)</strong>.
                  </p>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      <strong>Importante:</strong> El ROS deberá ser revisado y enviado a la UIF en los plazos establecidos.
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 p-4 border-t bg-gray-50 rounded-b-lg">
              <button
                onClick={() => setShowConfirmation(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                onClick={handleDecision}
                disabled={loading}
                className={`px-6 py-2 rounded-lg font-medium ${
                  decision === 'justified'
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                } disabled:opacity-50`}
              >
                {loading ? 'Procesando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
