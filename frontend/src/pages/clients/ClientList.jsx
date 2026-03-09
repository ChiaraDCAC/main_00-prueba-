import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Building2,
  User,
  CheckCircle,
  XCircle,
  Edit,
  Eye,
  FileText,
  History,
  X,
  Download,
  Printer,
  Calendar,
  Shield,
  Users,
  FileCheck,
  AlertTriangle,
  Clock,
  Plus,
} from 'lucide-react';
import { clientService } from '../../services/clientService';
import { ENTITY_TYPE_LABELS } from '../../config/documentRequirements';
import { useAuthStore } from '../../context/authStore';
import { can } from '../../config/permissions';

// Modal de Historial del Cliente
const ClientHistoryModal = ({ client, onClose }) => {
  const modalRef = useRef(null);

  const handleDownloadPDF = () => {
    // Crear contenido para imprimir/descargar
    const printContent = document.getElementById('client-history-content');
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Ficha Cliente - ${client.legalName || client.lastName}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
          h1 { color: #3879a3; border-bottom: 2px solid #3879a3; padding-bottom: 10px; }
          h2 { color: #2d6285; margin-top: 30px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
          .section { margin-bottom: 20px; }
          .field { margin: 8px 0; }
          .field-label { font-weight: bold; color: #666; }
          .field-value { margin-left: 10px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
          .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
          .badge-green { background: #d1fae5; color: #065f46; }
          .badge-yellow { background: #fef3c7; color: #92400e; }
          .badge-red { background: #fee2e2; color: #991b1b; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          th, td { padding: 8px; text-align: left; border-bottom: 1px solid #eee; }
          th { background: #f5f5f5; font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>Ficha de Cliente</h1>
        <p><strong>Generado:</strong> ${new Date().toLocaleString('es-AR')}</p>
        ${printContent.innerHTML}
        <div class="footer">
          <p>Documento generado por el Sistema de Compliance - deCampoaCampo</p>
          <p>Este documento es confidencial y solo para uso interno.</p>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const getRiskColor = (level) => {
    const colors = {
      bajo: 'bg-green-100 text-green-700',
      medio: 'bg-yellow-100 text-yellow-700',
      alto: 'bg-red-100 text-red-700',
    };
    return colors[level] || 'bg-gray-100 text-gray-700';
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Datos del cliente
  const clientName = client.clientType === 'persona_humana'
    ? `${client.lastName}, ${client.firstName}`
    : client.legalName;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        ref={modalRef}
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#3879a3] to-[#4a8bb8] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <History size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold">Ficha Completa del Cliente</h2>
              <p className="text-sm text-white/80">{client.clientNumber || `CLI-${client.id?.slice(0,8)}`}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              title="Descargar PDF"
            >
              <Download size={18} />
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6" id="client-history-content">
          {/* Datos Generales */}
          <section className="mb-6">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">
              <Building2 size={18} className="text-primary" />
              Datos Generales
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Denominación / Razón Social</p>
                  <p className="text-sm font-medium text-foreground">{clientName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase">CUIT</p>
                  <p className="text-sm font-mono text-foreground">{client.cuit || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Tipo de Entidad</p>
                  <p className="text-sm text-foreground">{ENTITY_TYPE_LABELS[client.entityType] || client.entityType || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Tipo de Cliente</p>
                  <p className="text-sm text-foreground">{client.clientType === 'persona_humana' ? 'Persona Humana' : 'Persona Jurídica'}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Número de Cliente</p>
                  <p className="text-sm font-mono bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded inline-block">
                    {client.clientNumber || `CLI-${client.id?.slice(0,8)}`}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Estado</p>
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-sm">
                    <CheckCircle size={14} />
                    {client.status === 'aprobado' ? 'Aprobado' : client.status}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Fecha de Alta</p>
                  <p className="text-sm text-foreground">{formatDate(client.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Última Actualización</p>
                  <p className="text-sm text-foreground">{formatDate(client.updatedAt)}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Evaluación de Riesgo */}
          <section className="mb-6">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">
              <Shield size={18} className="text-primary" />
              Evaluación de Riesgo
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 text-center">
                <p className="text-xs text-muted-foreground uppercase mb-2">Nivel de Riesgo</p>
                <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${getRiskColor(client.riskLevel)}`}>
                  {client.riskLevel?.toUpperCase() || 'NO EVALUADO'}
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 text-center">
                <p className="text-xs text-muted-foreground uppercase mb-2">Tipo DD</p>
                <p className="text-sm font-bold text-foreground">
                  {client.riskLevel === 'bajo' ? 'DDS — Simplificada' : client.riskLevel === 'alto' ? 'DDR — Reforzada' : 'DDM — Media'}
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 text-center">
                <p className="text-xs text-muted-foreground uppercase mb-2">Fecha Evaluación</p>
                <p className="text-sm text-foreground">{formatDate(client.riskEvaluationDate) || '-'}</p>
              </div>
            </div>
          </section>

          {/* Personas Vinculadas */}
          {client.formData?.personas && client.formData.personas.length > 0 && (
            <section className="mb-6">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">
                <Users size={18} className="text-primary" />
                Personas Vinculadas ({client.formData.personas.length})
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/50">
                      <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Nombre</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Documento</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Rol</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">% Part.</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-muted-foreground">PEP</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-muted-foreground">BF</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {client.formData.personas.map((persona, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/30">
                        <td className="px-3 py-2 font-medium">{persona.apellido} {persona.nombre}</td>
                        <td className="px-3 py-2 font-mono">{persona.tipoDocumento} {persona.numeroDocumento}</td>
                        <td className="px-3 py-2">{persona.rol || '-'}</td>
                        <td className="px-3 py-2">{persona.porcentajeParticipacion ? `${persona.porcentajeParticipacion}%` : '-'}</td>
                        <td className="px-3 py-2 text-center">
                          {persona.esPEP ? (
                            <span className="text-red-600">Sí</span>
                          ) : (
                            <span className="text-green-600">No</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {persona.esBeneficiarioFinal ? (
                            <span className="text-blue-600">Sí</span>
                          ) : (
                            <span className="text-gray-400">No</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Documentación */}
          <section className="mb-6">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">
              <FileCheck size={18} className="text-primary" />
              Documentación
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {client.documents && client.documents.length > 0 ? (
                client.documents.map((doc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg"
                  >
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <FileText size={16} className="text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{doc.name || doc.documentType}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(doc.uploadedAt)}</p>
                    </div>
                    <CheckCircle size={16} className="text-green-500" />
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-center py-6 text-muted-foreground">
                  <FileText size={32} className="mx-auto mb-2 opacity-50" />
                  <p>No hay documentos registrados</p>
                </div>
              )}
            </div>
          </section>

          {/* Historial de Actividad */}
          <section className="mb-6">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">
              <Calendar size={18} className="text-primary" />
              Historial de Actividad
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-4 border-green-500">
                <CheckCircle size={16} className="text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Cliente Aprobado</p>
                  <p className="text-xs text-muted-foreground">{formatDate(client.approvedAt || client.updatedAt)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                <FileText size={16} className="text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Documentación Cargada</p>
                  <p className="text-xs text-muted-foreground">{formatDate(client.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border-l-4 border-slate-400">
                <User size={16} className="text-slate-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Cliente Registrado</p>
                  <p className="text-xs text-muted-foreground">{formatDate(client.createdAt)}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Alertas y Operaciones Inusuales */}
          {(client.alerts?.length > 0 || client.unusualOperations?.length > 0) && (
            <section className="mb-6">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">
                <AlertTriangle size={18} className="text-amber-500" />
                Alertas y Operaciones Inusuales
              </h3>
              {client.alerts?.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm font-medium text-foreground mb-2">Alertas: {client.alerts.length}</p>
                </div>
              )}
              {client.unusualOperations?.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Operaciones Inusuales: {client.unusualOperations.length}</p>
                </div>
              )}
              {!client.alerts?.length && !client.unusualOperations?.length && (
                <p className="text-sm text-muted-foreground">Sin alertas ni operaciones inusuales registradas</p>
              )}
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Última actualización: {formatDate(client.updatedAt)}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              className="btn btn-primary text-sm py-2 px-4 flex items-center gap-2"
            >
              <Download size={16} />
              Descargar PDF
            </button>
            <button
              onClick={onClose}
              className="btn btn-secondary text-sm py-2 px-4"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ClientList = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedClient, setSelectedClient] = useState(null);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'activos');

  const page = parseInt(searchParams.get('page') || '1');
  const clientType = searchParams.get('clientType') || '';
  const riskLevel = searchParams.get('riskLevel') || '';

  // Status según la pestaña activa
  const statusFilter =
    activeTab === 'pendientes' ? 'pendiente' :
    'aprobado';

  const { data, isLoading } = useQuery({
    queryKey: ['clients', { page, status: statusFilter, clientType, riskLevel, search }],
    queryFn: () => clientService.list({ page, status: statusFilter, clientType, riskLevel, search }),
  });

  // Contadores de cada pestaña (siempre activos)
  const { data: pendingCountData } = useQuery({
    queryKey: ['clients-count', 'pendiente'],
    queryFn: () => clientService.list({ page: 1, limit: 1, status: 'pendiente' }),
    enabled: activeTab !== 'pendientes',
  });
  const { data: activosCountData } = useQuery({
    queryKey: ['clients-count', 'aprobado'],
    queryFn: () => clientService.list({ page: 1, limit: 1, status: 'aprobado' }),
    enabled: activeTab !== 'activos',
  });

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ ...Object.fromEntries(searchParams), tab, page: '1' });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchParams({ ...Object.fromEntries(searchParams), search, page: '1' });
  };

  const handleFilter = (key, value) => {
    const params = Object.fromEntries(searchParams);
    if (value) {
      params[key] = value;
    } else {
      delete params[key];
    }
    params.page = '1';
    setSearchParams(params);
  };

  const clients = data?.data?.data || [];
  const pagination = data?.data?.pagination || { total: 0, totalPages: 1 };

  const getRiskBadge = (level) => {
    const badges = {
      bajo: 'badge-success',
      medio: 'badge-warning',
      alto: 'badge-danger',
    };
    return badges[level] || 'badge-info';
  };

  const pendingCount = activeTab === 'pendientes' ? pagination.total : (pendingCountData?.data?.pagination?.total || 0);
  const activeCount = activeTab === 'activos' ? pagination.total : (activosCountData?.data?.pagination?.total || 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 rounded-xl bg-[#3879a3]/10 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-[#3879a3]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gestión de Clientes</h1>
            <p className="text-muted-foreground text-sm">Administre clientes pendientes y activos</p>
          </div>
        </div>
        {can(user?.role, 'alta_usuario') && (
          <Link
            to="/clients/onboarding"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#3879a3] hover:bg-[#2d6a8a] text-white text-sm font-medium rounded-xl transition-all hover:shadow-lg hover:shadow-[#3879a3]/20"
          >
            <Plus size={18} />
            Cargar Documentación
          </Link>
        )}
      </div>

      {/* Pestañas */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => handleTabChange('pendientes')}
          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-all ${
            activeTab === 'pendientes'
              ? 'border-[#3879a3] text-[#3879a3] dark:text-[#6aadd5]'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Clock size={18} />
          Clientes Pendientes
          {pendingCount > 0 && (
            <span className="px-2 py-0.5 bg-[#3879a3]/10 dark:bg-[#3879a3]/20 text-[#3879a3] dark:text-[#6aadd5] rounded-full text-xs font-bold">
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => handleTabChange('activos')}
          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-all ${
            activeTab === 'activos'
              ? 'border-[#3879a3] text-[#3879a3] dark:text-[#6aadd5]'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <CheckCircle size={18} />
          Clientes Activos
          {activeCount > 0 && (
            <span className="px-2 py-0.5 bg-[#3879a3]/10 dark:bg-[#3879a3]/20 text-[#3879a3] dark:text-[#6aadd5] rounded-full text-xs font-bold">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              <input
                type="text"
                placeholder="Buscar por CUIT, nombre, ID..."
                className="input pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Buscar
            </button>
          </form>

          <div className="flex gap-2">
            <select
              className="input w-auto"
              value={clientType}
              onChange={(e) => handleFilter('clientType', e.target.value)}
            >
              <option value="">Todos los tipos</option>
              <option value="persona_juridica">Persona Jurídica</option>
              <option value="monotributista">Persona Humana / Monotributo</option>
            </select>

            <select
              className="input w-auto"
              value={riskLevel}
              onChange={(e) => handleFilter('riskLevel', e.target.value)}
            >
              <option value="">Todos los riesgos</option>
              <option value="bajo">Bajo</option>
              <option value="medio">Medio</option>
              <option value="alto">Alto</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Clientes */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        {/* Header de tabla */}
        <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-800/50 border-b border-slate-200 dark:border-slate-700">
          <div className="col-span-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Razón Social</div>
          <div className="col-span-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">CUIT</div>
          <div className="col-span-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {activeTab === 'pendientes' ? 'Fecha de Carga' : 'Riesgo'}
          </div>
          <div className="col-span-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Acción</div>
        </div>

        {/* Lista */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {isLoading ? (
            <div className="px-6 py-12 text-center">
              <div className="w-12 h-12 rounded-xl bg-[#3879a3]/10 flex items-center justify-center mx-auto mb-3 animate-pulse">
                <Building2 className="w-6 h-6 text-[#3879a3]" />
              </div>
              <p className="text-muted-foreground">Cargando clientes...</p>
            </div>
          ) : clients.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                {activeTab === 'pendientes' ? (
                  <Clock className="w-8 h-8 text-slate-400" />
                ) : (
                  <Building2 className="w-8 h-8 text-slate-400" />
                )}
              </div>
              <p className="text-lg font-medium text-slate-600 dark:text-slate-300">
                {activeTab === 'pendientes'
                  ? 'No hay clientes pendientes'
                  : 'No hay clientes activos'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {activeTab === 'pendientes'
                  ? 'Los clientes nuevos de DCAC aparecerán aquí para su revisión'
                  : 'Los clientes aparecerán aquí cuando su documentación sea aprobada'}
              </p>
            </div>
          ) : (
            clients.map((client) => {
              const clientName = client.clientType === 'persona_humana'
                ? `${client.lastName}, ${client.firstName}`
                : client.legalName;

              const riskConfig = {
                bajo: { label: 'BAJO', bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400', dot: 'bg-emerald-500' },
                medio: { label: 'MEDIO', bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400', dot: 'bg-amber-400' },
                alto: { label: 'ALTO', bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400', dot: 'bg-red-500' },
              };
              const risk = riskConfig[client.riskLevel] || { label: 'N/A', bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-500 dark:text-slate-500', dot: 'bg-slate-300' };

              return (
                <div
                  key={client.id}
                  className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                >
                  {/* Razón Social */}
                  <div className="col-span-5 flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-slate-100 dark:bg-slate-800 shadow-sm">
                      {client.clientType === 'persona_humana' ? (
                        <User className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                      ) : (
                        <Building2 className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate group-hover:text-[#3879a3] transition-colors">
                        {clientName || 'Sin nombre'}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-muted-foreground">
                          {client.clientType === 'persona_humana' ? 'Persona Humana' : 'Persona Jurídica'}
                        </p>
                        {activeTab === 'activos' && (
                          client.status === 'bloqueado' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                              <XCircle className="w-3.5 h-3.5" /> Bloqueado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                              <CheckCircle className="w-3.5 h-3.5" /> Activo
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  </div>

                  {/* CUIT */}
                  <div className="col-span-3">
                    <span className="font-mono text-sm bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg text-slate-700 dark:text-slate-300">
                      {client.cuit || '-'}
                    </span>
                  </div>

                  {/* Riesgo / Fecha de carga */}
                  <div className="col-span-2">
                    {activeTab === 'pendientes' ? (
                      <span className="text-sm text-muted-foreground">
                        {client.createdAt ? new Date(client.createdAt).toLocaleDateString('es-AR') : '-'}
                      </span>
                    ) : (
                      <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold ${risk.bg} ${risk.text}`}>
                        <span className={`w-2 h-2 rounded-full ${risk.dot}`}></span>
                        {risk.label}
                      </span>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="col-span-2 flex justify-end gap-2">
                    {activeTab === 'pendientes' ? (
                      can(user?.role, 'edit') ? (
                        <Link
                          to={`/clients/onboarding?clientId=${client.id}`}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-[#3879a3] hover:bg-[#2d6a8a] text-white text-sm font-medium rounded-xl transition-all hover:shadow-lg hover:shadow-[#3879a3]/20 hover:scale-[1.02] active:scale-[0.98]"
                        >
                          <Edit size={16} />
                          Continuar
                        </Link>
                      ) : (
                        <span className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-400 text-sm rounded-xl">
                          <Eye size={16} />
                          Ver
                        </span>
                      )
                    ) : (
                      <button
                        onClick={() => navigate(`/clients/${client.id}`)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#3879a3] hover:bg-[#2d6a8a] text-white text-sm font-medium rounded-xl transition-all hover:shadow-lg hover:shadow-[#3879a3]/20 hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <Eye size={16} />
                        Ver más
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <p className="text-sm text-muted-foreground">
              Mostrando {clients.length} de {pagination.total} clientes
            </p>
            <div className="flex items-center gap-2">
              <button
                className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                disabled={page <= 1}
                onClick={() => setSearchParams({ ...Object.fromEntries(searchParams), page: String(page - 1) })}
              >
                <ChevronLeft size={18} />
              </button>
              <span className="px-4 py-2 text-sm font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                {page} / {pagination.totalPages}
              </span>
              <button
                className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                disabled={page >= pagination.totalPages}
                onClick={() => setSearchParams({ ...Object.fromEntries(searchParams), page: String(page + 1) })}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Historial */}
      {selectedClient && (
        <ClientHistoryModal
          client={selectedClient}
          onClose={() => setSelectedClient(null)}
        />
      )}
    </div>
  );
};

export default ClientList;
