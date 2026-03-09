import { useState, useRef } from 'react';
import {
  Paperclip,
  Plus,
  FileText,
  Image,
  Mail,
  FileSpreadsheet,
  StickyNote,
  ExternalLink,
  X,
  Upload,
  Download,
} from 'lucide-react';
import { useInvestigationCaseStore } from '../../context/investigationCaseStore';

const EVIDENCE_TYPES = [
  { value: 'documento', label: 'Documento', icon: FileText },
  { value: 'captura_pantalla', label: 'Captura de pantalla', icon: Image },
  { value: 'correo', label: 'Correo electrónico', icon: Mail },
  { value: 'nota_interna', label: 'Nota interna', icon: StickyNote },
  { value: 'reporte_externo', label: 'Reporte externo', icon: FileSpreadsheet },
];

const SOURCES = [
  { value: 'cliente', label: 'Cliente' },
  { value: 'interno', label: 'Interno' },
  { value: 'externo', label: 'Fuente externa' },
  { value: 'sistema', label: 'Sistema' },
];

const RELEVANCE = [
  { value: 'alta', label: 'Alta', color: 'bg-red-100 text-red-800' },
  { value: 'media', label: 'Media', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'baja', label: 'Baja', color: 'bg-gray-100 text-gray-800' },
];

export default function EvidenceList({ caseId, evidence = [], disabled }) {
  const { uploadEvidence } = useInvestigationCaseStore();
  const [showModal, setShowModal] = useState(false);
  const fileInputRef = useRef(null);

  const [newEvidence, setNewEvidence] = useState({
    evidenceType: '',
    title: '',
    description: '',
    source: 'interno',
    relevance: 'media',
    notes: '',
    file: null,
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewEvidence({ ...newEvidence, file });
    }
  };

  const handleUpload = async () => {
    if (!newEvidence.evidenceType || !newEvidence.title) {
      return;
    }

    const formData = new FormData();
    formData.append('evidenceType', newEvidence.evidenceType);
    formData.append('title', newEvidence.title);
    formData.append('description', newEvidence.description);
    formData.append('source', newEvidence.source);
    formData.append('relevance', newEvidence.relevance);
    formData.append('notes', newEvidence.notes);
    if (newEvidence.file) {
      formData.append('file', newEvidence.file);
    }

    await uploadEvidence(caseId, formData);

    setNewEvidence({
      evidenceType: '',
      title: '',
      description: '',
      source: 'interno',
      relevance: 'media',
      notes: '',
      file: null,
    });
    setShowModal(false);
  };

  const getEvidenceIcon = (type) => {
    const config = EVIDENCE_TYPES.find(t => t.value === type);
    return config?.icon || FileText;
  };

  return (
    <div className="border rounded-lg">
      <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
        <h4 className="font-medium text-gray-900 flex items-center gap-2">
          <Paperclip className="w-5 h-5" />
          Evidencia Adjunta
          {evidence.length > 0 && (
            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-sm">
              {evidence.length}
            </span>
          )}
        </h4>
        {!disabled && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            <Plus className="w-4 h-4" />
            Agregar Evidencia
          </button>
        )}
      </div>

      <div className="divide-y">
        {evidence.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No hay evidencia adjunta al caso.
          </div>
        ) : (
          evidence.map((item) => {
            const Icon = getEvidenceIcon(item.evidenceType);
            const relevanceConfig = RELEVANCE.find(r => r.value === item.relevance);

            return (
              <div key={item.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Icon className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">{item.title}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${relevanceConfig?.color}`}>
                        {relevanceConfig?.label}
                      </span>
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                        {SOURCES.find(s => s.value === item.source)?.label || item.source}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-sm text-gray-600">{item.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      {item.fileName && (
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {item.fileName}
                        </span>
                      )}
                      <span>
                        Subido: {new Date(item.uploadedAt).toLocaleDateString('es-AR')}
                      </span>
                    </div>
                    {item.notes && (
                      <p className="text-xs text-gray-500 mt-1 italic">
                        Nota: {item.notes}
                      </p>
                    )}
                  </div>
                  {item.fileUrl && (
                    <button
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="Descargar archivo"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Agregar Evidencia */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800">
              <h3 className="text-lg font-semibold text-foreground">Agregar Evidencia</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Evidencia *
                </label>
                <select
                  value={newEvidence.evidenceType}
                  onChange={(e) => setNewEvidence({ ...newEvidence, evidenceType: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccione...</option>
                  {EVIDENCE_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título *
                </label>
                <input
                  type="text"
                  value={newEvidence.title}
                  onChange={(e) => setNewEvidence({ ...newEvidence, title: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Título descriptivo de la evidencia..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={newEvidence.description}
                  onChange={(e) => setNewEvidence({ ...newEvidence, description: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Descripción detallada de la evidencia..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fuente
                  </label>
                  <select
                    value={newEvidence.source}
                    onChange={(e) => setNewEvidence({ ...newEvidence, source: e.target.value })}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {SOURCES.map((source) => (
                      <option key={source.value} value={source.value}>
                        {source.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Relevancia
                  </label>
                  <select
                    value={newEvidence.relevance}
                    onChange={(e) => setNewEvidence({ ...newEvidence, relevance: e.target.value })}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {RELEVANCE.map((rel) => (
                      <option key={rel.value} value={rel.value}>
                        {rel.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Archivo
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  {newEvidence.file ? (
                    <div className="flex items-center justify-center gap-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <span className="text-sm text-gray-700">{newEvidence.file.name}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setNewEvidence({ ...newEvidence, file: null });
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-8 h-8 text-gray-400" />
                      <span className="text-sm text-gray-500">
                        Haga clic para seleccionar un archivo
                      </span>
                      <span className="text-xs text-gray-400">
                        PDF, Word, Excel, o imágenes (máx. 10MB)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas adicionales
                </label>
                <textarea
                  value={newEvidence.notes}
                  onChange={(e) => setNewEvidence({ ...newEvidence, notes: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Notas internas sobre esta evidencia..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t bg-gray-50 sticky bottom-0">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpload}
                disabled={!newEvidence.evidenceType || !newEvidence.title}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Agregar Evidencia
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
