import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  ArrowLeft,
  Building2,
  User,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  Users,
  Shield,
  History,
  Loader2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Briefcase,
  Globe,
  Clock,
  Eye,
  Download,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  BarChart3,
  UserCheck,
  FileCheck,
  AlertOctagon,
  TrendingUp,
  TrendingDown,
  Minus,
  FileX,
  Pencil,
  Save,
  X,
} from 'lucide-react';
import { clientService } from '../../services/clientService';
import { ENTITY_TYPE_LABELS, getRequiredDocuments } from '../../config/documentRequirements';
import { Upload } from 'lucide-react';

const ClientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('general');
  const [expandedPersonaIdx, setExpandedPersonaIdx] = useState(null);
  const [editingModule, setEditingModule] = useState(null); // 'general' | 'riesgo'
  const [editBuf, setEditBuf] = useState({});
  const [localDocs, setLocalDocs] = useState({}); // docs subidos desde ClientDetail
  const [viewingDoc, setViewingDoc] = useState(null); // { name, dataUrl }

  const { data, isLoading } = useQuery({
    queryKey: ['client', id],
    queryFn: () => clientService.getById(id),
  });

  const client = data?.data?.data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#3879a3]/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Loader2 className="w-8 h-8 animate-spin text-[#3879a3]" />
          </div>
          <p className="text-muted-foreground">Cargando cliente...</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-10 h-10 text-slate-400" />
          </div>
          <p className="text-lg font-medium text-slate-600">Cliente no encontrado</p>
          <button
            onClick={() => navigate('/clients')}
            className="mt-4 px-4 py-2 bg-[#3879a3] text-white rounded-lg hover:bg-[#2d6a8a] transition-colors"
          >
            Volver a la lista
          </button>
        </div>
      </div>
    );
  }

  const isHuman = client.clientType === 'persona_humana';
  const clientName = isHuman
    ? `${client.lastName}, ${client.firstName}`
    : client.legalName;

  const riskConfig = {
    bajo: { label: 'BAJO', color: 'emerald', icon: TrendingDown, ddType: 'DDS', ddName: 'Simplificada' },
    medio: { label: 'MEDIO', color: 'amber', icon: Minus, ddType: 'DDM', ddName: 'Media' },
    alto: { label: 'ALTO', color: 'red', icon: TrendingUp, ddType: 'DDR', ddName: 'Reforzada' },
  };
  const risk = riskConfig[client.riskLevel] || riskConfig.medio;
  const RiskIcon = risk.icon;

  const statusConfig = {
    aprobado: { label: 'Aprobado', color: 'emerald', icon: CheckCircle },
    pendiente: { label: 'Pendiente', color: 'amber', icon: Clock },
    rechazado: { label: 'Rechazado', color: 'red', icon: XCircle },
    baja: { label: 'Baja', color: 'slate', icon: XCircle },
  };
  const status = statusConfig[client.status] || statusConfig.pendiente;
  const StatusIcon = status.icon;

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Editar / Guardar | Cancelar helper for each module
  const moduleActions = (moduleId, initData, saveHandler) => {
    const isEditing = editingModule === moduleId;
    return isEditing ? (
      <div className="flex items-center gap-3 ml-auto">
        <button onClick={() => { saveHandler(); setEditingModule(null); }}
          className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors">
          <Save className="w-3.5 h-3.5" /> Guardar
        </button>
        <span className="text-muted-foreground text-xs">|</span>
        <button onClick={() => { setEditingModule(null); setEditBuf({}); }}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-3.5 h-3.5" /> Cancelar
        </button>
      </div>
    ) : (
      <button onClick={() => { setEditingModule(moduleId); setEditBuf({ ...initData }); }}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-[#3879a3] transition-colors ml-auto">
        <Pencil className="w-3.5 h-3.5" /> Editar
      </button>
    );
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Building2 },
    { id: 'personas', label: 'Personas', icon: Users },
    { id: 'documentos', label: 'Documentos', icon: FileText },
    { id: 'riesgo', label: 'Riesgo & DD', icon: Shield },
    { id: 'historial', label: 'Historial', icon: History },
  ];

  // Get personas — new clients store directly in client.personas; legacy in formData
  const personas = client.personas || client.formData?.personas || [];
  const pepDeclarations = client.formData?.pepDeclarations || {};
  const datosSociedad = client.datosSociedad || {};
  const dd = client.dd || {};

  // Flatten all document field values (same as onboarding review step)
  const allFormData = {};
  if (client.formData && typeof client.formData === 'object') {
    Object.values(client.formData).forEach(d => {
      if (d && typeof d === 'object') Object.assign(allFormData, d);
    });
  }
  const domicilioLegal = datosSociedad.domicilioLegal
    || allFormData.domicilioLegal
    || allFormData.srl_domicilio_legal
    || allFormData.sh_domicilio
    || [client.address, client.city, client.province, client.postalCode, client.country].filter(Boolean).join(', ')
    || null;
  const beneficiarios = personas.filter(p => p.esBeneficiarioFinal);
  const peps = personas.filter(p => p.esPep);
  const autoridades = personas.filter(p => p.esAutoridad);
  const firmantes = personas.filter(p => p.esFirmante);

  const DOC_LABELS = {
    dniFrente: 'DNI Frente',
    dniDorso: 'DNI Dorso',
    ddjjPep: 'DDJJ PEP',
    poder: 'Poder Notarial',
    constanciaCuit: 'Constancia CUIT',
  };

  const PersonaDocRow = ({ label, url, pepStatus }) => {
    const hasDoc = !!url;
    const isPepResolved = pepStatus !== undefined && pepStatus !== null;
    return (
      <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${hasDoc || isPepResolved ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-slate-100 dark:bg-slate-700'}`}>
            {hasDoc || isPepResolved ? (
              <FileCheck className="w-4 h-4 text-emerald-600" />
            ) : (
              <FileX className="w-4 h-4 text-slate-400" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{label}</p>
            {pepStatus !== undefined && pepStatus !== null && (
              <p className={`text-xs ${pepStatus ? 'text-amber-600' : 'text-emerald-600'}`}>
                {pepStatus ? 'Es PEP' : 'No es PEP'}
              </p>
            )}
          </div>
        </div>
        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <Eye className="w-4 h-4 text-[#3879a3]" />
          </a>
        ) : (
          <span className="text-xs text-muted-foreground">Sin archivo</span>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#3879a3] via-[#4a8ab5] to-[#2d6a8a] text-white">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => navigate('/clients')}
              className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="text-white/60 text-sm">Clientes Activos</span>
            <ChevronRight className="w-4 h-4 text-white/40" />
            <span className="text-sm">Detalle</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-xl ${
                isHuman
                  ? 'bg-gradient-to-br from-blue-400 to-blue-600'
                  : 'bg-gradient-to-br from-purple-400 to-purple-600'
              }`}>
                {isHuman ? (
                  <User className="w-10 h-10 text-white" />
                ) : (
                  <Building2 className="w-10 h-10 text-white" />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold">{clientName || 'Sin nombre'}</h1>
                <div className="flex items-center gap-3 mt-2">
                  <span className="font-mono text-white/80 bg-white/20 px-3 py-1 rounded-lg text-sm">
                    {client.cuit || '-'}
                  </span>
                  {client.clientNumber && (
                    <span className="bg-emerald-500/30 text-emerald-100 px-3 py-1 rounded-lg text-sm font-medium">
                      {client.clientNumber}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Status & Risk Badges */}
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-${status.color}-500/20 border border-${status.color}-400/30`}>
                <StatusIcon className="w-5 h-5" />
                <span className="font-semibold">{status.label}</span>
              </div>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-${risk.color}-500/20 border border-${risk.color}-400/30`}>
                <RiskIcon className="w-5 h-5" />
                <span className="font-semibold">Riesgo {risk.label}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="max-w-7xl mx-auto px-6 -mt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase">Tipo Entidad</p>
                <p className="font-semibold text-foreground">{ENTITY_TYPE_LABELS[client.legalForm] || client.legalForm || '-'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase">Debida Diligencia</p>
                <p className="font-semibold text-foreground">{risk.ddType} - {risk.ddName}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase">Fecha Solicitud Alta</p>
                <p className="font-semibold text-foreground">{formatDate(client.solicitudAt || client.createdAt)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Users className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase">Personas</p>
                <p className="font-semibold text-foreground">{personas.length} vinculadas</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs & Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tab Navigation */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-2 mb-6">
          <div className="flex gap-2 overflow-x-auto">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-[#3879a3] text-white shadow-lg'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <TabIcon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="p-6 space-y-8">
              {/* Datos Identificatorios */}
              <section>
                <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#3879a3]/10 flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-[#3879a3]" />
                  </div>
                  Datos Identificatorios
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { label: 'Razón Social', value: clientName, icon: Building2 },
                    { label: 'CUIT', value: client.cuit, icon: CreditCard, mono: true },
                    { label: 'Tipo Cliente', value: isHuman ? 'Persona Humana' : 'Persona Jurídica', icon: User },
                    { label: 'Tipo Entidad', value: ENTITY_TYPE_LABELS[client.legalForm] || client.legalForm, icon: Briefcase },
                    { label: 'Email', value: client.email, icon: Mail },
                    { label: 'Teléfono', value: client.phone, icon: Phone },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                      <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm">
                        <item.icon className="w-5 h-5 text-[#3879a3]" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase">{item.label}</p>
                        <p className={`font-medium text-foreground ${item.mono ? 'font-mono' : ''}`}>
                          {item.value || '-'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Domicilio */}
              <section>
                <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#3879a3]/10 flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-[#3879a3]" />
                  </div>
                  Domicilio Legal
                </h3>
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                  <p className="font-medium text-foreground">
                    {domicilioLegal || 'No especificado'}
                  </p>
                </div>
              </section>

              {/* Datos de la Entidad — from onboarding */}
              {(domicilioLegal || datosSociedad.actividadPrincipal || allFormData.actividadPrincipal || datosSociedad.capitalSocial || datosSociedad.objetoSocial || editingModule === 'general') && (
                <section>
                  <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#3879a3]/10 flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-[#3879a3]" />
                    </div>
                    Datos de la Entidad
                    {moduleActions('general', datosSociedad, () => {
                      clientService.update(id, { datosSociedad: editBuf })
                        .then(() => queryClient.invalidateQueries({ queryKey: ['client', id] }));
                      toast.success('Datos guardados');
                    })}
                  </h3>
                  {editingModule === 'general' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        { key: 'razonSocial', label: 'Razón Social' },
                        { key: 'cuit', label: 'CUIT' },
                        { key: 'domicilioLegal', label: 'Domicilio Legal' },
                        { key: 'actividadPrincipal', label: 'Actividad Principal' },
                        { key: 'capitalSocial', label: 'Capital Social' },
                        { key: 'objetoSocial', label: 'Objeto Social' },
                        { key: 'inscripcionIGJ', label: 'Inscripción IGJ' },
                        { key: 'fechaConstitucion', label: 'Fecha Constitución' },
                      ].map(({ key, label }) => (
                        <div key={key}>
                          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-1">{label}</label>
                          <input type="text" value={editBuf[key] || ''}
                            onChange={e => setEditBuf(prev => ({ ...prev, [key]: e.target.value }))}
                            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:ring-2 focus:ring-[#3879a3]/30 focus:border-[#3879a3]" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[
                        { label: 'Domicilio Legal', value: domicilioLegal },
                        { label: 'Actividad Principal', value: datosSociedad.actividadPrincipal || allFormData.actividadPrincipal || allFormData.actividad_principal },
                        { label: 'Capital Social', value: datosSociedad.capitalSocial || allFormData.capitalSocial || allFormData.capital_suscripto || allFormData.srl_capital_social },
                        { label: 'Objeto Social', value: datosSociedad.objetoSocial || allFormData.objetoSocial },
                        { label: 'Inscripción IGJ', value: datosSociedad.inscripcionIGJ || allFormData.inscripcionIGJ },
                        { label: 'Fecha Constitución', value: datosSociedad.fechaConstitucion || allFormData.fechaConstitucion || allFormData.fecha_constitucion || allFormData.srl_fecha_constitucion },
                      ].filter(item => item.value).map((item, i) => (
                        <div key={i} className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                          <div>
                            <p className="text-xs text-muted-foreground uppercase">{item.label}</p>
                            <p className="font-medium text-foreground">{item.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* PEP Warning */}
              {client.isPep && (
                <section className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-amber-800 dark:text-amber-300">Persona Expuesta Políticamente (PEP)</h4>
                      <p className="text-amber-700 dark:text-amber-400 mt-1">
                        <strong>Cargo:</strong> {client.pepPosition || 'No especificado'}
                      </p>
                      {client.pepRelationship && (
                        <p className="text-amber-700 dark:text-amber-400">
                          <strong>Relación:</strong> {client.pepRelationship}
                        </p>
                      )}
                    </div>
                  </div>
                </section>
              )}
            </div>
          )}

          {/* Personas Tab */}
          {activeTab === 'personas' && (
            <div className="p-6 space-y-6">
              {personas.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-muted-foreground">No hay personas vinculadas registradas</p>
                </div>
              ) : (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                      <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{beneficiarios.length}</p>
                      <p className="text-sm text-blue-600 dark:text-blue-300">Beneficiarios Finales</p>
                    </div>
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                      <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">{peps.length}</p>
                      <p className="text-sm text-purple-600 dark:text-purple-300">PEPs</p>
                    </div>
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                      <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{autoridades.length}</p>
                      <p className="text-sm text-amber-600 dark:text-amber-300">Autoridades</p>
                    </div>
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                      <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{firmantes.length}</p>
                      <p className="text-sm text-emerald-600 dark:text-emerald-300">Firmantes</p>
                    </div>
                  </div>

                  {/* Personas List */}
                  <div className="space-y-3">
                    {personas.map((persona, idx) => {
                      const personaKey = persona.uuid || persona.id || String(idx);
                      const pepData = pepDeclarations[personaKey];
                      const docsExtra = persona.documentos ? Object.entries(persona.documentos) : [];
                      const isExpanded = expandedPersonaIdx === idx;
                      return (
                        <div key={idx} className="bg-slate-50 dark:bg-slate-900/50 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                          {/* Header row — always visible, click to expand */}
                          <div
                            className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                            onClick={() => setExpandedPersonaIdx(isExpanded ? null : idx)}
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-[#3879a3]/20 flex items-center justify-center text-[#3879a3] font-bold">
                                {persona.apellido?.[0]}{persona.nombre?.[0]}
                              </div>
                              <div>
                                <p className="font-semibold text-foreground">{persona.apellido} {persona.nombre}</p>
                                <p className="text-sm text-muted-foreground">
                                  {persona.tipoDocumento && `${persona.tipoDocumento} `}{persona.numeroDocumento}{persona.cuit && ` • CUIT: ${persona.cuit}`}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex flex-wrap gap-2 justify-end">
                                {persona.esBeneficiarioFinal && (
                                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-semibold rounded-lg">
                                    BF {persona.porcentaje && `${persona.porcentaje}%`}
                                  </span>
                                )}
                                {persona.esPep && (
                                  <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs font-semibold rounded-lg">PEP</span>
                                )}
                                {persona.esAutoridad && (
                                  <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-semibold rounded-lg">{persona.cargo || 'Autoridad'}</span>
                                )}
                                {persona.esFirmante && (
                                  <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold rounded-lg">Firmante</span>
                                )}
                                {persona.esApoderado && (
                                  <span className="px-2 py-1 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 text-xs font-semibold rounded-lg">Apoderado</span>
                                )}
                              </div>
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-muted-foreground ml-1 shrink-0" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-muted-foreground ml-1 shrink-0" />
                              )}
                            </div>
                          </div>

                          {/* Expanded content */}
                          {isExpanded && (
                            <div className="border-t border-slate-200 dark:border-slate-700 p-4 space-y-4 bg-white dark:bg-slate-800/40">
                              {/* Contact info */}
                              {(persona.email || persona.telefono || persona.domicilio) && (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                  {persona.email && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <Mail className="w-4 h-4 shrink-0 text-[#3879a3]" />
                                      <span className="truncate">{persona.email}</span>
                                    </div>
                                  )}
                                  {persona.telefono && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <Phone className="w-4 h-4 shrink-0 text-[#3879a3]" />
                                      <span>{persona.telefono}</span>
                                    </div>
                                  )}
                                  {persona.domicilio && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <MapPin className="w-4 h-4 shrink-0 text-[#3879a3]" />
                                      <span className="truncate">{persona.domicilio}</span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Documentación */}
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase mb-3 tracking-wide">Documentación</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  <PersonaDocRow label="DNI Frente" url={persona.dniFrente} />
                                  <PersonaDocRow label="DNI Dorso" url={persona.dniDorso} />
                                  <PersonaDocRow
                                    label="DDJJ PEP"
                                    url={pepData?.documentUrl}
                                    pepStatus={pepData?.isPep}
                                  />
                                  {persona.esApoderado && (
                                    <PersonaDocRow label="Poder Notarial" url={persona.poder} />
                                  )}
                                  {docsExtra.map(([key, doc]) => (
                                    <PersonaDocRow
                                      key={key}
                                      label={DOC_LABELS[key] || key.replace(/_/g, ' ')}
                                      url={typeof doc === 'string' ? doc : doc?.url}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Documentos Tab */}
          {activeTab === 'documentos' && (() => {
            const requiredDocs = getRequiredDocuments(client.legalForm || client.clientType);
            const storedDocs = client.documents || {};
            const clientFormData = client.formData || {};
            // Include docs from formData keys too (filled via onboarding form fields)
            const formDataDocIds = Object.keys(clientFormData).filter(k =>
              clientFormData[k] && typeof clientFormData[k] === 'object' &&
              Object.values(clientFormData[k]).some(v => v)
            );
            const extraDocs = formDataDocIds
              .filter(k => !requiredDocs.find(d => d.id === k))
              .map(k => ({ id: k, name: k.replace(/_/g, ' '), required: false }));
            const allDocs = requiredDocs.length > 0
              ? requiredDocs
              : Object.keys(storedDocs).map(k => ({ id: k, name: k.replace(/_/g, ' '), required: false }));

            return (
              <div className="p-6">
                {/* Viewer modal */}
                {viewingDoc && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setViewingDoc(null)}>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden mx-4" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700">
                        <p className="font-semibold text-foreground text-sm truncate">{viewingDoc.name}</p>
                        <button onClick={() => setViewingDoc(null)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex-1 overflow-auto p-4">
                        {viewingDoc.dataUrl?.startsWith('data:image') ? (
                          <img src={viewingDoc.dataUrl} alt={viewingDoc.name} className="max-w-full mx-auto rounded-lg" />
                        ) : viewingDoc.dataUrl ? (
                          <iframe src={viewingDoc.dataUrl} title={viewingDoc.name} className="w-full h-[70vh] rounded-lg border border-slate-200" />
                        ) : viewingDoc.formFields ? (
                          <div className="space-y-3 p-2">
                            <p className="text-xs text-muted-foreground mb-4">Datos cargados durante el onboarding</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {Object.entries(viewingDoc.formFields)
                                .filter(([, v]) => v)
                                .map(([k, v]) => (
                                  <div key={k} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{k.replace(/_/g, ' ')}</p>
                                    <p className="text-sm font-medium text-foreground mt-0.5">{String(v)}</p>
                                  </div>
                                ))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-16 text-muted-foreground">
                            <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                            <p>No hay archivo disponible para visualizar</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                  {allDocs.map(doc => {
                    const stored = storedDocs[doc.id] || localDocs[doc.id];
                    const hasFile = !!(stored?.dataUrl);
                    const formFields = clientFormData[doc.id];
                    const hasFormData = !hasFile && formFields && typeof formFields === 'object' &&
                      Object.values(formFields).some(v => v);
                    const hasAnyData = hasFile || hasFormData;
                    return (
                      <div key={doc.id} className="flex items-center gap-4 px-5 py-4 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${hasFile ? 'bg-emerald-100 dark:bg-emerald-900/30' : hasFormData ? 'bg-[#3879a3]/10' : doc.required ? 'bg-red-50 dark:bg-red-900/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                          <FileText className={`w-5 h-5 ${hasFile ? 'text-emerald-600' : hasFormData ? 'text-[#3879a3]' : doc.required ? 'text-red-400' : 'text-slate-400'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{doc.name}</p>
                          {hasFile
                            ? <p className="text-xs text-emerald-600 mt-0.5">{stored.name}</p>
                            : hasFormData
                              ? <p className="text-xs text-[#3879a3] mt-0.5">Datos cargados en onboarding</p>
                              : <p className="text-xs text-muted-foreground mt-0.5">{doc.required ? 'Obligatorio — sin archivo' : 'Opcional — sin archivo'}</p>
                          }
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {/* Ver button — shown when file or form data exists */}
                          {hasFile && (
                            <button onClick={() => setViewingDoc({ name: stored.name, dataUrl: stored.dataUrl })}
                              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-[#3879a3]/30 text-[#3879a3] hover:bg-[#3879a3]/10 transition-colors">
                              <Eye className="w-3.5 h-3.5" /> Ver
                            </button>
                          )}
                          {hasFormData && (
                            <button onClick={() => setViewingDoc({ name: doc.name, formFields })}
                              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-[#3879a3]/30 text-[#3879a3] hover:bg-[#3879a3]/10 transition-colors">
                              <Eye className="w-3.5 h-3.5" /> Ver datos
                            </button>
                          )}
                          {/* Upload button — always shown */}
                          <label className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg cursor-pointer transition-colors border
                            border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400
                            hover:border-[#3879a3] hover:text-[#3879a3] hover:bg-[#3879a3]/5">
                            <Upload className="w-3.5 h-3.5" /> {hasFile ? 'Reemplazar' : 'Subir'}
                            <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png"
                              onChange={e => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const reader = new FileReader();
                                reader.onload = ev => {
                                  const docData = { name: file.name, dataUrl: ev.target.result };
                                  setLocalDocs(prev => ({ ...prev, [doc.id]: docData }));
                                  clientService.update(id, { documents: { ...storedDocs, ...localDocs, [doc.id]: docData } });
                                };
                                reader.readAsDataURL(file);
                              }} />
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Riesgo & DD Tab */}
          {activeTab === 'riesgo' && (
            <div className="p-6 space-y-6">
              {/* Risk Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-6 rounded-2xl bg-gradient-to-br from-${risk.color}-50 to-${risk.color}-100/50 dark:from-${risk.color}-900/30 dark:to-${risk.color}-900/10 border border-${risk.color}-200 dark:border-${risk.color}-800 text-center`}>
                  <RiskIcon className={`w-10 h-10 mx-auto mb-3 text-${risk.color}-600 dark:text-${risk.color}-400`} />
                  <p className={`text-3xl font-bold text-${risk.color}-700 dark:text-${risk.color}-400`}>{risk.label}</p>
                  <p className="text-sm text-muted-foreground">Nivel de Riesgo</p>
                </div>
                <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-center">
                  <Shield className="w-10 h-10 mx-auto mb-3 text-[#3879a3]" />
                  <p className="text-3xl font-bold text-foreground">{risk.ddType}</p>
                  <p className="text-sm text-muted-foreground">DD {risk.ddName}</p>
                </div>
              </div>

              {/* NSE + Ventas + Edit */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                  </div>
                  <h4 className="font-bold text-foreground">Perfil Transaccional</h4>
                  {moduleActions('riesgo', { nivelRiesgo: dd.nivelRiesgo || client.riskLevel, nseNivel: dd.nseNivel, nseNotas: dd.nseNotas, ventasEstimadasAnuales: dd.ventasEstimadasAnuales }, () => {
                    clientService.update(id, { dd: { ...dd, ...editBuf }, riskLevel: editBuf.nivelRiesgo || dd.nivelRiesgo })
                      .then(() => queryClient.invalidateQueries({ queryKey: ['client', id] }));
                    toast.success('Perfil transaccional actualizado');
                  })}
                </div>
                {editingModule === 'riesgo' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-1">Nivel de Riesgo</label>
                      <select value={editBuf.nivelRiesgo || ''} onChange={e => setEditBuf(prev => ({ ...prev, nivelRiesgo: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:ring-2 focus:ring-[#3879a3]/30 focus:border-[#3879a3]">
                        <option value="">Seleccione...</option>
                        <option value="bajo">Bajo</option>
                        <option value="medio">Medio</option>
                        <option value="alto">Alto</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-1">NSE</label>
                      <select value={editBuf.nseNivel || ''} onChange={e => setEditBuf(prev => ({ ...prev, nseNivel: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:ring-2 focus:ring-[#3879a3]/30 focus:border-[#3879a3]">
                        <option value="">Seleccione...</option>
                        <option value="ABC1">ABC1 — Alto</option>
                        <option value="C2">C2 — Medio-Alto</option>
                        <option value="C3">C3 — Medio</option>
                        <option value="D1">D1 — Medio-Bajo</option>
                        <option value="D2">D2 — Bajo</option>
                        <option value="E">E — Muy Bajo</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-1">Ventas Est. Anuales</label>
                      <input type="number" value={editBuf.ventasEstimadasAnuales || ''} onChange={e => setEditBuf(prev => ({ ...prev, ventasEstimadasAnuales: e.target.value }))}
                        placeholder="Monto en $..."
                        className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:ring-2 focus:ring-[#3879a3]/30 focus:border-[#3879a3]" />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-1">Notas NSE</label>
                      <input type="text" value={editBuf.nseNotas || ''} onChange={e => setEditBuf(prev => ({ ...prev, nseNotas: e.target.value }))}
                        placeholder="Observaciones..."
                        className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:ring-2 focus:ring-[#3879a3]/30 focus:border-[#3879a3]" />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-5 rounded-2xl bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 text-center">
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">NSE</p>
                      <p className="text-3xl font-bold text-violet-700 dark:text-violet-400">{dd.nseNivel || '-'}</p>
                      {dd.nseNotas && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{dd.nseNotas}</p>}
                    </div>
                    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-center">
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Ventas Est. Anuales</p>
                      <p className="text-2xl font-bold text-foreground">
                        {dd.ventasEstimadasAnuales ? `$${Number(dd.ventasEstimadasAnuales).toLocaleString('es-AR')}` : '-'}
                      </p>
                    </div>
                    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-center">
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Tipo DD</p>
                      <p className="text-3xl font-bold text-foreground">{risk.ddType}</p>
                      <p className="text-sm text-muted-foreground">{risk.ddName}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* DD Schedule */}
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                <h4 className="font-bold text-foreground mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#3879a3]" />
                  Cronograma de Debida Diligencia
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Última Revisión</p>
                    <p className="font-medium text-foreground">{formatDate(client.lastDDReview) || 'Sin revisiones'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Próxima Revisión</p>
                    <p className="font-medium text-foreground">{formatDate(client.nextDDReview) || 'Por programar'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Frecuencia</p>
                    <p className="font-medium text-foreground">
                      Cada {client.riskLevel === 'bajo' ? '5' : client.riskLevel === 'medio' ? '3' : '1'} año(s)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Historial Tab */}
          {activeTab === 'historial' && (
            <div className="p-6 max-w-md">
              <div className="space-y-4">
                {/* Fecha Solicitud */}
                <div className="flex items-center gap-4 p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <div className="w-11 h-11 rounded-xl bg-[#3879a3]/10 flex items-center justify-center shrink-0">
                    <UserCheck className="w-5 h-5 text-[#3879a3]" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fecha Solicitud</p>
                    <p className="text-base font-bold text-foreground mt-0.5">
                      {formatDate(client.solicitudAt || client.createdAt) || '—'}
                    </p>
                  </div>
                </div>

                {/* Fecha Alta */}
                <div className={`flex items-center gap-4 p-5 rounded-2xl border ${
                  client.status === 'aprobado'
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                    : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700'
                }`}>
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                    client.status === 'aprobado'
                      ? 'bg-emerald-100 dark:bg-emerald-900/40'
                      : 'bg-slate-100 dark:bg-slate-800'
                  }`}>
                    <CheckCircle className={`w-5 h-5 ${client.status === 'aprobado' ? 'text-emerald-600' : 'text-slate-400'}`} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fecha Alta</p>
                    {client.status === 'aprobado' ? (
                      <p className="text-base font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
                        {formatDate(client.aprobadoAt || client.updatedAt || client.createdAt)}
                      </p>
                    ) : (
                      <p className="text-sm text-slate-400 italic mt-0.5">Pendiente de aprobación</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientDetail;
