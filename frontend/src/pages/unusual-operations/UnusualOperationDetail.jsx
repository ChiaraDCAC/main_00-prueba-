import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { ArrowLeft, CheckCircle, AlertTriangle, Loader2, Upload, FileText, Trash2, Mail, FileSearch, Info, Building } from 'lucide-react';
import { unusualOperationService } from '../../services/unusualOperationService';
import { useInvestigationCaseStore } from '../../context/investigationCaseStore';
import { InvestigationCaseSection } from '../../components/investigation';

const UnusualOperationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [analysis, setAnalysis] = useState('');
  const [conclusion, setConclusion] = useState('');

  // Estado para documentación adicional (legacy - se mantiene por compatibilidad)
  const [docDescription, setDocDescription] = useState('');
  const [docFile, setDocFile] = useState(null);
  const [additionalDocs, setAdditionalDocs] = useState([]);
  const [requestNote, setRequestNote] = useState('');
  const [showDocSection, setShowDocSection] = useState(false);

  // Estado para caso de investigación
  const [showInvestigation, setShowInvestigation] = useState(false);
  const [investigationCaseId, setInvestigationCaseId] = useState(null);
  const { cases, fetchCases, createFromAlert } = useInvestigationCaseStore();

  // Abrir sección de docs si viene con ?docs=true
  useEffect(() => {
    if (searchParams.get('docs') === 'true') {
      setShowDocSection(true);
    }
    if (searchParams.get('investigation') === 'true') {
      setShowInvestigation(true);
    }
  }, [searchParams]);

  // Buscar si existe un caso de investigación para esta operación
  useEffect(() => {
    fetchCases().then(() => {
      const existingCase = cases.find(c => c.unusualOperationId === id);
      if (existingCase) {
        setInvestigationCaseId(existingCase.id);
      }
    });
  }, [id, cases.length]);

  const { data, isLoading } = useQuery({
    queryKey: ['unusualOperation', id],
    queryFn: () => unusualOperationService.getById(id),
  });

  const operation = data?.data?.data;

  const analyzeMutation = useMutation({
    mutationFn: () => unusualOperationService.analyze(id, analysis),
    onSuccess: () => {
      toast.success('Análisis registrado');
      queryClient.invalidateQueries(['unusualOperation', id]);
    },
  });

  const justifyMutation = useMutation({
    mutationFn: () => unusualOperationService.markAsJustified(id, conclusion),
    onSuccess: () => {
      toast.success('Operación clasificada como justificada');
      queryClient.invalidateQueries(['unusualOperation', id]);
    },
  });

  const suspiciousMutation = useMutation({
    mutationFn: () => unusualOperationService.markAsSuspicious(id, { conclusion, suspicionDescription: conclusion }),
    onSuccess: () => {
      toast.success('Operación clasificada como sospechosa. ROS generado.');
      queryClient.invalidateQueries(['unusualOperation', id]);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!operation) {
    return <div className="text-center py-12">Operación no encontrada</div>;
  }

  const getStatusBadge = (status) => {
    const config = {
      'pendiente': { label: 'Pendiente', color: 'text-sky-600', bg: 'bg-sky-50', dot: 'bg-sky-400' },
      'en_analisis': { label: 'En Análisis', color: 'text-blue-600', bg: 'bg-blue-50', dot: 'bg-blue-500' },
      'justificada': { label: 'Justificada', color: 'text-slate-600', bg: 'bg-slate-50', dot: 'bg-slate-400' },
      'sospechosa': { label: 'Sospechosa (ROS)', color: 'text-indigo-900', bg: 'bg-indigo-50', dot: 'bg-indigo-900' },
    };
    const cfg = config[status] || config['pendiente'];
    return (
      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm border border-blue-100/50 ${cfg.bg} ${cfg.color}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${status === 'pendiente' ? 'animate-pulse' : ''}`} />
        {cfg.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/unusual-operations')} className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-primary hover:text-white transition-all">
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{operation.operationNumber}</h1>
              {getStatusBadge(operation.status)}
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <AlertTriangle size={14} className="text-amber-500" />
              Operación Inusual Detectada por Sistema
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {operation.suspiciousReport && (
            <Link to={`/ros/${operation.suspiciousReport.id}`} className="btn bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-2 shadow-lg shadow-rose-600/20">
              <FileText size={18} />
              Ver ROS
            </Link>
          )}
          <button className="btn btn-secondary px-3 py-2">
            <Mail size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <div className="bg-blue-50/30 dark:bg-slate-900/50 px-6 py-4 border-b border-blue-50/50 dark:border-slate-700">
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-tight">
                <Info size={20} className="text-sky-500" />
                Detalles Técnicos
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                <div className="p-4 bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-slate-100 dark:border-slate-700/50">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Detección</p>
                  <p className="font-bold text-foreground">{new Date(operation.detectionDate).toLocaleDateString('es-AR')}</p>
                  <p className="text-[10px] text-muted-foreground">{new Date(operation.detectionDate).toLocaleTimeString('es-AR')}</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-slate-100 dark:border-slate-700/50">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Monto</p>
                  <p className="text-xl font-black text-primary">
                    {operation.amount ? `$${Number(operation.amount).toLocaleString('es-AR')}` : '-'}
                    <span className="text-xs ml-1 opacity-60">{operation.currency}</span>
                  </p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-slate-100 dark:border-slate-700/50">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Canal/Tipo</p>
                  <p className="font-bold text-foreground capitalize">{operation.operationType?.replace('_', ' ') || '-'}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Descripción del Evento</label>
                  <div className="mt-1.5 p-4 bg-blue-50/40 dark:bg-slate-900/40 rounded-xl border border-blue-100/50 dark:border-slate-700 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                    "{operation.description}"
                  </div>
                </div>

                {operation.unusualIndicators?.length > 0 && (
                  <div>
                    <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Indicadores de Inusualidad (UIF)</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {operation.unusualIndicators.map((ind, i) => (
                        <span key={i} className="px-3 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded-lg text-[11px] font-bold border border-amber-200 dark:border-amber-800 uppercase">
                          ⚠️ {ind.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {operation.status === 'pendiente' && (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-blue-100 shadow-xl shadow-blue-500/5">
              <h2 className="text-lg font-black text-slate-900 mb-4 uppercase tracking-tight">Registrar Análisis</h2>
              <textarea
                className="w-full min-h-[120px] p-4 bg-slate-50 border-none rounded-2xl mb-4 focus:ring-4 focus:ring-blue-100 transition-all text-sm"
                placeholder="Ingrese el análisis realizado..."
                value={analysis}
                onChange={(e) => setAnalysis(e.target.value)}
              />
              <button
                onClick={() => analyzeMutation.mutate()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-200 transition-all active:scale-95"
                disabled={!analysis.trim() || analyzeMutation.isPending}
              >
                Guardar Análisis
              </button>
            </div>
          )}

          {operation.analysis && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-4 text-foreground">Análisis Realizado</h2>
              <p className="whitespace-pre-wrap text-foreground">{operation.analysis}</p>
              {operation.analyzedAt && (
                <p className="text-sm text-muted-foreground mt-2">
                  Analizado el {new Date(operation.analyzedAt).toLocaleString('es-AR')}
                </p>
              )}
            </div>
          )}

          {operation.status === 'en_analisis' && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-blue-500/10 overflow-hidden shadow-2xl relative">
              <div className="bg-blue-500/5 px-6 py-4 border-b border-blue-500/10">
                <h2 className="text-lg font-black text-blue-900 flex items-center gap-2 uppercase tracking-tight">
                  <CheckCircle size={20} className="text-sky-500" />
                  Resolución del Caso
                </h2>
              </div>
              <div className="p-6">
                <p className="text-[10px] text-slate-400 mb-4 font-black uppercase tracking-widest">
                  Conclusión Final
                </p>
                <textarea
                  className="w-full min-h-[160px] p-4 bg-slate-50 border-none rounded-2xl mb-6 focus:ring-4 focus:ring-blue-100 transition-all text-sm leading-relaxed"
                  placeholder="Redacte su conclusión final aquí..."
                  value={conclusion}
                  onChange={(e) => setConclusion(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => justifyMutation.mutate()}
                    className="group bg-white border border-blue-100 hover:bg-slate-50 text-blue-900 flex flex-col items-center justify-center gap-2 py-4 rounded-xl shadow-sm transition-all hover:-translate-y-1"
                    disabled={!conclusion.trim() || justifyMutation.isPending}
                  >
                    <CheckCircle size={24} className="text-sky-500 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-black uppercase tracking-widest">Justificada</span>
                  </button>
                  <button
                    onClick={() => suspiciousMutation.mutate()}
                    className="group bg-indigo-900 hover:bg-indigo-950 text-white flex flex-col items-center justify-center gap-2 py-4 rounded-xl shadow-lg shadow-indigo-200 transition-all hover:-translate-y-1"
                    disabled={!conclusion.trim() || suspiciousMutation.isPending}
                  >
                    <AlertTriangle size={24} className="group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-black uppercase tracking-widest">Sospechosa (ROS)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {operation.conclusion && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-4 text-foreground">Conclusión</h2>
              <p className="whitespace-pre-wrap text-foreground">{operation.conclusion}</p>
            </div>
          )}

          {/* Botones de acción para investigación y documentación */}
          {operation.status !== 'justificada' && operation.status !== 'sospechosa' && (
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => setShowInvestigation(!showInvestigation)}
                className={`btn flex-1 flex items-center justify-center gap-2 py-3 ${showInvestigation ? 'btn-secondary' : 'btn-primary'
                  }`}
              >
                <FileSearch size={20} />
                {showInvestigation
                  ? 'Ocultar Investigación'
                  : investigationCaseId
                    ? 'Ver Caso de Investigación'
                    : 'Iniciar Investigación'}
              </button>
              <button
                onClick={() => setShowDocSection(!showDocSection)}
                className="btn btn-secondary flex-1 flex items-center justify-center gap-2 py-3"
              >
                <Upload size={20} />
                {showDocSection ? 'Ocultar Docs (legacy)' : 'Docs (legacy)'}
              </button>
            </div>
          )}

          {/* Sección de Caso de Investigación */}
          {showInvestigation && operation.status !== 'justificada' && operation.status !== 'sospechosa' && (
            <InvestigationCaseSection
              caseId={investigationCaseId}
              unusualOperationId={id}
              onCaseCreated={(newCase) => {
                setInvestigationCaseId(newCase.id);
                queryClient.invalidateQueries(['unusualOperation', id]);
              }}
            />
          )}

          {/* Sección de Documentación Adicional */}
          {showDocSection && operation.status !== 'justificada' && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
                <FileText size={20} />
                Documentación Adicional
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Cargue la documentación solicitada al cliente para el seguimiento interno del caso.
              </p>

              {/* Registrar solicitud de documentación */}
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-400 flex items-center gap-2 mb-2">
                  <Mail size={16} />
                  Registrar Solicitud de Documentación
                </h3>
                <textarea
                  className="input min-h-[80px] mb-2 text-sm"
                  placeholder="Describa qué documentación se solicitó al cliente por email..."
                  value={requestNote}
                  onChange={(e) => setRequestNote(e.target.value)}
                />
                <button
                  onClick={() => {
                    if (requestNote.trim()) {
                      setAdditionalDocs(prev => [...prev, {
                        id: Date.now(),
                        type: 'request',
                        description: requestNote,
                        date: new Date().toISOString(),
                        status: 'pendiente'
                      }]);
                      setRequestNote('');
                      toast.success('Solicitud registrada');
                    }
                  }}
                  className="btn btn-secondary text-sm"
                  disabled={!requestNote.trim()}
                >
                  Registrar Solicitud
                </button>
              </div>

              {/* Subir documento recibido */}
              <div className="border border-border rounded-lg p-4 mb-4">
                <h3 className="text-sm font-semibold text-foreground mb-2">Cargar Documento Recibido</h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    className="input text-sm"
                    placeholder="Descripción del documento..."
                    value={docDescription}
                    onChange={(e) => setDocDescription(e.target.value)}
                  />
                  <input
                    type="file"
                    className="input text-sm file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-primary-600 file:text-white hover:file:bg-primary-700"
                    onChange={(e) => setDocFile(e.target.files[0])}
                  />
                  <button
                    onClick={() => {
                      if (docDescription.trim() && docFile) {
                        setAdditionalDocs(prev => [...prev, {
                          id: Date.now(),
                          type: 'document',
                          description: docDescription,
                          fileName: docFile.name,
                          date: new Date().toISOString(),
                          status: 'recibido'
                        }]);
                        setDocDescription('');
                        setDocFile(null);
                        toast.success('Documento cargado correctamente');
                      }
                    }}
                    className="btn btn-primary text-sm flex items-center gap-2"
                    disabled={!docDescription.trim() || !docFile}
                  >
                    <Upload size={16} />
                    Cargar Documento
                  </button>
                </div>
              </div>

              {/* Lista de documentos y solicitudes */}
              {additionalDocs.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-foreground">Historial de Documentación</h3>
                  {additionalDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className={`flex items-start justify-between p-3 rounded-lg border ${doc.type === 'request'
                        ? 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800'
                        : 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                        }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {doc.type === 'request' ? (
                            <Mail size={14} className="text-yellow-600 dark:text-yellow-400" />
                          ) : (
                            <FileText size={14} className="text-green-600 dark:text-green-400" />
                          )}
                          <span className={`text-xs font-medium px-2 py-0.5 rounded ${doc.type === 'request'
                            ? 'bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200'
                            : 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200'
                            }`}>
                            {doc.type === 'request' ? 'Solicitud' : 'Documento'}
                          </span>
                        </div>
                        <p className="text-sm text-foreground mt-1">{doc.description}</p>
                        {doc.fileName && (
                          <p className="text-xs text-muted-foreground mt-1">Archivo: {doc.fileName}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(doc.date).toLocaleString('es-AR')}
                        </p>
                      </div>
                      <button
                        onClick={() => setAdditionalDocs(prev => prev.filter(d => d.id !== doc.id))}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {operation.suspiciousReport && (
            <div className="card bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900">
              <h2 className="text-lg font-semibold mb-4 text-red-800 dark:text-red-400">ROS Generado</h2>
              <p className="font-mono text-foreground">{operation.suspiciousReport.reportNumber}</p>
              <Link to={`/ros/${operation.suspiciousReport.id}`} className="text-primary-600 hover:underline text-sm mt-2 inline-block">
                Ver ROS
              </Link>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg">
            <h2 className="text-lg font-black text-foreground mb-4 uppercase tracking-tight flex items-center gap-2">
              <Building size={20} className="text-primary" />
              Sujeto Involucrado
            </h2>
            {operation.Client ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                    {(operation.Client.legalName?.[0] || operation.Client.firstName?.[0] || '?').toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-foreground truncate">
                      {operation.Client.legalName || `${operation.Client.firstName} ${operation.Client.lastName}`}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">{operation.Client.cuit || operation.Client.taxId}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium uppercase tracking-wider">Perfil de Riesgo</span>
                    <span className={`px-2 py-0.5 rounded-full font-bold uppercase transition-all ${operation.Client.riskLevel === 'alto' ? 'bg-red-100 text-red-700' :
                      operation.Client.riskLevel === 'medio' ? 'bg-amber-100 text-amber-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                      {operation.Client.riskLevel || 'MEDIO'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${operation.Client.riskLevel === 'alto' ? 'w-[85%] bg-red-500' :
                      operation.Client.riskLevel === 'medio' ? 'w-[50%] bg-amber-500' :
                        'w-[25%] bg-emerald-500'
                      }`}></div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                  <Link to={`/clients/${operation.Client.id}`} className="w-full btn btn-secondary flex items-center justify-center gap-2 py-2.5 text-xs font-bold uppercase tracking-widest bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700">
                    Ficha Completa de KYC
                    <ArrowLeft size={14} className="rotate-180" />
                  </Link>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground italic text-sm">Sin cliente asociado</p>
            )}
          </div>

          {/* Estado de Evidencia - Siguiendo el diagrama del usuario */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm mt-6">
            <h2 className="text-sm font-black text-foreground mb-4 uppercase tracking-widest flex items-center gap-2">
              <FileSearch size={18} className="text-primary" />
              Gestión de Evidencia
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-700/50">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">Docs Solicitados</span>
                {operation.InvestigationCase?.documentRequests?.length > 0 ? (
                  <span className="text-[10px] font-black bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase">SÍ</span>
                ) : (
                  <span className="text-[10px] font-black bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full uppercase">NO</span>
                )}
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-700/50">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">Resultado Análisis</span>
                {operation.status === 'justificada' ? (
                  <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full uppercase">JUSTIFICADO</span>
                ) : operation.status === 'sospechosa' ? (
                  <span className="text-[10px] font-black bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full uppercase">ESCALADO (ROS)</span>
                ) : (
                  <span className="text-[10px] font-black bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full uppercase italic tracking-tighter">EN PROCESO</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnusualOperationDetail;
