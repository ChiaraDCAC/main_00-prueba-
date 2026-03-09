import { useState, useEffect } from 'react';
import { X, Check, XCircle, Eye, FileText, AlertCircle, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import PDFViewer from './PDFViewer';
import { ENTITY_TYPE_LABELS, getRequiredDocuments } from '../config/documentRequirements';

const DocumentReviewModal = ({ client, onClose, onApprove, onReject }) => {
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [documentStatuses, setDocumentStatuses] = useState({});
  const [rejectComment, setRejectComment] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(null);
  const [expandedDoc, setExpandedDoc] = useState(null);

  // Get required documents based on entity type
  const entityType = client.entityType || 'sa';
  const requiredDocuments = getRequiredDocuments(entityType);

  // Simulated uploaded documents (in real app, this comes from backend)
  const uploadedDocs = client.documents || {};

  useEffect(() => {
    // Initialize document statuses from client data
    const initialStatuses = {};
    requiredDocuments.forEach(doc => {
      initialStatuses[doc.id] = client.documentStatuses?.[doc.id] || {
        status: 'pending', // pending, approved, rejected
        comment: '',
        reviewedAt: null,
        reviewedBy: null,
      };
    });
    setDocumentStatuses(initialStatuses);
  }, [client]);

  const handleApproveDoc = (docId) => {
    setDocumentStatuses(prev => ({
      ...prev,
      [docId]: {
        status: 'approved',
        comment: '',
        reviewedAt: new Date().toISOString(),
        reviewedBy: 'Admin',
      },
    }));
    setShowRejectInput(null);
  };

  const handleRejectDoc = (docId) => {
    if (!rejectComment.trim()) {
      alert('Debe ingresar un comentario para rechazar el documento');
      return;
    }
    setDocumentStatuses(prev => ({
      ...prev,
      [docId]: {
        status: 'rejected',
        comment: rejectComment,
        reviewedAt: new Date().toISOString(),
        reviewedBy: 'Admin',
      },
    }));
    setRejectComment('');
    setShowRejectInput(null);
  };

  const getRequiredDocsCount = () => {
    return requiredDocuments.filter(d => d.required).length;
  };

  const getApprovedRequiredCount = () => {
    return requiredDocuments.filter(d =>
      d.required && documentStatuses[d.id]?.status === 'approved'
    ).length;
  };

  const canApproveClient = () => {
    const requiredDocs = requiredDocuments.filter(d => d.required);
    return requiredDocs.every(d => documentStatuses[d.id]?.status === 'approved');
  };

  const hasRejectedDocs = () => {
    return Object.values(documentStatuses).some(s => s.status === 'rejected');
  };

  const handleApproveClient = () => {
    if (canApproveClient()) {
      onApprove(client.id, documentStatuses);
    }
  };

  const handleRejectClient = () => {
    if (hasRejectedDocs()) {
      const rejectedDocs = requiredDocuments
        .filter(d => documentStatuses[d.id]?.status === 'rejected')
        .map(d => ({
          name: d.name,
          comment: documentStatuses[d.id].comment,
        }));
      onReject(client.id, rejectedDocs);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="badge badge-success">Aprobado</span>;
      case 'rejected':
        return <span className="badge badge-danger">Rechazado</span>;
      default:
        return <span className="badge badge-warning">Pendiente</span>;
    }
  };

  const getStatusIcon = (docId) => {
    const status = documentStatuses[docId]?.status;
    switch (status) {
      case 'approved':
        return <Check className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">Revisión de Documentación</h2>
            <p className="text-gray-500 dark:text-slate-400 mt-1">
              {client.legalName || `${client.firstName} ${client.lastName}`}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={24} />
          </button>
        </div>

        {/* Client Info Bar */}
        <div className="px-6 py-4 bg-gray-50 border-b grid grid-cols-4 gap-4">
          <div>
            <span className="text-xs text-gray-500 uppercase">CUIT</span>
            <p className="font-mono font-medium">{client.cuit}</p>
          </div>
          <div>
            <span className="text-xs text-gray-500 uppercase">Tipo de Entidad</span>
            <p className="font-medium">{ENTITY_TYPE_LABELS[entityType] || entityType}</p>
          </div>
          <div>
            <span className="text-xs text-gray-500 uppercase">Fecha de Carga</span>
            <p className="font-medium">{new Date(client.createdAt).toLocaleDateString('es-AR')}</p>
          </div>
          <div>
            <span className="text-xs text-gray-500 uppercase">Progreso</span>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all"
                  style={{ width: `${(getApprovedRequiredCount() / getRequiredDocsCount()) * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium">
                {getApprovedRequiredCount()}/{getRequiredDocsCount()}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Documents List */}
          <div className="w-1/2 border-r overflow-y-auto">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                Documentos Obligatorios
              </h3>
              <div className="space-y-2">
                {requiredDocuments.filter(d => d.required).map(doc => {
                  const hasFile = uploadedDocs[doc.id];
                  const status = documentStatuses[doc.id]?.status || 'pending';
                  const isExpanded = expandedDoc === doc.id;

                  return (
                    <div key={doc.id} className="border rounded-lg overflow-hidden">
                      <div
                        className={`p-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50 ${
                          selectedDoc?.id === doc.id ? 'bg-primary-50 border-l-4 border-l-primary-500' : ''
                        }`}
                        onClick={() => hasFile && setSelectedDoc(doc)}
                      >
                        {getStatusIcon(doc.id)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm truncate">{doc.name}</span>
                            {!hasFile && (
                              <span className="text-xs text-red-500">(No cargado)</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 truncate">{doc.description}</p>
                        </div>
                        {getStatusBadge(status)}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedDoc(isExpanded ? null : doc.id);
                          }}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>

                      {/* Expanded Actions */}
                      {isExpanded && (
                        <div className="p-3 bg-gray-50 border-t space-y-3">
                          {hasFile && status === 'pending' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApproveDoc(doc.id)}
                                className="btn btn-success flex-1 text-sm py-2"
                              >
                                <Check size={16} className="mr-1" />
                                Aprobar
                              </button>
                              <button
                                onClick={() => setShowRejectInput(doc.id)}
                                className="btn btn-danger flex-1 text-sm py-2"
                              >
                                <XCircle size={16} className="mr-1" />
                                Rechazar
                              </button>
                            </div>
                          )}

                          {showRejectInput === doc.id && (
                            <div className="space-y-2">
                              <textarea
                                placeholder="Motivo del rechazo (obligatorio)"
                                className="input text-sm"
                                rows={2}
                                value={rejectComment}
                                onChange={(e) => setRejectComment(e.target.value)}
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleRejectDoc(doc.id)}
                                  className="btn btn-danger text-sm py-1 flex-1"
                                >
                                  Confirmar Rechazo
                                </button>
                                <button
                                  onClick={() => {
                                    setShowRejectInput(null);
                                    setRejectComment('');
                                  }}
                                  className="btn btn-secondary text-sm py-1"
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          )}

                          {status === 'rejected' && documentStatuses[doc.id]?.comment && (
                            <div className="flex items-start gap-2 text-red-600 bg-red-50 p-2 rounded">
                              <MessageSquare size={16} className="mt-0.5 flex-shrink-0" />
                              <p className="text-sm">{documentStatuses[doc.id].comment}</p>
                            </div>
                          )}

                          {status === 'approved' && (
                            <div className="flex items-center gap-2 text-green-600 bg-green-50 p-2 rounded">
                              <Check size={16} />
                              <p className="text-sm">
                                Aprobado por {documentStatuses[doc.id].reviewedBy} el{' '}
                                {new Date(documentStatuses[doc.id].reviewedAt).toLocaleDateString('es-AR')}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Optional Documents */}
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 mt-6">
                Documentos Opcionales
              </h3>
              <div className="space-y-2">
                {requiredDocuments.filter(d => !d.required).map(doc => {
                  const hasFile = uploadedDocs[doc.id];
                  const status = documentStatuses[doc.id]?.status || 'pending';

                  return (
                    <div
                      key={doc.id}
                      className={`p-3 border rounded-lg flex items-center gap-3 cursor-pointer hover:bg-gray-50 ${
                        selectedDoc?.id === doc.id ? 'bg-primary-50 border-primary-500' : ''
                      }`}
                      onClick={() => hasFile && setSelectedDoc(doc)}
                    >
                      {hasFile ? getStatusIcon(doc.id) : (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-sm">{doc.name}</span>
                        <span className="text-xs text-gray-400 ml-2">(opcional)</span>
                      </div>
                      {hasFile && getStatusBadge(status)}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Document Viewer */}
          <div className="w-1/2 bg-gray-100 p-4">
            {selectedDoc ? (
              <div className="h-full flex flex-col">
                <div className="mb-4">
                  <h3 className="font-semibold">{selectedDoc.name}</h3>
                  <p className="text-sm text-gray-500">{selectedDoc.description}</p>
                </div>
                <div className="flex-1">
                  <PDFViewer
                    file={uploadedDocs[selectedDoc.id]?.dataUrl}
                    fileName={uploadedDocs[selectedDoc.id]?.name}
                  />
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>Seleccione un documento para visualizar</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {canApproveClient() ? (
              <span className="text-green-600 flex items-center gap-2">
                <Check size={18} />
                Todos los documentos obligatorios están aprobados
              </span>
            ) : hasRejectedDocs() ? (
              <span className="text-red-600 flex items-center gap-2">
                <XCircle size={18} />
                Hay documentos rechazados
              </span>
            ) : (
              <span className="text-yellow-600 flex items-center gap-2">
                <AlertCircle size={18} />
                Revise todos los documentos obligatorios
              </span>
            )}
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} className="btn btn-secondary">
              Cerrar
            </button>
            {hasRejectedDocs() && (
              <button
                onClick={handleRejectClient}
                className="btn btn-danger"
              >
                Rechazar Cliente
              </button>
            )}
            <button
              onClick={handleApproveClient}
              disabled={!canApproveClient()}
              className={`btn ${canApproveClient() ? 'btn-primary' : 'btn-secondary opacity-50 cursor-not-allowed'}`}
            >
              Aprobar Documentación
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentReviewModal;
