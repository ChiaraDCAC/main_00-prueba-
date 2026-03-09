import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  User,
  Building2,
  Eye,
  RefreshCw,
  Calendar,
  FileText,
  Shield,
  ChevronDown,
  ChevronUp,
  X,
  History,
  ArrowRight,
  Play,
  Save,
  UserCheck,
  Globe,
  Briefcase,
  MapPin,
  Phone,
  Mail,
  Hash,
  CreditCard,
  AlertOctagon,
  CheckSquare,
  Square,
  BarChart3,
  Database,
  Upload,
} from 'lucide-react';
import { clientService } from '../../services/clientService';

const DueDiligence = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [expandedClient, setExpandedClient] = useState(null);
  const [nosisFileDDS, setNosisFileDDS] = useState(null);
  const [historyModal, setHistoryModal] = useState({ open: false, client: null });
  const [reviewModal, setReviewModal] = useState({ open: false, client: null });
  const [reviewData, setReviewData] = useState({
    // Verificación de Identidad
    identidadVerificada: false,
    documentoVigente: false,
    fotoCoincide: false,
    // Verificación PEP
    consultaPEP: false,
    resultadoPEP: 'no_pep', // no_pep, pep_nacional, pep_extranjero
    cargoPEP: '',
    // Verificación Listas
    consultaOFAC: false,
    consultaONU: false,
    consultaUIF: false,
    resultadoListas: 'sin_coincidencias', // sin_coincidencias, coincidencia_parcial, coincidencia_total
    // Verificación Actividad
    actividadVerificada: false,
    ingresosConcuerdan: false,
    origenFondosVerificado: false,
    // Fuentes Externas (DDS)
    fuenteExterna: '', // nosis, veraz, ambos
    nosisConsultado: false,
    nosisScore: '',
    nosisSituacion: '', // normal, riesgo_bajo, riesgo_medio, riesgo_alto
    verazConsultado: false,
    verazScore: '',
    verazSituacion: '',
    nse: '', // ABC1, C2, C3, D1, D2E
    nseVerificado: false,
    // Evaluación de Riesgo
    riesgoInherente: 'medio',
    riesgoResidual: 'medio',
    // Observaciones
    observaciones: '',
    // Resultado
    resultado: 'pendiente', // pendiente, aprobado, rechazado, requiere_info
  });

  // Query para obtener clientes
  const { data: clientsData, isLoading } = useQuery({
    queryKey: ['clients', { limit: 50 }],
    queryFn: () => clientService.list({ limit: 50 }),
  });

  const clients = clientsData?.data?.data || [];

  // Datos de ejemplo para debida diligencia
  const getDueDiligenceStatus = (client) => {
    // Simular estados de debida diligencia
    const statuses = ['completa', 'pendiente', 'vencida', 'en_proceso'];
    const randomIndex = Math.floor((client.id?.charCodeAt(0) || 0) % 4);
    return statuses[randomIndex];
  };

  // Tipos de Debida Diligencia según nivel de riesgo
  const ddTypes = {
    bajo: { type: 'DDS', name: 'Debida Diligencia Simplificada', years: 5, color: 'bg-emerald-100 text-emerald-700' },
    medio: { type: 'DDM', name: 'Debida Diligencia Media', years: 3, color: 'bg-amber-100 text-amber-700' },
    alto: { type: 'DDR', name: 'Debida Diligencia Reforzada', years: 1, color: 'bg-red-100 text-red-700' },
  };

  const getDueDiligenceData = (client) => {
    const status = getDueDiligenceStatus(client);
    const riskLevel = client.riskLevel || 'medio';

    // Obtener tipo de DD según nivel de riesgo
    const ddConfig = ddTypes[riskLevel] || ddTypes.medio;

    const lastVerificationDate = new Date();
    lastVerificationDate.setMonth(lastVerificationDate.getMonth() - 3);

    const nextVerificationDate = new Date(lastVerificationDate);
    nextVerificationDate.setFullYear(nextVerificationDate.getFullYear() + ddConfig.years);

    return {
      status,
      ddType: ddConfig.type,
      ddName: ddConfig.name,
      ddColor: ddConfig.color,
      lastVerification: lastVerificationDate.toLocaleDateString('es-AR'),
      nextVerification: nextVerificationDate.toLocaleDateString('es-AR'),
      reviewPeriod: `${ddConfig.years} año${ddConfig.years > 1 ? 's' : ''}`,
      riskLevel,
      pepCheck: status === 'completa' || status === 'en_proceso',
      sanctionsCheck: status === 'completa',
      documentsVerified: status === 'completa' ? 100 : status === 'en_proceso' ? 65 : 30,
      observations: status === 'vencida' ? 'Requiere actualización de documentación' : '',
    };
  };

  const statusConfig = {
    completa: { label: 'Completa', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle },
    pendiente: { label: 'Pendiente', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: Clock },
    vencida: { label: 'Vencida', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
    en_proceso: { label: 'En Proceso', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: RefreshCw },
  };

  const riskConfig = {
    bajo: { label: 'Bajo', color: 'bg-emerald-500' },
    medio: { label: 'Medio', color: 'bg-amber-500' },
    alto: { label: 'Alto', color: 'bg-red-500' },
  };

  // Generar historial de DD para un cliente
  const getDDHistory = (client) => {
    const riskLevel = client.riskLevel || 'medio';
    const ddConfig = ddTypes[riskLevel] || ddTypes.medio;

    // Generar DD pasadas
    const pastDD = [];
    const today = new Date();
    let currentDate = new Date(today);

    // Generar 3-5 DD pasadas según el tipo
    const numPastDD = riskLevel === 'alto' ? 5 : riskLevel === 'medio' ? 4 : 3;

    for (let i = 0; i < numPastDD; i++) {
      currentDate = new Date(currentDate);
      currentDate.setFullYear(currentDate.getFullYear() - ddConfig.years);

      pastDD.push({
        id: `past-${i}`,
        type: ddConfig.type,
        date: new Date(currentDate).toLocaleDateString('es-AR'),
        status: 'completada',
        responsable: ['María García', 'Juan Pérez', 'Ana López', 'Carlos Ruiz'][i % 4],
        resultado: i === 0 ? 'Sin observaciones' : i === 1 ? 'Actualización de documentos' : 'Sin observaciones',
        riskAtTime: riskLevel,
      });
    }

    // Generar DD futuras programadas
    const futureDD = [];
    let futureDate = new Date(today);

    // Generar 2-3 DD futuras
    const numFutureDD = riskLevel === 'alto' ? 3 : 2;

    for (let i = 0; i < numFutureDD; i++) {
      futureDate = new Date(futureDate);
      futureDate.setFullYear(futureDate.getFullYear() + ddConfig.years);

      futureDD.push({
        id: `future-${i}`,
        type: ddConfig.type,
        date: new Date(futureDate).toLocaleDateString('es-AR'),
        status: i === 0 ? 'próxima' : 'programada',
        responsable: 'Por asignar',
        resultado: '-',
        riskAtTime: riskLevel,
      });
    }

    return { pastDD, futureDD, ddConfig };
  };

  // Filtrar clientes
  const filteredClients = clients.filter(client => {
    const matchesSearch =
      (client.legalName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (client.firstName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (client.lastName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (client.cuit?.includes(searchTerm));

    const ddStatus = getDueDiligenceStatus(client);
    const matchesFilter = filterStatus === 'todos' || ddStatus === filterStatus;

    return matchesSearch && matchesFilter;
  });

  // Contadores
  const statusCounts = {
    todos: clients.length,
    completa: clients.filter(c => getDueDiligenceStatus(c) === 'completa').length,
    pendiente: clients.filter(c => getDueDiligenceStatus(c) === 'pendiente').length,
    vencida: clients.filter(c => getDueDiligenceStatus(c) === 'vencida').length,
    en_proceso: clients.filter(c => getDueDiligenceStatus(c) === 'en_proceso').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 rounded-xl bg-[#3879a3]/10 flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-[#3879a3]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Debida Diligencia</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Gestión y seguimiento de verificación de clientes
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { key: 'todos',      label: 'Total',      sub: 'clientes',        num: 'text-slate-700 dark:text-slate-200',      bg: 'bg-white dark:bg-slate-800',          border: 'border-slate-200 dark:border-slate-700',      activeBorder: 'border-[#3879a3] ring-2 ring-[#3879a3]/20', activeBg: 'bg-[#3879a3]/5 dark:bg-[#3879a3]/10' },
          { key: 'completa',   label: 'Completa',   sub: 'verificadas',     num: 'text-emerald-600 dark:text-emerald-400',  bg: 'bg-emerald-50 dark:bg-emerald-950/20', border: 'border-emerald-100 dark:border-emerald-900/30', activeBorder: 'border-emerald-500 ring-2 ring-emerald-200 dark:ring-emerald-900', activeBg: '' },
          { key: 'en_proceso', label: 'En Proceso', sub: 'en revisión',     num: 'text-blue-600 dark:text-blue-400',        bg: 'bg-blue-50 dark:bg-blue-950/20',       border: 'border-blue-100 dark:border-blue-900/30',      activeBorder: 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-900', activeBg: '' },
          { key: 'pendiente',  label: 'Pendiente',  sub: 'sin iniciar',     num: 'text-amber-600 dark:text-amber-400',      bg: 'bg-amber-50 dark:bg-amber-950/20',     border: 'border-amber-100 dark:border-amber-900/30',    activeBorder: 'border-amber-500 ring-2 ring-amber-200 dark:ring-amber-900', activeBg: '' },
          { key: 'vencida',    label: 'Vencida',    sub: 'requiere acción', num: 'text-red-600 dark:text-red-400',          bg: 'bg-red-50 dark:bg-red-950/20',         border: 'border-red-100 dark:border-red-900/30',        activeBorder: 'border-red-500 ring-2 ring-red-200 dark:ring-red-900', activeBg: '' },
        ].map(stat => (
          <button
            key={stat.key}
            onClick={() => setFilterStatus(stat.key)}
            className={`p-4 rounded-2xl border transition-all text-left hover:shadow-md ${
              filterStatus === stat.key
                ? `${stat.activeBorder} ${stat.activeBg || stat.bg}`
                : `${stat.bg} ${stat.border}`
            }`}
          >
            <p className={`text-3xl font-black tracking-tighter leading-none ${stat.num}`}>{statusCounts[stat.key]}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-1.5">{stat.label}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{stat.sub}</p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar por nombre, razón social o CUIT..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700
            bg-white dark:bg-slate-800 focus:ring-2 focus:ring-[#3879a3]/30 focus:border-[#3879a3]
            text-sm transition-all outline-none"
        />
      </div>

      {/* Clients List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        {/* Table header */}
        <div className="grid grid-cols-12 gap-2 px-5 py-3.5 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-800/50 border-b border-slate-200 dark:border-slate-700">
          <div className="col-span-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</div>
          <div className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">CUIT</div>
          <div className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Tipo DD</div>
          <div className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Estado</div>
          <div className="col-span-1 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Próxima</div>
          <div className="col-span-1 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acción</div>
        </div>

        {isLoading ? (
          <div className="py-16 text-center">
            <RefreshCw className="w-7 h-7 text-slate-300 animate-spin mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Cargando clientes...</p>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="py-16 text-center">
            <Search className="w-10 h-10 text-slate-200 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No se encontraron clientes</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredClients.map((client) => {
              const ddData = getDueDiligenceData(client);
              const status = statusConfig[ddData.status];
              const isExpanded = expandedClient === client.id;

              return (
                <div key={client.id}>
                  <div
                    className="grid grid-cols-12 gap-2 px-5 py-4 items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                    onClick={() => setExpandedClient(isExpanded ? null : client.id)}
                  >
                    {/* Cliente */}
                    <div className="col-span-4 flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                        client.clientType === 'persona_humana'
                          ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                          : 'bg-gradient-to-br from-purple-500 to-purple-600'
                      }`}>
                        {client.clientType === 'persona_humana'
                          ? <User className="w-4 h-4 text-white" />
                          : <Building2 className="w-4 h-4 text-white" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground text-sm truncate group-hover:text-[#3879a3] transition-colors">
                          {client.clientType === 'persona_humana'
                            ? `${client.lastName}, ${client.firstName}`
                            : client.legalName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {client.clientType === 'persona_humana' ? 'Persona Humana' : 'Persona Jurídica'}
                        </p>
                      </div>
                    </div>

                    {/* CUIT */}
                    <div className="col-span-2">
                      <span className="font-mono text-sm bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg text-slate-600 dark:text-slate-300 text-xs">
                        {client.cuit || '-'}
                      </span>
                    </div>

                    {/* Tipo DD */}
                    <div className="col-span-2 flex flex-col items-center gap-0.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-black ${ddData.ddColor}`}>
                        {ddData.ddType}
                      </span>
                      <span className="text-[9px] text-slate-400 font-medium">{ddData.reviewPeriod}</span>
                    </div>

                    {/* Estado */}
                    <div className="col-span-2 flex justify-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${status.color}`}>
                        <status.icon className="w-3 h-3" />
                        {status.label}
                      </span>
                    </div>

                    {/* Próxima verificación */}
                    <div className="col-span-1 text-center">
                      <span className={`text-xs font-medium ${ddData.status === 'vencida' ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}>
                        {ddData.nextVerification}
                      </span>
                    </div>

                    {/* Expand toggle */}
                    <div className="col-span-1 flex justify-end">
                      <button
                        onClick={(e) => { e.stopPropagation(); setExpandedClient(isExpanded ? null : client.id); }}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                          isExpanded
                            ? 'bg-[#3879a3] text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-[#3879a3]/10 hover:text-[#3879a3]'
                        }`}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded panel */}
                  {isExpanded && (
                    <div className="px-5 pb-5 bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800">
                      <div className="pt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Cronograma */}
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-[#3879a3]" />
                            Cronograma
                          </h4>
                          <div className="space-y-2">
                            {[
                              { label: 'Tipo', value: <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${ddData.ddColor}`}>{ddData.ddType}</span> },
                              { label: 'Período', value: ddData.reviewPeriod },
                              { label: 'Última', value: ddData.lastVerification },
                              { label: 'Próxima', value: <span className={ddData.status === 'vencida' ? 'text-red-600 font-semibold' : ''}>{ddData.nextVerification}</span> },
                            ].map((row, i) => (
                              <div key={i} className="flex items-center justify-between">
                                <span className="text-[10px] text-slate-400">{row.label}</span>
                                <span className="text-[10px] font-medium text-foreground">{row.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Acciones */}
                        <div className="md:col-span-3 bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5 text-[#3879a3]" />
                            Acciones
                          </h4>
                          <div className="flex flex-wrap gap-2.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setReviewModal({ open: true, client });
                                setReviewData({
                                  identidadVerificada: false, documentoVigente: false, fotoCoincide: false,
                                  consultaPEP: false, resultadoPEP: 'no_pep', cargoPEP: '',
                                  consultaOFAC: false, consultaONU: false, consultaUIF: false,
                                  resultadoListas: 'sin_coincidencias',
                                  actividadVerificada: false, ingresosConcuerdan: false, origenFondosVerificado: false,
                                  fuenteExterna: '', nosisConsultado: false, nosisScore: '', nosisSituacion: '',
                                  verazConsultado: false, verazScore: '', verazSituacion: '',
                                  nse: '', nseVerificado: false,
                                  riesgoInherente: client.riskLevel || 'medio',
                                  riesgoResidual: client.riskLevel || 'medio',
                                  observaciones: '', resultado: 'pendiente',
                                });
                              }}
                              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#3879a3] hover:bg-[#2d6a8a] text-white text-sm font-medium rounded-xl transition-all shadow-sm hover:shadow-md"
                            >
                              <Play className="w-4 h-4" />
                              Iniciar Debida Diligencia
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setHistoryModal({ open: true, client }); }}
                              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                            >
                              <History className="w-4 h-4" />
                              Ver Historial
                            </button>
                            <Link
                              to={`/clients/${client.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                              Ver Cliente
                            </Link>
                          </div>
                        </div>
                      </div>

                      {ddData.observations && (
                        <div className="mt-3 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                          <p className="text-sm text-amber-700 dark:text-amber-300">{ddData.observations}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Historial DD */}
      {historyModal.open && historyModal.client && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-[#3879a3] to-[#2d6a8a]">
              <div className="flex items-center gap-3">
                <History className="w-6 h-6 text-white" />
                <div>
                  <h2 className="text-lg font-semibold text-white">Historial de Debida Diligencia</h2>
                  <p className="text-sm text-white/80">
                    {historyModal.client.clientType === 'persona_humana'
                      ? `${historyModal.client.lastName}, ${historyModal.client.firstName}`
                      : historyModal.client.legalName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setHistoryModal({ open: false, client: null })}
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
              {(() => {
                const { pastDD, futureDD, ddConfig } = getDDHistory(historyModal.client);

                return (
                  <div className="space-y-6">
                    {/* Info del tipo de DD */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Tipo de Debida Diligencia</p>
                        <p className="font-semibold text-gray-900 dark:text-white">{ddConfig.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Frecuencia</p>
                        <p className="font-semibold text-gray-900 dark:text-white">Cada {ddConfig.years} año{ddConfig.years > 1 ? 's' : ''}</p>
                      </div>
                    </div>

                    {/* DD Futuras (Programadas) */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <ArrowRight className="w-4 h-4 text-[#3879a3]" />
                        Próximas Revisiones Programadas
                      </h3>
                      <div className="space-y-2">
                        {futureDD.map((dd, index) => (
                          <div
                            key={dd.id}
                            className={`flex items-center justify-between p-3 rounded-lg border ${
                              index === 0
                                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                                : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                index === 0 ? 'bg-blue-100 dark:bg-blue-800' : 'bg-gray-200 dark:bg-gray-700'
                              }`}>
                                <Calendar className={`w-5 h-5 ${index === 0 ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500'}`} />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white text-sm">{dd.date}</p>
                                <p className="text-xs text-gray-500">
                                  {index === 0 ? 'Próxima revisión' : `Programada (${index + 1}° siguiente)`}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                index === 0
                                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-300'
                                  : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                              }`}>
                                {dd.type}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* DD Pasadas (Historial) */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <History className="w-4 h-4 text-[#3879a3]" />
                        Revisiones Anteriores
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-gray-50 dark:bg-gray-800">
                              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Fecha</th>
                              <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 dark:text-gray-400">Tipo</th>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Responsable</th>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Resultado</th>
                              <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 dark:text-gray-400">Estado</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {pastDD.map((dd) => (
                              <tr key={dd.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                <td className="px-3 py-2.5">
                                  <span className="text-sm text-gray-900 dark:text-white font-medium">{dd.date}</span>
                                </td>
                                <td className="px-3 py-2.5 text-center">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                                    ddTypes[dd.riskAtTime]?.color || 'bg-gray-100 text-gray-700'
                                  }`}>
                                    {dd.type}
                                  </span>
                                </td>
                                <td className="px-3 py-2.5">
                                  <span className="text-sm text-gray-600 dark:text-gray-300">{dd.responsable}</span>
                                </td>
                                <td className="px-3 py-2.5">
                                  <span className="text-sm text-gray-600 dark:text-gray-300">{dd.resultado}</span>
                                </td>
                                <td className="px-3 py-2.5 text-center">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                    <CheckCircle className="w-3 h-3" />
                                    Completada
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end">
              <button
                onClick={() => setHistoryModal({ open: false, client: null })}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal DD */}
      {reviewModal.open && reviewModal.client && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-[#3879a3] to-[#2d6a8a]">
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-white" />
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Debida Diligencia - {ddTypes[reviewModal.client.riskLevel || 'medio']?.type}
                  </h2>
                  <p className="text-sm text-white/80">
                    {reviewModal.client.clientType === 'persona_humana'
                      ? `${reviewModal.client.lastName}, ${reviewModal.client.firstName}`
                      : reviewModal.client.legalName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReviewModal({ open: false, client: null })}
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="space-y-6">
                {/* Datos del Cliente (Pre-filled) */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                    <User className="w-4 h-4 text-[#3879a3]" />
                    Datos del Cliente
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-xs text-gray-500 flex items-center gap-1">
                        <Hash className="w-3 h-3" /> CUIT
                      </label>
                      <p className="font-mono text-sm font-medium text-gray-900 dark:text-white">
                        {reviewModal.client.cuit}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 flex items-center gap-1">
                        <User className="w-3 h-3" /> Nombre
                      </label>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {reviewModal.client.clientType === 'persona_humana'
                          ? `${reviewModal.client.firstName} ${reviewModal.client.lastName}`
                          : reviewModal.client.legalName}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 flex items-center gap-1">
                        <Mail className="w-3 h-3" /> Email
                      </label>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {reviewModal.client.email || '-'}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 flex items-center gap-1">
                        <Phone className="w-3 h-3" /> Teléfono
                      </label>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {reviewModal.client.phone || '-'}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 flex items-center gap-1">
                        <Briefcase className="w-3 h-3" /> Actividad
                      </label>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {reviewModal.client.activity || reviewModal.client.mainActivity || '-'}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> Domicilio
                      </label>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {reviewModal.client.address || '-'}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 flex items-center gap-1">
                        <Globe className="w-3 h-3" /> Nacionalidad
                      </label>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {reviewModal.client.nationality || 'Argentina'}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 flex items-center gap-1">
                        <AlertOctagon className="w-3 h-3" /> Nivel Riesgo
                      </label>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                        ddTypes[reviewModal.client.riskLevel || 'medio']?.color
                      }`}>
                        {(reviewModal.client.riskLevel || 'medio').toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                <>

                {/* Verificaciones */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Verificación de Identidad */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-[#3879a3]" />
                      Verificación de Identidad
                    </h3>
                    <div className="space-y-3">
                      {[
                        { key: 'identidadVerificada', label: 'Identidad verificada con documento' },
                        { key: 'documentoVigente', label: 'Documento vigente' },
                        { key: 'fotoCoincide', label: 'Foto coincide con el titular' },
                      ].map((item) => (
                        <label key={item.key} className="flex items-center gap-3 cursor-pointer group">
                          <button
                            type="button"
                            onClick={() => setReviewData(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                            className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                              reviewData[item.key]
                                ? 'bg-[#3879a3] text-white'
                                : 'bg-gray-200 dark:bg-gray-700 group-hover:bg-gray-300 dark:group-hover:bg-gray-600'
                            }`}
                          >
                            {reviewData[item.key] && <CheckCircle className="w-3.5 h-3.5" />}
                          </button>
                          <span className="text-sm text-gray-700 dark:text-gray-300">{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Verificación PEP */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-[#3879a3]" />
                      Verificación PEP
                    </h3>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <button
                          type="button"
                          onClick={() => setReviewData(prev => ({ ...prev, consultaPEP: !prev.consultaPEP }))}
                          className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                            reviewData.consultaPEP
                              ? 'bg-[#3879a3] text-white'
                              : 'bg-gray-200 dark:bg-gray-700 group-hover:bg-gray-300 dark:group-hover:bg-gray-600'
                          }`}
                        >
                          {reviewData.consultaPEP && <CheckCircle className="w-3.5 h-3.5" />}
                        </button>
                        <span className="text-sm text-gray-700 dark:text-gray-300">Consulta PEP realizada</span>
                      </label>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Resultado</label>
                        <select
                          value={reviewData.resultadoPEP}
                          onChange={(e) => setReviewData(prev => ({ ...prev, resultadoPEP: e.target.value }))}
                          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                        >
                          <option value="no_pep">No es PEP</option>
                          <option value="pep_nacional">PEP Nacional</option>
                          <option value="pep_extranjero">PEP Extranjero</option>
                        </select>
                      </div>
                      {reviewData.resultadoPEP !== 'no_pep' && (
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Cargo PEP</label>
                          <input
                            type="text"
                            value={reviewData.cargoPEP}
                            onChange={(e) => setReviewData(prev => ({ ...prev, cargoPEP: e.target.value }))}
                            placeholder="Ingrese el cargo..."
                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Verificación Actividad */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-[#3879a3]" />
                      Verificación de Actividad
                    </h3>
                    <div className="space-y-3">
                      {[
                        { key: 'actividadVerificada', label: 'Actividad económica verificada' },
                        { key: 'ingresosConcuerdan', label: 'Ingresos concuerdan con perfil' },
                        { key: 'origenFondosVerificado', label: 'Origen de fondos verificado' },
                      ].map((item) => (
                        <label key={item.key} className="flex items-center gap-3 cursor-pointer group">
                          <button
                            type="button"
                            onClick={() => setReviewData(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                            className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                              reviewData[item.key]
                                ? 'bg-[#3879a3] text-white'
                                : 'bg-gray-200 dark:bg-gray-700 group-hover:bg-gray-300 dark:group-hover:bg-gray-600'
                            }`}
                          >
                            {reviewData[item.key] && <CheckCircle className="w-3.5 h-3.5" />}
                          </button>
                          <span className="text-sm text-gray-700 dark:text-gray-300">{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Evaluación de Riesgo */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                    <AlertOctagon className="w-4 h-4 text-[#3879a3]" />
                    Evaluación de Riesgo
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Riesgo Inherente</label>
                      <select
                        value={reviewData.riesgoInherente}
                        onChange={(e) => setReviewData(prev => ({ ...prev, riesgoInherente: e.target.value }))}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                      >
                        <option value="bajo">Bajo</option>
                        <option value="medio">Medio</option>
                        <option value="alto">Alto</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Riesgo Residual</label>
                      <select
                        value={reviewData.riesgoResidual}
                        onChange={(e) => setReviewData(prev => ({ ...prev, riesgoResidual: e.target.value }))}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                      >
                        <option value="bajo">Bajo</option>
                        <option value="medio">Medio</option>
                        <option value="alto">Alto</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Observaciones */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#3879a3]" />
                    Observaciones
                  </h3>
                  <textarea
                    value={reviewData.observaciones}
                    onChange={(e) => setReviewData(prev => ({ ...prev, observaciones: e.target.value }))}
                    placeholder="Ingrese observaciones..."
                    rows={3}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 resize-none"
                  />
                </div>

                {/* Resultado Final */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-[#3879a3]" />
                    Resultado de la DD
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { value: 'aprobado', label: 'Aprobado', color: 'bg-[#3879a3] hover:bg-[#2d6a8a]' },
                      { value: 'requiere_info', label: 'Requiere más información', color: 'bg-amber-500 hover:bg-amber-600' },
                      { value: 'rechazado', label: 'Rechazado', color: 'bg-red-500 hover:bg-red-600' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setReviewData(prev => ({ ...prev, resultado: option.value }))}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          reviewData.resultado === option.value
                            ? `${option.color} text-white ring-2 ring-offset-2 ring-${option.color.split(' ')[0].replace('bg-', '')}`
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                </>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-between">
              <button
                onClick={() => setReviewModal({ open: false, client: null })}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
              >
                Cancelar
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    // TODO: Guardar borrador
                    console.log('Guardando borrador:', reviewData);
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Guardar Borrador
                </button>
                <button
                  onClick={() => {
                    // TODO: Finalizar revisión
                    console.log('Finalizando revisión:', reviewData);
                    setReviewModal({ open: false, client: null });
                  }}
                  className="px-4 py-2 bg-[#3879a3] text-white rounded-lg hover:bg-[#2d6a8a] transition-colors text-sm font-medium flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Finalizar DD
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DueDiligence;
