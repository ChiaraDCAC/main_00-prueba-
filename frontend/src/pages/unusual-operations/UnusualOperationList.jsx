import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  AlertTriangle, Clock, CheckCircle,
  FileWarning,
  FileText, X, Send, Upload, Paperclip, Trash2,
  Eye, Building2, Calendar, DollarSign, ShieldAlert,
} from 'lucide-react';
import { unusualOperationService } from '../../services/unusualOperationService';

// ─── CONFIG COLUMNAS ─────────────────────────────────────────────────────────
const COLUMNS = [
  { id: 'pendiente',  label: 'Pendientes',  dot: 'bg-sky-400 animate-pulse',  dropBg: 'border-sky-300 bg-sky-50/60 dark:bg-sky-500/5 dark:border-sky-600' },
  { id: 'sospechosa', label: 'Sospechosa',  dot: 'bg-rose-500',               dropBg: 'border-rose-300 bg-rose-50/60 dark:bg-rose-500/5 dark:border-rose-600' },
  { id: 'justificada',label: 'Justificada', dot: 'bg-emerald-500',            dropBg: 'border-emerald-300 bg-emerald-50/60 dark:bg-emerald-500/5 dark:border-emerald-600' },
];

const INDICATOR_LABELS = {
  monto_alto: 'Monto alto', monto_bajo_umbral: 'Bajo umbral',
  fraccionamiento: 'Fraccionam.', frecuencia_inusual: 'Frec. inusual',
  sin_justificacion: 'Sin justif.', sin_documentacion: 'Sin doc.',
  datos_falsos: 'Datos falsos', inconsistencia_perfil: 'Inc. perfil',
  perfil_transaccional: 'Excede perfil', cambio_comportamiento: 'Cambio comp.',
  efectivo: 'Efectivo', pais_riesgo: 'País riesgo',
  terceros_desconocidos: 'Terceros desc.', pep_vinculado: 'PEP',
  empresa_fantasma: 'Emp. fantasma', urgencia_injustificada: 'Urgencia',
  reticencia_info: 'Reticencia', alerta_lista: 'Lista control',
};

const fmt = (monto, currency = 'ARS') => {
  if (!monto) return '—';
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: currency || 'ARS', maximumFractionDigits: 0,
  }).format(monto);
};

