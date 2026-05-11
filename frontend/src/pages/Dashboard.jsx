import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Users,
  AlertTriangle,
  FileWarning,
  Clock,
  CheckCircle,
  Eye,
  Building2,
  User,
  FileText,
  ArrowUpRight,
  Ban,
  UserPlus,
  Search,
} from 'lucide-react';
import { clientService } from '../services/clientService';
import { unusualOperationService } from '../services/unusualOperationService';

const Dashboard = () => {
  const { data: docsEnRevisionData } = useQuery({
    queryKey: ['clients', { status: 'pendiente' }],
    queryFn: () => clientService.list({ status: 'pendiente', limit: 10 }),
  });

  // Clientes que aún no completaron el alta: status === 'pendiente'.
  // (Antes filtraba por 'en_proceso' que no es un status válido del sistema,
  //  por eso este panel siempre apareciía vacío.)
  const { data: pendientesAltaData } = useQuery({
    queryKey: ['clients', { status: 'pendiente', scope: 'pendientes-alta' }],
    queryFn: () => clientService.list({ status: 'pendiente', limit: 10 }),
  });

  const { data: bloqueadosData } = useQuery({
    queryKey: ['clients', { status: 'bloqueado' }],
    queryFn: () => clientService.list({ status: 'bloqueado', limit: 10 }),
  });

  const { data: oisData } = useQuery({
    queryKey: ['unusualOperations', { status: 'pendiente' }],
    queryFn: () => unusualOperationService.list({ status: 'pendiente', limit: 10 }),
  });

  const docsEnRevision = docsEnRevisionData?.data?.data || [];
  const docsEnRevisionCount = docsEnRevisionData?.data?.pagination?.total || 0;
  const pendientesAlta = pendientesAltaData?.data?.data || [];
  const pendientesAltaCount = pendientesAltaData?.data?.pagination?.total || 0;
  const bloqueados = bloqueadosData?.data?.data || [];
  const bloqueadosCount = bloqueadosData?.data?.pagination?.total || 0;
  const operacionesInusuales = oisData?.data?.data || [];
  const operacionesInusualesCount = oisData?.data?.pagination?.total || 0;

  const exampleOI = {
    id: 'example-001',
    operationNumber: 'OI-2025-000001',
    description: 'Transferencia internacional sin justificación comercial',
    amount: 1500000,
    currency: 'ARS',
    status: 'pendiente',
    Client: { legalName: 'Distribuidora del Sur S.A.' },
  };
  const oisToShow = operacionesInusuales.length > 0 ? operacionesInusuales : [exampleOI];

  // Cada stat card lleva un "tone" semántico: brand para info neutral,
  // negative para clientes bloqueados (estado negativo), notice para
  // operaciones inusuales (alerta regulatoria que requiere atención).
  const stats = [
    { label: 'Docs en Revisión',         value: docsEnRevisionCount,            icon: FileText,      tone: 'brand'    },
    { label: 'Pendientes de Alta',       value: pendientesAltaCount,            icon: UserPlus,      tone: 'brand'    },
    { label: 'Clientes Bloqueados',      value: bloqueadosCount,                icon: Ban,           tone: 'negative' },
    { label: 'Op. Inusuales',            value: operacionesInusualesCount || 1, icon: AlertTriangle, tone: 'notice'   },
  ];

  const toneClasses = {
    brand:    { iconBg: 'bg-brand-50',    iconText: 'text-brand-600',    value: 'text-brand-700'    },
    negative: { iconBg: 'bg-negative-50', iconText: 'text-negative-600', value: 'text-negative-700' },
    notice:   { iconBg: 'bg-notice-50',   iconText: 'text-notice-600',   value: 'text-notice-700'   },
  };

  const clientRow = (client) => (
    <div key={client.id} className="flex items-center justify-between py-3 px-1">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
          {client.clientType === 'persona_humana'
            ? <User className="w-4 h-4 text-brand-600" />
            : <Building2 className="w-4 h-4 text-brand-600" />}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
            {client.clientType === 'persona_humana'
              ? `${client.lastName}, ${client.firstName}`
              : client.legalName}
          </p>
          <p className="text-xs text-slate-400 truncate">{client.cuit}</p>
        </div>
      </div>
      <slot data-id={client.id} />
    </div>
  );

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Panel de Control</h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">
            {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {stats.map((s, i) => {
          const Icon = s.icon;
          const t = toneClasses[s.tone] || toneClasses.brand;
          return (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-8 h-8 rounded-lg ${t.iconBg} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${t.iconText}`} />
                </div>
              </div>
              <p className={`text-2xl font-bold ${t.value}`}>{s.value}</p>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Documentación en Revisión */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-brand-600" />
              <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Documentación en Revisión</h2>
              <span className="text-xs font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">{docsEnRevisionCount}</span>
            </div>
            <Link to="/clients/onboarding" className="text-xs text-brand-600 hover:underline flex items-center gap-1">
              Ver todos <ArrowUpRight size={12} />
            </Link>
          </div>
          <div className="px-5 divide-y divide-slate-100 dark:divide-slate-700/60 max-h-[260px] overflow-y-auto">
            {docsEnRevision.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-400">Sin documentación pendiente</p>
              </div>
            ) : docsEnRevision.map((client) => (
              <div key={client.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
                    {client.clientType === 'persona_humana' ? <User className="w-4 h-4 text-brand-600" /> : <Building2 className="w-4 h-4 text-brand-600" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                      {client.clientType === 'persona_humana' ? `${client.lastName}, ${client.firstName}` : client.legalName}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{client.cuit}</p>
                  </div>
                </div>
                <Link to={`/clients/onboarding?clientId=${client.id}`} className="text-xs font-medium text-brand-600 hover:underline flex items-center gap-1 shrink-0 ml-3">
                  <Eye size={11} /> Revisar
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Clientes Pendientes de Alta */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <UserPlus className="w-4 h-4 text-brand-600" />
              <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Pendientes de Alta</h2>
              <span className="text-xs font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">{pendientesAltaCount}</span>
            </div>
            <Link to="/clients" className="text-xs text-brand-600 hover:underline flex items-center gap-1">
              Ver todos <ArrowUpRight size={12} />
            </Link>
          </div>
          <div className="px-5 divide-y divide-slate-100 dark:divide-slate-700/60 max-h-[260px] overflow-y-auto">
            {pendientesAlta.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-400">Sin clientes pendientes</p>
              </div>
            ) : pendientesAlta.map((client) => (
              <div key={client.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
                    {client.clientType === 'persona_humana' ? <User className="w-4 h-4 text-brand-600" /> : <Building2 className="w-4 h-4 text-brand-600" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                      {client.clientType === 'persona_humana' ? `${client.lastName}, ${client.firstName}` : client.legalName}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{client.cuit}</p>
                  </div>
                </div>
                <Link to={`/clients/onboarding?clientId=${client.id}`} className="text-xs font-medium text-brand-600 hover:underline flex items-center gap-1 shrink-0 ml-3">
                  <Eye size={11} /> Completar
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Clientes Bloqueados */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Ban className="w-4 h-4 text-negative-600" />
              <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Clientes Bloqueados</h2>
              <span className="text-xs font-semibold text-negative-700 bg-negative-50 px-2 py-0.5 rounded-full">{bloqueadosCount}</span>
            </div>
            <Link to="/clients?status=bloqueado" className="text-xs text-brand-600 hover:underline flex items-center gap-1">
              Ver todos <ArrowUpRight size={12} />
            </Link>
          </div>
          <div className="px-5 divide-y divide-slate-100 dark:divide-slate-700/60 max-h-[260px] overflow-y-auto">
            {bloqueados.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-400">Sin clientes bloqueados</p>
              </div>
            ) : bloqueados.map((client) => (
              <div key={client.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
                    <Ban className="w-4 h-4 text-brand-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                      {client.clientType === 'persona_humana' ? `${client.lastName}, ${client.firstName}` : client.legalName}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{client.blockReason || 'Motivo no especificado'}</p>
                  </div>
                </div>
                <Link to={`/clients/${client.id}`} className="text-xs font-medium text-brand-600 hover:underline flex items-center gap-1 shrink-0 ml-3">
                  <Search size={11} /> Ver
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Operaciones Inusuales */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-notice-600" />
              <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Operaciones Inusuales</h2>
              <span className="text-xs font-semibold text-notice-700 bg-notice-50 px-2 py-0.5 rounded-full">{operacionesInusualesCount || 1}</span>
            </div>
            <Link to="/unusual-operations" className="text-xs text-brand-600 hover:underline flex items-center gap-1">
              Ver todas <ArrowUpRight size={12} />
            </Link>
          </div>
          <div className="px-5 divide-y divide-slate-100 dark:divide-slate-700/60 max-h-[260px] overflow-y-auto">
            {oisToShow.map((oi) => (
              <div key={oi.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
                    <FileWarning className="w-4 h-4 text-brand-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{oi.operationNumber}</p>
                    <p className="text-xs text-slate-400 truncate">{oi.Client?.legalName || 'Cliente'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full capitalize">
                    {oi.status}
                  </span>
                  <Link to="/unusual-operations" className="text-xs font-medium text-brand-600 hover:underline flex items-center gap-1">
                    <Eye size={11} /> Ver
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
