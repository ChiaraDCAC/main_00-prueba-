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
          <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
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
            className="mt-4 px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-700 transition-colors"
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

  // riskConfig \u2014 cada nivel trae las clases Tailwind (DCaC tokens) ya armadas
  // para que no haya class names construidos din\u00e1micamente (Tailwind JIT no los detecta).
  const riskConfig = {
    bajo:  {
      label: 'BAJO',  icon: TrendingDown, ddType: 'DDS', ddName: 'Simplificada',
      bg:   'bg-positive-50 dark:bg-positive-900/20',
      border:'border-positive-200 dark:border-positive-800',
      text: 'text-positive-700 dark:text-positive-400',
      iconText: 'text-positive-600 dark:text-positive-400',
    },
    medio: {
      label: 'MEDIO', icon: Minus,        ddType: 'DDM', ddName: 'Media',
      bg:   'bg-warning-50 dark:bg-warning-900/20',
      border:'border-warning-200 dark:border-warning-800',
      text: 'text-warning-700 dark:text-warning-400',
      iconText: 'text-warning-600 dark:text-warning-400',
    },
    alto:  {
      label: 'ALTO',  icon: TrendingUp,   ddType: 'DDR', ddName: 'Reforzada',
      bg:   'bg-negative-50 dark:bg-negative-900/20',
      border:'border-negative-200 dark:border-negative-800',
      text: 'text-negative-700 dark:text-negative-400',
      iconText: 'text-negative-600 dark:text-negative-400',
    },
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
          className="flex items-center gap-1.5 text-xs font-medium text-positive-600 hover:text-positive-700 transition-colors">
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
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-brand-600 transition-colors ml-auto">
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
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${hasDoc || isPepResolved ? 'bg-positive-100 dark:bg-positive-900/30' : 'bg-slate-100 dark:bg-slate-700'}`}>
            {hasDoc || isPepResolved ? (
              <FileCheck className="w-4 h-4 text-positive-600" />
            ) : (
              <FileX className="w-4 h-4 text-slate-400" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{label}</p>
            {pepStatus !== undefined && pepStatus !== null && (
              <p className={`text-xs ${pepStatus ? 'text-warning-600' : 'text-positive-600'}`}>
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
            <Eye className="w-4 h-4 text-brand-600" />
          </a>
        ) : (
          <span className="text-xs text-muted-foreground">Sin archivo</span>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header \u2014 sin gradiente, color de marca s\u00f3lido (DCaC) */}
      <div className="bg-brand text-white">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => navigate('/clients')}
              className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="text-white/70 text-sm">Clientes Activos</span>
            <ChevronRight className="w-4 h-4 text-white/50" />
            <span className="text-sm">Detalle</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-5">
              {/* Avatar \u2014 sin gradiente, fondo translucido sobre brand */}
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center bg-white/15 border border-white/30">
                {isHuman ? (
                  <User className="w-10 h-10 text-white" />
                ) : (
                  <Building2 className="w-10 h-10 text-white" />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold">{clientName || 'Sin nombre'}</h1>
                <div className="flex items-center gap-3 mt-2">
                  <span className="font-mono text-white/90 bg-white/15 px-3 py-1 rounded-lg text-sm">
                    {client.cuit || '-'}
                  </span>
                  {client.clientNumber && (
                    <span className="bg-white/15 text-white px-3 py-1 rounded-lg text-sm font-medium border border-white/25">
                      {client.clientNumber}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Status & Risk Badges \u2014 estados sem\u00e1nticos */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/15 border border-white/25">
                <StatusIcon className="w-5 h-5" />
                <span className="font-semibold">{status.label}</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/15 border border-white/25">
                <RiskIcon className="w-5 h-5" />
                <span className="font-semibold">Riesgo {risk.label}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats \u2014 4 stat cards informativas. Sin color decorativo: todas neutrales,
           el icono va en brand subtle ya que es info de marca, no estado funcional. */}
      <div className="max-w-7xl mx-auto px-6 -mt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-brand-600 dark:text-brand-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase">Tipo Entidad</p>
                <p className="font-semibold text-foreground">{ENTITY_TYPE_LABELS[client.legalForm] || client.legalForm || '-'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center">
                <Shield className="w-6 h-6 text-brand-600 dark:text-brand-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase">Debida Diligencia</p>
                <p className="font-semibold text-foreground">{risk.ddType} - {risk.ddName}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-brand-600 dark:text-brand-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase">Fecha Solicitud Alta</p>
                <p className="font-semibold text-foreground">{formatDate(client.solicitudAt || client.createdAt)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center">
                <Users className="w-6 h-6 text-brand-600 dark:text-brand-400" />
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
                      ? 'bg-brand text-white'
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
                  <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-brand-600" />
                  </div>
                  Datos Identificatorios
                  {moduleActions('identificatorios', {
                    legalName: client.legalName,
                    firstName: client.firstName,
                    lastName: client.lastName,
                    cuit: client.cuit,
                    email: client.email,
                    phone: client.phone,
                  }, () => {
                    clientService.update(id, editBuf)
                      .then(() => queryClient.invalidateQueries({ queryKey: ['client', id] }));
                    toast.success('Datos identificatorios guardados');
                  })}
                </h3>
                {editingModule === 'identificatorios' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(isHuman
                      ? [
                          { key: 'lastName', label: 'Apellido' },
                          { key: 'firstName', label: 'Nombre' },
                          { key: 'cuit', label: 'CUIT / CUIL', mono: true },
                          { key: 'email', label: 'Email', type: 'email' },
                          { key: 'phone', label: 'Teléfono' },
                        ]
                      : [
                          { key: 'legalName', label: 'Razón Social' },
                          { key: 'cuit', label: 'CUIT', mono: true },
                          { key: 'email', label: 'Email', type: 'email' },
                          { key: 'phone', label: 'Teléfono' },
                        ]
                    ).map(({ key, label, type, mono }) => (
                      <div key={key} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-1">{label}</label>
                        <input type={type || 'text'} value={editBuf[key] || ''}
                          onChange={e => setEditBuf(prev => ({ ...prev, [key]: e.target.value }))}
                          className={`w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:ring-2 focus:ring-brand-300 focus:border-brand ${mono ? 'font-mono' : ''}`} />
                      </div>
                    ))}
                    {/* Campos derivados, no editables */}
                    <div className="flex items-start gap-3 p-4 bg-slate-100 dark:bg-slate-800/40 rounded-xl opacity-70">
                      <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm">
                        <User className="w-5 h-5 text-brand-600" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase">Tipo Cliente</p>
                        <p className="font-medium text-foreground">{isHuman ? 'Persona Humana' : 'Persona Jurídica'}</p>
                        <p className="text-[10px] text-muted-foreground italic mt-0.5">No editable</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 bg-slate-100 dark:bg-slate-800/40 rounded-xl opacity-70">
                      <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm">
                        <Briefcase className="w-5 h-5 text-brand-600" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase">Tipo Entidad</p>
                        <p className="font-medium text-foreground">{ENTITY_TYPE_LABELS[client.legalForm] || client.legalForm}</p>
                        <p className="text-[10px] text-muted-foreground italic mt-0.5">No editable</p>
                      </div>
                    </div>
                  </div>
                ) : (
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
                          <item.icon className="w-5 h-5 text-brand-600" />
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
                )}
              </section>

              {/* Domicilio */}
              <section>
                <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-brand-600" />
                  </div>
                  Domicilio Legal
                  {moduleActions('domicilio', { domicilioLegal: domicilioLegal || '' }, () => {
                    const nuevo = (editBuf.domicilioLegal || '').trim();
                    clientService.update(id, {
                      datosSociedad: { ...datosSociedad, domicilioLegal: nuevo },
                    })
                      .then(() => queryClient.invalidateQueries({ queryKey: ['client', id] }));
                    toast.success('Domicilio guardado');
                  })}
                </h3>
                {editingModule === 'domicilio' ? (
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                    <textarea
                      value={editBuf.domicilioLegal || ''}
                      onChange={e => setEditBuf(prev => ({ ...prev, domicilioLegal: e.target.value }))}
                      rows={2}
                      placeholder="Ingresá el domicilio legal completo..."
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:ring-2 focus:ring-brand-300 focus:border-brand"
                    />
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                    <p className="font-medium text-foreground">
                      {domicilioLegal || 'No especificado'}
                    </p>
                  </div>
                )}
              </section>

              {/* Datos de la Entidad — from onboarding */}
              {!isHuman && (
                <section>
                  <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-brand-600" />
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
                            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:ring-2 focus:ring-brand-300 focus:border-brand" />
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

              {/* PEP Warning \u2014 estado de notice (riesgo de cumplimiento, no error) */}
              {client.isPep && (
                <section className="bg-notice-50 dark:bg-notice-900/20 border border-notice-200 dark:border-notice-800 rounded-2xl p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-notice-100 dark:bg-notice-900/40 flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-notice-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-notice-800 dark:text-notice-300">Persona Expuesta Pol\u00edticamente (PEP)</h4>
                      <p className="text-notice-700 dark:text-notice-400 mt-1">
                        <strong>Cargo:</strong> {client.pepPosition || 'No especificado'}
                      </p>
                      {client.pepRelationship && (
                        <p className="text-notice-700 dark:text-notice-400">
                          <strong>Relaci\u00f3n:</strong> {client.pepRelationship}
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
                  {/* Summary Cards \u2014 conteos. Solo PEP tiene carga sem\u00e1ntica (riesgo regulatorio).
                       El resto son neutros, todos en brand subtle. */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-brand-50 dark:bg-brand-900/20 rounded-xl border border-brand-200 dark:border-brand-800">
                      <p className="text-2xl font-bold text-brand-700 dark:text-brand-400">{beneficiarios.length}</p>
                      <p className="text-sm text-brand-600 dark:text-brand-300">Beneficiarios Finales</p>
                    </div>
                    <div className="p-4 bg-notice-50 dark:bg-notice-900/20 rounded-xl border border-notice-200 dark:border-notice-800">
                      <p className="text-2xl font-bold text-notice-700 dark:text-notice-400">{peps.length}</p>
                      <p className="text-sm text-notice-600 dark:text-notice-300">PEPs</p>
                    </div>
                    <div className="p-4 bg-brand-50 dark:bg-brand-900/20 rounded-xl border border-brand-200 dark:border-brand-800">
                      <p className="text-2xl font-bold text-brand-700 dark:text-brand-400">{autoridades.length}</p>
                      <p className="text-sm text-brand-600 dark:text-brand-300">Autoridades</p>
                    </div>
                    <div className="p-4 bg-brand-50 dark:bg-brand-900/20 rounded-xl border border-brand-200 dark:border-brand-800">
                      <p className="text-2xl font-bold text-brand-700 dark:text-brand-400">{firmantes.length}</p>
                      <p className="text-sm text-brand-600 dark:text-brand-300">Firmantes</p>
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
                              <div className="w-12 h-12 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-700 dark:text-brand-400 font-bold">
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
                                  <span className="px-2 py-1 bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 text-xs font-semibold rounded-lg">
                                    BF {persona.porcentaje && `${persona.porcentaje}%`}
                                  </span>
                                )}
                                {persona.esPep && (
                                  <span className="px-2 py-1 bg-notice-100 dark:bg-notice-900/30 text-notice-700 dark:text-notice-400 text-xs font-semibold rounded-lg">PEP</span>
                                )}
                                {persona.esAutoridad && (
                                  <span className="px-2 py-1 bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 text-xs font-semibold rounded-lg">{persona.cargo || 'Autoridad'}</span>
                                )}
                                {persona.esFirmante && (
                                  <span className="px-2 py-1 bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 text-xs font-semibold rounded-lg">Firmante</span>
                                )}
                                {persona.esApoderado && (
                                  <span className="px-2 py-1 bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 text-xs font-semibold rounded-lg">Apoderado</span>
                                )}
                                {persona.esAccionista && (
                                  <span className="px-2 py-1 bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 text-xs font-semibold rounded-lg">
                                    Accionista{persona.porcentaje ? ` ${persona.porcentaje}%` : ''}
                                  </span>
                                )}
                                {persona.esSocioSH && (
                                  <span className="px-2 py-1 bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 text-xs font-semibold rounded-lg">
                                    Socio{persona.porcentaje ? ` ${persona.porcentaje}%` : ''}
                                  </span>
                                )}
                                {persona.esHeredero && (
                                  <span className="px-2 py-1 bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 text-xs font-semibold rounded-lg">
                                    Heredero{persona.vinculo ? ` \u00b7 ${persona.vinculo}` : ''}
                                  </span>
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
                                      <Mail className="w-4 h-4 shrink-0 text-brand-600" />
                                      <span className="truncate">{persona.email}</span>
                                    </div>
                                  )}
                                  {persona.telefono && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <Phone className="w-4 h-4 shrink-0 text-brand-600" />
                                      <span>{persona.telefono}</span>
                                    </div>
                                  )}
                                  {persona.domicilio && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <MapPin className="w-4 h-4 shrink-0 text-brand-600" />
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
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${hasFile ? 'bg-positive-100 dark:bg-positive-900/30' : hasFormData ? 'bg-brand-50' : doc.required ? 'bg-negative-50 dark:bg-negative-900/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                          <FileText className={`w-5 h-5 ${hasFile ? 'text-positive-600' : hasFormData ? 'text-brand-600' : doc.required ? 'text-negative-400' : 'text-slate-400'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{doc.name}</p>
                          {hasFile
                            ? <p className="text-xs text-positive-600 mt-0.5">{stored.name}</p>
                            : hasFormData
                              ? <p className="text-xs text-brand-600 mt-0.5">Datos cargados en onboarding</p>
                              : <p className="text-xs text-muted-foreground mt-0.5">{doc.required ? 'Obligatorio — sin archivo' : 'Opcional — sin archivo'}</p>
                          }
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {/* Ver button — shown when file or form data exists */}
                          {hasFile && (
                            <button onClick={() => setViewingDoc({ name: stored.name, dataUrl: stored.dataUrl })}
                              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-brand-300 text-brand-600 hover:bg-brand-50 transition-colors">
                              <Eye className="w-3.5 h-3.5" /> Ver
                            </button>
                          )}
                          {hasFormData && (
                            <button onClick={() => setViewingDoc({ name: doc.name, formFields })}
                              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-brand-300 text-brand-600 hover:bg-brand-50 transition-colors">
                              <Eye className="w-3.5 h-3.5" /> Ver datos
                            </button>
                          )}
                          {/* Upload button — always shown */}
                          <label className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg cursor-pointer transition-colors border
                            border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400
                            hover:border-brand hover:text-brand-600 hover:bg-brand-50">
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
                <div className={`p-6 rounded-2xl border text-center ${risk.bg} ${risk.border}`}>
                  <RiskIcon className={`w-10 h-10 mx-auto mb-3 ${risk.iconText}`} />
                  <p className={`text-3xl font-bold ${risk.text}`}>{risk.label}</p>
                  <p className="text-sm text-muted-foreground">Nivel de Riesgo</p>
                </div>
                <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-center">
                  <Shield className="w-10 h-10 mx-auto mb-3 text-brand-600" />
                  <p className="text-3xl font-bold text-foreground">{risk.ddType}</p>
                  <p className="text-sm text-muted-foreground">DD {risk.ddName}</p>
                </div>
              </div>

              {/* NSE + Ventas + Edit */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-brand-600 dark:text-brand-400" />
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
                        className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:ring-2 focus:ring-brand-300 focus:border-brand">
                        <option value="">Seleccione...</option>
                        <option value="bajo">Bajo</option>
                        <option value="medio">Medio</option>
                        <option value="alto">Alto</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-1">NSE</label>
                      <select value={editBuf.nseNivel || ''} onChange={e => setEditBuf(prev => ({ ...prev, nseNivel: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:ring-2 focus:ring-brand-300 focus:border-brand">
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
                        className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:ring-2 focus:ring-brand-300 focus:border-brand" />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-1">Notas NSE</label>
                      <input type="text" value={editBuf.nseNotas || ''} onChange={e => setEditBuf(prev => ({ ...prev, nseNotas: e.target.value }))}
                        placeholder="Observaciones..."
                        className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:ring-2 focus:ring-brand-300 focus:border-brand" />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-5 rounded-2xl bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 text-center">
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">NSE</p>
                      <p className="text-3xl font-bold text-brand-700 dark:text-brand-400">{dd.nseNivel || '-'}</p>
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
                  <Calendar className="w-5 h-5 text-brand-600" />
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
                  <div className="w-11 h-11 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
                    <UserCheck className="w-5 h-5 text-brand-600" />
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
                    ? 'bg-positive-50 dark:bg-positive-900/20 border-positive-200 dark:border-positive-800'
                    : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700'
                }`}>
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                    client.status === 'aprobado'
                      ? 'bg-positive-100 dark:bg-positive-900/40'
                      : 'bg-slate-100 dark:bg-slate-800'
                  }`}>
                               <CheckCircle className={`w-5 h-5 ${client.status === 'aprobado' ? 'text-positive-600' : 'text-slate-400'}`} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fecha Alta</p>
                    {client.status === 'aprobado' ? (
                      <p className="text-base font-bold text-positive-700 dark:text-positive-400 mt-0.5">
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