// ─── MODAL SOLICITAR DOCUMENTACIÓN ───────────────────────────────────────────
function SolicitarDocModal({ op, onClose, onResolve }) {
  const [notas, setNotas] = useState('');
  const [archivos, setArchivos] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');

  const clientName =
    op.Client?.legalName ||
    `${op.Client?.firstName || ''} ${op.Client?.lastName || ''}`.trim() ||
    'Sin cliente';

  const addFiles = (files) => {
    const nuevos = Array.from(files).map((f) => ({
      id: `${f.name}-${f.size}-${Date.now()}`,
      name: f.name, size: f.size, type: f.type, file: f,
    }));
    setArchivos((prev) => [...prev, ...nuevos]);
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  const removeFile = (id) => setArchivos((prev) => prev.filter((f) => f.id !== id));

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleResolve = (estado) => {
    if (!notas.trim()) {
      setError('El análisis / descripción es obligatorio.');
      return;
    }
    setError('');
    onResolve(estado, notas, archivos);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col" style={{ maxHeight: '88vh' }}>

        {/* Header fijo */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-100 dark:bg-amber-500/20 rounded-xl flex items-center justify-center">
              <FileText size={18} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                Solicitar Documentación
              </h2>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                {op.operationNumber || `OI-${String(op.id).slice(0, 6).toUpperCase()}`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Cuerpo con scroll */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Op info */}
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 space-y-1">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{clientName}</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{fmt(op.amount, op.currency)}</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {op.currency} · {new Date(op.detectionDate).toLocaleDateString('es-AR')}
            </p>
          </div>

          {/* Notas obligatorio */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Análisis / Descripción <span className="text-rose-500">*</span>
            </label>
            <textarea
              className={`w-full border rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 resize-none focus:outline-none focus:ring-2 transition-all
                ${error ? 'border-rose-400 dark:border-rose-500 focus:ring-rose-400/30' : 'border-slate-200 dark:border-slate-600 focus:ring-[#3879a3]/30 focus:border-[#3879a3] dark:focus:border-sky-500'}`}
              rows={3}
              placeholder="Describí el análisis realizado, la documentación recibida o el motivo de la resolución..."
              value={notas}
              onChange={(e) => { setNotas(e.target.value); if (e.target.value.trim()) setError(''); }}
            />
            {error && (
              <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                <AlertTriangle size={11} /> {error}
              </p>
            )}
          </div>

          {/* Carga de archivos */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Documentación adjunta
              <span className="ml-1 text-[10px] text-slate-400 font-normal normal-case">(PDF, imágenes, etc.)</span>
            </label>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleFileDrop}
              onClick={() => document.getElementById('file-upload-op').click()}
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all
                ${dragOver ? 'border-[#3879a3] bg-[#3879a3]/5 dark:bg-sky-500/10' : 'border-slate-200 dark:border-slate-600 hover:border-[#3879a3]/50 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
            >
              <input id="file-upload-op" type="file" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
              <Upload size={22} className="mx-auto mb-2 text-slate-300 dark:text-slate-500" />
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Arrastrá archivos o <span className="text-[#3879a3] dark:text-sky-400">hacé clic para seleccionar</span>
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">PDF, JPG, PNG, DOCX — múltiples archivos</p>
            </div>

            {/* Lista de archivos con scroll si hay muchos */}
            {archivos.length > 0 && (
              <div className="mt-2 space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {archivos.map((f) => (
                  <div key={f.id} className="flex items-center gap-3 px-3 py-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                    <Paperclip size={14} className="text-[#3879a3] dark:text-sky-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">{f.name}</p>
                      <p className="text-[10px] text-slate-400">{formatSize(f.size)}</p>
                    </div>
                    <button onClick={() => removeFile(f.id)} className="p-1 text-slate-300 hover:text-rose-500 dark:text-slate-600 dark:hover:text-rose-400 transition-colors flex-shrink-0">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Acciones fijas abajo */}
        <div className="px-6 pb-5 pt-4 border-t border-slate-100 dark:border-slate-700 space-y-2.5 flex-shrink-0">
          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium text-center mb-1">
            ¿Cuál es la resolución de esta operación?
          </p>
          <button onClick={() => handleResolve('justificada')} className="w-full flex items-center justify-center gap-2.5 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all hover:shadow-lg hover:shadow-emerald-500/25 text-sm">
            <CheckCircle size={17} /> Justificar operación
          </button>
          <button onClick={() => handleResolve('sospechosa')} className="w-full flex items-center justify-center gap-2.5 px-4 py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl transition-all hover:shadow-lg hover:shadow-rose-500/25 text-sm">
            <AlertTriangle size={17} /> Reportar como ROS ante UIF
          </button>
          <button onClick={onClose} className="w-full py-2 text-sm text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MODAL VER MÁS (detalle según estado) ────────────────────────────────────
function VerMasModal({ op, onClose, onSolicitar }) {
  const clientName =
    op.Client?.legalName ||
    `${op.Client?.firstName || ''} ${op.Client?.lastName || ''}`.trim() ||
    'Sin cliente';

  const risk = op.Client?.riskLevel || 'medio';
  const riskStyle = {
    bajo: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
    medio: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
    alto: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400',
  }[risk] || 'bg-slate-100 text-slate-600';

  const statusConfig = {
    pendiente: {
      label: 'Pendiente', icon: Clock,
      color: 'text-sky-600 dark:text-sky-400',
      bg: 'bg-sky-50 dark:bg-sky-500/10',
      border: 'border-sky-200 dark:border-sky-500/30',
    },
    sospechosa: {
      label: 'Sospechosa — ROS requerido', icon: AlertTriangle,
      color: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-50 dark:bg-rose-500/10',
      border: 'border-rose-200 dark:border-rose-500/30',
    },
    justificada: {
      label: 'Justificada — Caso cerrado', icon: CheckCircle,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-500/10',
      border: 'border-emerald-200 dark:border-emerald-500/30',
    },
  }[op.status] || { label: op.status, icon: Info, color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' };

  const StatusIcon = statusConfig.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl flex flex-col" style={{ maxHeight: '95vh' }}>

        {/* Header fijo */}
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${statusConfig.bg}`}>
              <StatusIcon size={16} className={statusConfig.color} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                Detalle de Operación
              </h2>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                {op.operationNumber || `OI-${String(op.id).slice(0, 6).toUpperCase()}`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Cuerpo con scroll */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

          {/* Estado */}
          <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border ${statusConfig.bg} ${statusConfig.border}`}>
            <StatusIcon size={16} className={statusConfig.color} />
            <span className={`text-sm font-bold ${statusConfig.color}`}>{statusConfig.label}</span>
          </div>

          {/* Cliente + Monto */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 space-y-1">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Building2 size={10} /> Cliente
              </p>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">{clientName}</p>
              <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-md uppercase ${riskStyle}`}>
                riesgo {risk}
              </span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 space-y-1">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <DollarSign size={10} /> Monto
              </p>
              <p className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{fmt(op.amount, op.currency)}</p>
              <p className="text-[10px] text-slate-400 flex items-center gap-1">
                <Calendar size={10} /> {new Date(op.detectionDate).toLocaleDateString('es-AR')}
              </p>
            </div>
          </div>

          {/* Indicadores */}
          {op.unusualIndicators?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Indicadores inusuales
              </p>
              <div className="flex flex-wrap gap-1.5">
                {op.unusualIndicators.map(ind => (
                  <span key={ind} className="text-[10px] font-semibold px-2 py-1 rounded-lg
                    bg-amber-50 text-amber-700 border border-amber-200
                    dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30">
                    {INDICATOR_LABELS[ind] || ind}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Descripción */}
          {op.description && (
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Descripción
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 leading-relaxed min-h-[100px]">
                {op.description}
              </p>
            </div>
          )}

          {/* ── SECCIÓN SEGÚN ESTADO ── */}

          {/* PENDIENTE: aviso y acción */}
          {op.status === 'pendiente' && (
            <div className="bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/30 rounded-xl p-4">
              <p className="text-xs font-bold text-sky-700 dark:text-sky-400 mb-1 flex items-center gap-1.5">
                <Clock size={13} /> Análisis pendiente
              </p>
              <p className="text-xs text-sky-600 dark:text-sky-400/80">
                Esta operación requiere revisión. Solicitá la documentación para resolverla como justificada o reportarla como ROS ante la UIF.
              </p>
            </div>
          )}

          {/* SOSPECHOSA: info ROS */}
          {op.status === 'sospechosa' && (
            <div className="space-y-3">
              <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-xl p-4">
                <p className="text-xs font-bold text-rose-700 dark:text-rose-400 mb-1.5 flex items-center gap-1.5">
                  <ShieldAlert size={13} /> Reporte de Operación Sospechosa (ROS)
                </p>
                <p className="text-xs text-rose-600 dark:text-rose-400/80 mb-3">
                  Esta operación fue marcada como sospechosa y debe ser reportada ante la <strong>Unidad de Información Financiera (UIF)</strong> mediante un ROS.
                </p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-rose-700 dark:text-rose-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
                    Emitir el ROS en el sistema de la UIF
                  </div>
                  <div className="flex items-center gap-2 text-xs text-rose-700 dark:text-rose-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
                    Plazo: 30 días desde la detección
                  </div>
                  <div className="flex items-center gap-2 text-xs text-rose-700 dark:text-rose-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
                    No informar al cliente sobre el reporte (deber de reserva)
                  </div>
                </div>
              </div>
              {op.analisisNotas && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Análisis registrado</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 leading-relaxed min-h-[100px]">{op.analisisNotas}</p>
                </div>
              )}
            </div>
          )}

          {/* JUSTIFICADA: documentos y notas */}
          {op.status === 'justificada' && (
            <div className="space-y-3">
              <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-xl p-4">
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1 flex items-center gap-1.5">
                  <CheckCircle size={13} /> Operación justificada — Caso cerrado
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400/80">
                  La operación fue analizada y cuenta con documentación que la justifica. No requiere reporte a la UIF.
                </p>
              </div>
              {op.analisisNotas && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Análisis / Justificación</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 leading-relaxed min-h-[100px]">{op.analisisNotas}</p>
                </div>
              )}
              {op.archivosAdjuntos?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Documentación adjunta ({op.archivosAdjuntos.length})
                  </p>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {op.archivosAdjuntos.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                        <Paperclip size={13} className="text-emerald-500 flex-shrink-0" />
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">{f.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer fijo */}
        <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700 flex gap-3 flex-shrink-0">
          {op.status === 'pendiente' && (
            <button
              onClick={() => { onClose(); onSolicitar(op); }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#3879a3] hover:bg-[#2d6a8a] text-white font-bold rounded-xl text-sm transition-all"
            >
              <Send size={15} /> Solicitar Documentación
            </button>
          )}
          <button
            onClick={onClose}
            className={`${op.status === 'pendiente' ? '' : 'flex-1'} py-2.5 px-5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl transition-colors font-medium`}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── CARD ─────────────────────────────────────────────────────────────────────
const KanbanCard = ({ op, onDragStart, onDragEnd, isDragging, onVerMas }) => {
  const clientName =
    op.Client?.legalName ||
    `${op.Client?.firstName || ''} ${op.Client?.lastName || ''}`.trim() ||
    'Sin cliente';

  const risk = op.Client?.riskLevel || 'medio';
  const riskStyle = {
    bajo:  'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
    medio: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
    alto:  'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400',
  }[risk] || 'bg-slate-100 text-slate-500';

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, op.id)}
      onDragEnd={onDragEnd}
      className={`
        group bg-white dark:bg-slate-800 rounded-lg border border-slate-200
        dark:border-slate-700/80 transition-all duration-150 select-none
        ${isDragging ? 'opacity-20 scale-95 cursor-grabbing' : 'cursor-grab hover:border-slate-300 dark:hover:border-slate-600'}
      `}
    >
      <div className="p-3.5">
        {/* Client + Risk */}
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-snug line-clamp-2 flex-1">
            {clientName}
          </p>
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide flex-shrink-0 ${riskStyle}`}>
            {risk}
          </span>
        </div>

        {/* Amount */}
        <p className="text-base font-bold text-slate-900 dark:text-white tracking-tight leading-none">
          {fmt(op.amount, op.currency)}
        </p>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 mb-3">
          {new Date(op.detectionDate).toLocaleDateString('es-AR')}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-slate-300 dark:text-slate-600 font-mono">
            {op.operationNumber || `OI-${String(op.id).slice(0, 6).toUpperCase()}`}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); onVerMas(op); }}
            className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 dark:text-slate-500 hover:text-[#3879a3] dark:hover:text-sky-400 transition-colors"
          >
            <Eye size={11} /> Ver más
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── COLUMN ───────────────────────────────────────────────────────────────────
const KanbanColumn = ({ col, cards, draggingId, isOver, onDragOver, onDrop, onCardDragStart, onCardDragEnd, onVerMas, onSolicitar }) => {
  return (
    <div className="flex flex-col flex-1 min-w-[300px]">
      {/* Header */}
      <div className="flex items-center justify-between px-1 mb-3">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${col.dot}`} />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{col.label}</p>
        </div>
        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700/60 px-2 py-0.5 rounded-full">
          {cards.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); onDragOver(col.id); }}
        onDrop={(e) => { e.preventDefault(); onDrop(col.id); }}
        className={`flex-1 min-h-[500px] rounded-xl p-2.5 space-y-2 overflow-y-auto transition-all duration-150
          ${isOver
            ? `border-2 border-dashed ${col.dropBg}`
            : 'bg-slate-50/70 dark:bg-slate-900/30 border border-slate-200/70 dark:border-slate-700/50'
          }`}
      >
        {cards.map(op => (
          <KanbanCard
            key={op.id}
            op={op}
            colId={col.id}
            onDragStart={onCardDragStart}
            onDragEnd={onCardDragEnd}
            isDragging={draggingId === op.id}
            onVerMas={onVerMas}
            onSolicitar={onSolicitar}
          />
        ))}
        {cards.length === 0 && !isOver && (
          <div className="flex items-center justify-center h-32 select-none">
            <p className="text-[10px] font-medium uppercase tracking-widest text-slate-300 dark:text-slate-600">Sin casos</p>
          </div>
        )}
        {isOver && (
          <div className="flex items-center justify-center h-12 rounded-lg">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">Soltar aquí</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── MAIN ─────────────────────────────────────────────────────────────────────
const UnusualOperationList = () => {
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);
  const [localOps, setLocalOps] = useState(null);
  const [solicitarOp, setSolicitarOp] = useState(null);
  const [verMasOp, setVerMasOp] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['unusualOperations', { page: 1, limit: 100 }],
    queryFn: () => unusualOperationService.list({ page: 1, limit: 100 }),
  });

  const apiOps = data?.data?.data || [];

  const DEMO_OPS = [
    {
      id: 'demo-001',
      operationNumber: 'OI-2025-000001',
      detectionDate: '2025-11-04T10:22:00Z',
      status: 'pendiente',
      amount: 1500000,
      currency: 'ARS',
      operationType: 'transferencia_internacional',
      unusualIndicators: ['monto_alto', 'pais_riesgo', 'sin_justificacion'],
      description: 'Transferencia internacional de alto monto sin justificación económica aparente. Destino: cuenta en Islas Caimán.',
      Client: { id: 'c1', legalName: 'Distribuidora del Sur S.A.', riskLevel: 'alto' },
    },
    {
      id: 'demo-002',
      operationNumber: 'OI-2025-000002',
      detectionDate: '2025-11-10T14:05:00Z',
      status: 'pendiente',
      amount: 480000,
      currency: 'ARS',
      operationType: 'deposito_efectivo',
      unusualIndicators: ['efectivo', 'fraccionamiento', 'frecuencia_inusual'],
      description: 'Tres depósitos en efectivo consecutivos de montos similares realizados en un lapso de 48 horas. Posible fraccionamiento para evitar controles.',
      Client: { id: 'c2', firstName: 'Rodrigo', lastName: 'Méndez', riskLevel: 'medio' },
    },
    {
      id: 'demo-003',
      operationNumber: 'OI-2025-000003',
      detectionDate: '2025-11-18T09:30:00Z',
      status: 'pendiente',
      amount: 2200000,
      currency: 'USD',
      operationType: 'compra_divisas',
      unusualIndicators: ['monto_alto', 'inconsistencia_perfil', 'reticencia_info'],
      description: 'Compra de divisas que supera ampliamente el perfil transaccional habitual del cliente. El cliente se mostró reticente a brindar justificación de fondos.',
      Client: { id: 'c3', legalName: 'Agroinversiones del Norte S.R.L.', riskLevel: 'alto' },
    },
    {
      id: 'demo-004',
      operationNumber: 'OI-2025-000004',
      detectionDate: '2025-10-28T16:45:00Z',
      status: 'pendiente',
      amount: 750000,
      currency: 'ARS',
      operationType: 'transferencia_local',
      unusualIndicators: ['terceros_desconocidos', 'urgencia_injustificada'],
      description: 'Transferencia a terceros no vinculados con el giro habitual del cliente. El cliente solicitó urgencia inusual en la operación sin motivo claro.',
      Client: { id: 'c4', firstName: 'Valeria', lastName: 'Ríos', riskLevel: 'medio' },
    },
    {
      id: 'demo-005',
      operationNumber: 'OI-2025-000005',
      detectionDate: '2025-10-15T11:00:00Z',
      status: 'sospechosa',
      amount: 3800000,
      currency: 'ARS',
      operationType: 'transferencia_internacional',
      unusualIndicators: ['monto_alto', 'pais_riesgo', 'pep_vinculado', 'datos_falsos'],
      description: 'Transferencia internacional a jurisdicción de alto riesgo. Se detectó vinculación con Persona Expuesta Políticamente (PEP) y documentación con inconsistencias.',
      analisisNotas: 'Se verificaron inconsistencias en los documentos presentados. El beneficiario final tiene vínculos con funcionarios públicos extranjeros. Se procede a reportar ante la UIF.',
      Client: { id: 'c5', legalName: 'Inversiones Globales Patagonia S.A.', riskLevel: 'alto' },
    },
    {
      id: 'demo-006',
      operationNumber: 'OI-2025-000006',
      detectionDate: '2025-10-20T08:15:00Z',
      status: 'sospechosa',
      amount: 920000,
      currency: 'USD',
      operationType: 'compra_activos',
      unusualIndicators: ['empresa_fantasma', 'sin_documentacion', 'alerta_lista'],
      description: 'Compra de activos inmobiliarios mediante sociedad sin actividad económica real. La contraparte figura en lista de control de la OFAC.',
      analisisNotas: 'Empresa vendedora sin registros tributarios activos. Contraparte identificada en listas restrictivas internacionales. ROS generado el 25/10/2025.',
      Client: { id: 'c6', legalName: 'Constructora Cuyo S.A.', riskLevel: 'alto' },
    },
    {
      id: 'demo-007',
      operationNumber: 'OI-2025-000007',
      detectionDate: '2025-09-30T13:20:00Z',
      status: 'justificada',
      amount: 680000,
      currency: 'ARS',
      operationType: 'deposito_efectivo',
      unusualIndicators: ['efectivo', 'monto_alto'],
      description: 'Depósito en efectivo de monto elevado respecto al perfil del cliente. Detectado por el sistema de monitoreo automático.',
      analisisNotas: 'El cliente presentó documentación que acredita la venta de maquinaria agrícola. Se adjuntan facturas y contrato de compraventa. Operación justificada con sustento documental suficiente.',
      archivosAdjuntos: [
        { name: 'factura_venta_maquinaria.pdf' },
        { name: 'contrato_compraventa.pdf' },
        { name: 'recibo_pago.jpg' },
      ],
      Client: { id: 'c7', legalName: 'Agro Campo Lindo S.A.', riskLevel: 'bajo' },
    },
    {
      id: 'demo-008',
      operationNumber: 'OI-2025-000008',
      detectionDate: '2025-09-12T17:00:00Z',
      status: 'justificada',
      amount: 310000,
      currency: 'ARS',
      operationType: 'transferencia_local',
      unusualIndicators: ['frecuencia_inusual', 'perfil_transaccional'],
      description: 'Serie de transferencias que exceden el perfil transaccional habitual del cliente en el mes.',
      analisisNotas: 'Cliente acreditó que las transferencias corresponden a pagos de proveedores por temporada alta. Se adjuntan órdenes de compra y extracto bancario.',
      archivosAdjuntos: [
        { name: 'ordenes_compra_octubre.pdf' },
        { name: 'extracto_bancario.pdf' },
      ],
      Client: { id: 'c8', firstName: 'Marcela', lastName: 'Giménez', riskLevel: 'bajo' },
    },
  ];

  const baseOps = apiOps.length > 0 ? apiOps : DEMO_OPS;
  const operations = localOps ?? baseOps;

  const handleDragStart = (e, opId) => {
    e.dataTransfer.setData('opId', opId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingId(opId);
    setLocalOps(prev => prev ?? baseOps);
  };

  const handleDragEnd = () => { setDraggingId(null); setDragOverCol(null); };

  const handleDrop = (colId) => {
    if (!draggingId) return;
    setDragOverCol(null);
    const prevOp = (localOps ?? baseOps).find(o => o.id === draggingId);
    setLocalOps(prev => {
      const ops = prev ?? baseOps;
      const op = ops.find(o => o.id === draggingId);
      if (!op || op.status === colId) return ops;
      return ops.map(o => o.id === draggingId ? { ...o, status: colId } : o);
    });
    if (prevOp && prevOp.status !== colId) {
      if (colId === 'sospechosa') toast.warning('Operación marcada como Sospechosa — recordá generar el ROS ante la UIF', { autoClose: 6000 });
      else if (colId === 'justificada') toast.success('Operación justificada correctamente');
      else toast.info('Operación volvió a Pendientes');
    }
    setDraggingId(null);
  };

  const handleResolve = (nuevoEstado, notas, archivos) => {
    if (!solicitarOp) return;
    const opId = solicitarOp.id;
    setLocalOps(prev => {
      const ops = prev ?? baseOps;
      return ops.map(o => o.id === opId ? {
        ...o,
        status: nuevoEstado,
        analisisNotas: notas,
        archivosAdjuntos: archivos,
      } : o);
    });
    setSolicitarOp(null);
    if (nuevoEstado === 'justificada') toast.success('Operación justificada correctamente');
    else toast.warning('Operación marcada como Sospechosa — recordá generar el ROS ante la UIF', { autoClose: 6000 });
  };

  const byStatus = (s) => operations.filter(op => op.status === s);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3879a3]" />
      </div>
    );
  }

  return (
    <div className="space-y-5" onDragEnd={handleDragEnd}>

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Operaciones Inusuales</h1>
        <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">
          Arrastrá las tarjetas para cambiar el estado
        </p>
      </div>

      {/* Kanban */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-0 w-full">
          {COLUMNS.map(col => (
            <KanbanColumn
              key={col.id}
              col={col}
              cards={byStatus(col.id)}
              draggingId={draggingId}
              isOver={dragOverCol === col.id}
              onDragOver={setDragOverCol}
              onDrop={handleDrop}
              onCardDragStart={handleDragStart}
              onCardDragEnd={handleDragEnd}
              onVerMas={setVerMasOp}
              onSolicitar={setSolicitarOp}
            />
          ))}
        </div>
      </div>

      {/* Modales */}
      {verMasOp && (
        <VerMasModal
          op={verMasOp}
          onClose={() => setVerMasOp(null)}
          onSolicitar={(op) => { setVerMasOp(null); setSolicitarOp(op); }}
        />
      )}
      {solicitarOp && (
        <SolicitarDocModal
          op={solicitarOp}
          onClose={() => setSolicitarOp(null)}
          onResolve={handleResolve}
        />
      )}
    </div>
  );
};

export default UnusualOperationList;
