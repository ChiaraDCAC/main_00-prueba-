import { useState, useEffect } from 'react';
import {
  X,
  Check,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  FileText,
  Image,
  File,
  AlertCircle,
  CheckCircle,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { getRequiredDocuments, ENTITY_TYPE_LABELS } from '../config/documentRequirements';

const DocumentViewerModal = ({ client, onClose, onApproveAll, onReject }) => {
  const [currentDocIndex, setCurrentDocIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [documentStatuses, setDocumentStatuses] = useState(() => {
    const initial = {};
    const docs = getRequiredDocuments(client.entityType || 'persona_humana');
    docs.forEach(doc => {
      initial[doc.id] = {
        status: client.documentStatuses?.[doc.id]?.status || 'pending',
        comment: client.documentStatuses?.[doc.id]?.comment || '',
      };
    });
    return initial;
  });
  const [rejectComment, setRejectComment] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  const documents = getRequiredDocuments(client.entityType || 'persona_humana');
  const uploadedDocs = client.documents || {};
  const currentDoc = documents[currentDocIndex];
  const currentFile = uploadedDocs[currentDoc?.id];

  // Reset page when document changes
  useEffect(() => {
    setCurrentPage(1);
    // Simulated total pages - in real implementation, get from PDF
    if (currentFile?.name?.match(/\.pdf$/i)) {
      setTotalPages(currentFile.pages || 3); // Simulated
    } else {
      setTotalPages(1);
    }
  }, [currentDocIndex, currentFile]);

  const handlePrevDoc = () => {
    setCurrentDocIndex(prev => Math.max(0, prev - 1));
    setZoom(100);
    setRotation(0);
    setShowRejectInput(false);
    setRejectComment('');
  };

  const handleNextDoc = () => {
    setCurrentDocIndex(prev => Math.min(documents.length - 1, prev + 1));
    setZoom(100);
    setRotation(0);
    setShowRejectInput(false);
    setRejectComment('');
  };

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  const handleApproveDoc = () => {
    setDocumentStatuses(prev => ({
      ...prev,
      [currentDoc.id]: { status: 'approved', comment: '' },
    }));
    toast.success(`${currentDoc.name} aprobado`);

    // Auto-advance to next pending doc
    const nextPendingIndex = documents.findIndex(
      (doc, idx) => idx > currentDocIndex && documentStatuses[doc.id]?.status === 'pending'
    );
    if (nextPendingIndex !== -1) {
      setCurrentDocIndex(nextPendingIndex);
    }
  };

  const handleRejectDoc = () => {
    if (!rejectComment.trim()) {
      toast.error('Debe ingresar un motivo de rechazo');
      return;
    }
    setDocumentStatuses(prev => ({
      ...prev,
      [currentDoc.id]: { status: 'rejected', comment: rejectComment },
    }));
    toast.info(`${currentDoc.name} rechazado`);
    setRejectComment('');
    setShowRejectInput(false);
  };

  // Stats
  const requiredDocs = documents.filter(d => d.required);
  const approvedCount = requiredDocs.filter(d => documentStatuses[d.id]?.status === 'approved').length;
  const rejectedCount = documents.filter(d => documentStatuses[d.id]?.status === 'rejected').length;
  const allRequiredApproved = requiredDocs.every(d => documentStatuses[d.id]?.status === 'approved');

  const handleApproveClient = () => {
    if (allRequiredApproved) {
      onApproveAll(client.id, documentStatuses);
    }
  };

  const handleRejectClient = () => {
    const rejectedDocs = documents
      .filter(d => documentStatuses[d.id]?.status === 'rejected')
      .map(d => ({
        name: d.name,
        comment: documentStatuses[d.id]?.comment,
      }));
    onReject(client.id, rejectedDocs);
  };

  const getDocIcon = (doc) => {
    const file = uploadedDocs[doc.id];
    if (!file) return <File className="w-4 h-4" />;
    if (file.name?.match(/\.(jpg|jpeg|png|gif|webp)$/i)) return <Image className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  const getStatusColor = (docId) => {
    const status = documentStatuses[docId]?.status;
    if (status === 'approved') return 'bg-emerald-500';
    if (status === 'rejected') return 'bg-red-500';
    return 'bg-gray-300 dark:bg-gray-600';
  };

  const getStatusBadge = (docId) => {
    const status = documentStatuses[docId]?.status;
    if (status === 'approved') return <Check className="w-3 h-3 text-emerald-500" />;
    if (status === 'rejected') return <XCircle className="w-3 h-3 text-red-500" />;
    return null;
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl shadow-2xl w-full max-w-6xl h-[85vh] flex flex-col overflow-hidden border border-border">
        {/* Compact Header */}
        <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-muted">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-foreground">Revisión de Documentación</h2>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-semibold">
                  {client.legalName || `${client.firstName} ${client.lastName}`}
                </span>
                <span className="text-muted-foreground/50">|</span>
                <span className="font-mono">{client.cuit}</span>
                <span className="text-muted-foreground/50">|</span>
                <span>{ENTITY_TYPE_LABELS[client.entityType]}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Progress indicator */}
            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-muted-foreground">{approvedCount}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-muted-foreground">{rejectedCount}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-gray-300" />
                <span className="text-muted-foreground">{requiredDocs.length - approvedCount}</span>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Collapsible Sidebar - Document List */}
          <div className={`border-r border-border bg-muted/50 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'w-12' : 'w-56'}`}>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 hover:bg-secondary text-muted-foreground flex items-center justify-center border-b border-border"
            >
              {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>

            {!sidebarCollapsed && (
              <>
                <div className="p-2 border-b border-border">
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all"
                      style={{ width: `${(approvedCount / requiredDocs.length) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 text-center">
                    {approvedCount}/{requiredDocs.length} obligatorios
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto p-1.5">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase px-2 py-1">
                    Obligatorios
                  </p>
                  {documents.filter(d => d.required).map((doc) => {
                    const realIdx = documents.findIndex(d => d.id === doc.id);
                    const hasFile = !!uploadedDocs[doc.id];

                    return (
                      <button
                        key={doc.id}
                        onClick={() => setCurrentDocIndex(realIdx)}
                        className={`w-full text-left p-1.5 rounded mb-0.5 flex items-center gap-1.5 transition-colors ${
                          currentDocIndex === realIdx
                            ? 'bg-primary/10 ring-1 ring-primary'
                            : 'hover:bg-secondary'
                        }`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${getStatusColor(doc.id)}`} />
                        <span className={`text-xs truncate flex-1 ${!hasFile ? 'text-muted-foreground' : 'text-foreground'}`}>
                          {doc.name}
                        </span>
                        {getStatusBadge(doc.id)}
                      </button>
                    );
                  })}

                  <p className="text-[10px] font-semibold text-muted-foreground uppercase px-2 py-1 mt-2">
                    Opcionales
                  </p>
                  {documents.filter(d => !d.required).map((doc) => {
                    const realIdx = documents.findIndex(d => d.id === doc.id);
                    const hasFile = !!uploadedDocs[doc.id];

                    return (
                      <button
                        key={doc.id}
                        onClick={() => setCurrentDocIndex(realIdx)}
                        className={`w-full text-left p-1.5 rounded mb-0.5 flex items-center gap-1.5 transition-colors ${
                          currentDocIndex === realIdx
                            ? 'bg-primary/10 ring-1 ring-primary'
                            : 'hover:bg-secondary'
                        }`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${getStatusColor(doc.id)}`} />
                        <span className={`text-xs truncate flex-1 ${!hasFile ? 'text-muted-foreground' : 'text-foreground'}`}>
                          {doc.name}
                        </span>
                        {getStatusBadge(doc.id)}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {sidebarCollapsed && (
              <div className="flex-1 overflow-y-auto py-2">
                {documents.map((doc, idx) => (
                  <button
                    key={doc.id}
                    onClick={() => setCurrentDocIndex(idx)}
                    className={`w-full p-2 flex justify-center ${
                      currentDocIndex === idx ? 'bg-primary/10' : 'hover:bg-secondary'
                    }`}
                    title={doc.name}
                  >
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(doc.id)}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Document Viewer */}
          <div className="flex-1 flex flex-col bg-slate-800 dark:bg-slate-900">
            {/* Compact Toolbar */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 dark:bg-slate-950 border-b border-slate-700">
              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrevDoc}
                  disabled={currentDocIndex === 0}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded disabled:opacity-30"
                  title="Documento anterior"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-white text-xs px-2">
                  Doc {currentDocIndex + 1}/{documents.length}
                </span>
                <button
                  onClick={handleNextDoc}
                  disabled={currentDocIndex === documents.length - 1}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded disabled:opacity-30"
                  title="Documento siguiente"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="text-white text-sm font-medium truncate max-w-[200px]">
                {currentDoc?.name}
                {currentDoc?.required && <span className="text-red-400 ml-1">*</span>}
              </div>

              <div className="flex items-center gap-0.5">
                {/* Page navigation for multi-page docs */}
                {totalPages > 1 && (
                  <div className="flex items-center gap-1 mr-2 bg-slate-700 rounded px-2 py-0.5">
                    <button
                      onClick={handlePrevPage}
                      disabled={currentPage === 1}
                      className="p-0.5 text-slate-400 hover:text-white disabled:opacity-30"
                    >
                      <ChevronUp size={14} />
                    </button>
                    <span className="text-white text-xs min-w-[50px] text-center">
                      Pág {currentPage}/{totalPages}
                    </span>
                    <button
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className="p-0.5 text-slate-400 hover:text-white disabled:opacity-30"
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>
                )}
                <button
                  onClick={() => setZoom(z => Math.max(50, z - 25))}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded"
                >
                  <ZoomOut size={14} />
                </button>
                <span className="text-slate-300 text-xs w-10 text-center">{zoom}%</span>
                <button
                  onClick={() => setZoom(z => Math.min(200, z + 25))}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded"
                >
                  <ZoomIn size={14} />
                </button>
                <button
                  onClick={() => setRotation(r => (r + 90) % 360)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded"
                >
                  <RotateCw size={14} />
                </button>
                <button className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded">
                  <Download size={14} />
                </button>
              </div>
            </div>

            {/* Preview Area - Single Page View */}
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
              {currentFile ? (
                <div
                  className="relative"
                  style={{
                    transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                    transition: 'transform 0.2s',
                  }}
                >
                  {currentFile.dataUrl?.startsWith('data:image') ||
                  currentFile.name?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                    <img
                      src={currentFile.dataUrl}
                      alt={currentDoc.name}
                      className="max-w-full rounded shadow-lg bg-white"
                      style={{ maxHeight: '55vh' }}
                    />
                  ) : currentFile.name?.match(/\.pdf$/i) ? (
                    // PDF Page View - simulated single page
                    <div className="bg-white rounded shadow-lg flex flex-col items-center justify-center" style={{ width: '450px', height: '600px' }}>
                      <FileText className="w-16 h-16 text-slate-300 mb-4" />
                      <p className="text-slate-600 font-medium text-sm">{currentFile.name}</p>
                      <p className="text-slate-400 text-xs mt-2">Página {currentPage} de {totalPages}</p>
                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={handlePrevPage}
                          disabled={currentPage === 1}
                          className="btn btn-secondary text-xs py-1 px-3 disabled:opacity-30"
                        >
                          <ChevronLeft size={14} className="mr-1" />
                          Anterior
                        </button>
                        <button
                          onClick={handleNextPage}
                          disabled={currentPage === totalPages}
                          className="btn btn-secondary text-xs py-1 px-3 disabled:opacity-30"
                        >
                          Siguiente
                          <ChevronRight size={14} className="ml-1" />
                        </button>
                      </div>
                      <button className="btn btn-primary text-xs mt-4">
                        <Download size={14} className="mr-1" />
                        Descargar PDF
                      </button>
                    </div>
                  ) : (
                    <div className="bg-white rounded shadow-lg p-6 text-center" style={{ width: '400px', height: '500px' }}>
                      <FileText className="w-16 h-16 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-600 font-medium text-sm">{currentFile.name}</p>
                      <p className="text-slate-400 text-xs mt-2">
                        Vista previa no disponible
                      </p>
                      <button className="btn btn-primary text-xs mt-4">
                        <Download size={14} className="mr-1" />
                        Descargar
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-slate-400">
                  <AlertCircle className="w-12 h-12 mx-auto mb-3" />
                  <p className="text-sm">Documento no cargado</p>
                  <p className="text-xs mt-1">El cliente no ha subido este documento</p>
                </div>
              )}
            </div>

            {/* Compact Action Bar */}
            <div className="px-4 py-2 bg-slate-900 dark:bg-slate-950 border-t border-slate-700">
              {documentStatuses[currentDoc?.id]?.status === 'approved' ? (
                <div className="flex items-center justify-center gap-2 text-emerald-400 text-sm">
                  <CheckCircle size={16} />
                  <span>Documento aprobado</span>
                </div>
              ) : documentStatuses[currentDoc?.id]?.status === 'rejected' ? (
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-red-400 text-sm">
                    <XCircle size={16} />
                    <span>Rechazado: {documentStatuses[currentDoc?.id]?.comment}</span>
                  </div>
                </div>
              ) : currentFile ? (
                <div>
                  {showRejectInput ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        className="flex-1 px-3 py-1.5 rounded border-0 bg-slate-700 text-white text-sm placeholder-slate-400"
                        placeholder="Motivo del rechazo..."
                        value={rejectComment}
                        onChange={(e) => setRejectComment(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleRejectDoc()}
                      />
                      <button onClick={handleRejectDoc} className="btn btn-danger text-xs py-1.5 px-3">
                        Confirmar
                      </button>
                      <button
                        onClick={() => { setShowRejectInput(false); setRejectComment(''); }}
                        className="btn btn-secondary text-xs py-1.5 px-3"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={handleApproveDoc}
                        className="btn btn-success text-sm py-1.5 px-6 flex items-center gap-2"
                      >
                        <Check size={16} />
                        Aprobar
                      </button>
                      <button
                        onClick={() => setShowRejectInput(true)}
                        className="btn btn-danger text-sm py-1.5 px-6 flex items-center gap-2"
                      >
                        <XCircle size={16} />
                        Rechazar
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-center text-slate-500 text-sm">
                  Documento no cargado - no se puede aprobar/rechazar
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Compact Footer */}
        <div className="px-4 py-2 border-t border-border bg-muted flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {allRequiredApproved ? (
              <span className="text-emerald-600 flex items-center gap-1">
                <CheckCircle size={14} />
                Todos los obligatorios aprobados
              </span>
            ) : rejectedCount > 0 ? (
              <span className="text-red-600 flex items-center gap-1">
                <XCircle size={14} />
                {rejectedCount} documento(s) con observaciones
              </span>
            ) : (
              <span>Revise todos los documentos obligatorios</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button onClick={onClose} className="btn btn-secondary text-sm py-1.5 px-4">
              Cerrar
            </button>

            {rejectedCount > 0 && (
              <button onClick={handleRejectClient} className="btn btn-danger text-sm py-1.5 px-4">
                Rechazar y Notificar
              </button>
            )}

            <button
              onClick={handleApproveClient}
              disabled={!allRequiredApproved}
              className={`btn text-sm py-1.5 px-4 flex items-center gap-2 ${
                allRequiredApproved ? 'btn-success' : 'btn-secondary opacity-50 cursor-not-allowed'
              }`}
            >
              <CheckCircle size={16} />
              Aprobar Cliente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentViewerModal;
