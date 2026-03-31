import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import {
    Search,
    ChevronLeft,
    ChevronRight,
    Building2,
    User,
    AlertTriangle,
    FileText,
    CheckCircle,
    Clock,
    Eye,
    Shield,
    Plus,
} from 'lucide-react';
import { clientService } from '../../services/clientService';
import { ENTITY_TYPE_LABELS } from '../../config/documentRequirements';

const PendingClientsList = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [search, setSearch] = useState(searchParams.get('search') || '');

    const page = parseInt(searchParams.get('page') || '1');

    const { data, isLoading } = useQuery({
        queryKey: ['clients', { page, status: 'pendiente', search }],
        queryFn: () => clientService.list({ page, status: 'pendiente', search }),
    });

    const handleSearch = (e) => {
        e.preventDefault();
        setSearchParams({ ...Object.fromEntries(searchParams), search, page: '1' });
    };

    const clients = data?.data?.data || [];
    const pagination = data?.data?.pagination || { total: 0, totalPages: 1 };

    const getDaysWaiting = (date) => {
        if (!date) return 0;
        const submitted = new Date(date);
        const now = new Date();
        return Math.ceil((now - submitted) / (1000 * 60 * 60 * 24));
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Documentación Pendiente</h1>
                    <p className="text-muted-foreground text-sm">
                        Cargue y revise la documentación antes de ingresar al cliente al sistema
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        to="/clients/onboarding"
                        className="btn btn-primary flex items-center gap-2"
                    >
                        <Plus size={18} />
                        Cargar Documentación
                    </Link>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/30 text-amber-600 rounded-lg border border-amber-200 dark:border-amber-900/30">
                        <AlertTriangle size={16} />
                        <span className="text-sm font-semibold">{pagination.total} pendientes</span>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="card">
                <form onSubmit={handleSearch} className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por CUIT, nombre..."
                            className="input pl-10"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary">
                        Buscar
                    </button>
                </form>
            </div>

            {/* Table */}
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-muted">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Cliente</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">CUIT</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Tipo</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Fecha Carga</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Espera</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Alertas</th>
                                <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="7" className="px-4 py-8 text-center text-muted-foreground">
                                        Cargando...
                                    </td>
                                </tr>
                            ) : clients.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-4 py-12 text-center">
                                        <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                                        <p className="font-semibold text-foreground">Sin documentación pendiente</p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Todas las solicitudes han sido revisadas
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                clients.map((client) => {
                                    const daysWaiting = getDaysWaiting(client.createdAt);
                                    const hasPEP = client.hasPEP || false;

                                    return (
                                        <tr key={client.id} className="hover:bg-muted/50">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${client.entityType === 'monotributista'
                                                        ? 'bg-blue-100 dark:bg-blue-900/30'
                                                        : 'bg-purple-100 dark:bg-purple-900/30'
                                                        }`}>
                                                        {client.entityType === 'monotributista' ? (
                                                            <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                        ) : (
                                                            <Building2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-foreground text-sm">
                                                            {client.entityType === 'monotributista'
                                                                ? `${client.lastName}, ${client.firstName}`
                                                                : client.legalName}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="font-mono text-sm">{client.cuit}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                {(() => {
                                                  const cfg = {
                                                    sa:            { label: 'SA',            cls: 'bg-[#3879a3]/10 text-[#3879a3] border-[#3879a3]/25' },
                                                    srl:           { label: 'SRL',           cls: 'bg-[#2d6a8a]/10 text-[#2d6a8a] border-[#2d6a8a]/25' },
                                                    sh:            { label: 'SH',            cls: 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600' },
                                                    sucesion:      { label: 'Sucesión',      cls: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800' },
                                                    monotributista:{ label: 'Monotrib.',     cls: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/20 dark:text-sky-300 dark:border-sky-800' },
                                                  }[client.entityType] || { label: client.entityType, cls: 'bg-slate-100 text-slate-500 border-slate-200' };
                                                  return (
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${cfg.cls}`}>
                                                      {cfg.label}
                                                    </span>
                                                  );
                                                })()}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-muted-foreground">
                                                {new Date(client.createdAt).toLocaleDateString('es-AR')}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded ${daysWaiting > 5
                                                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                    : daysWaiting > 2
                                                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                    }`}>
                                                    <Clock size={12} />
                                                    {daysWaiting}d
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                {hasPEP && (
                                                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                                        <Shield size={12} />
                                                        PEP
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-center">
                                                    <Link
                                                        to={`/clients/${client.id}/review`}
                                                        className="btn btn-primary text-sm py-1.5 px-4 flex items-center gap-2"
                                                    >
                                                        <Eye size={14} />
                                                        Revisar Docs
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                        <p className="text-sm text-muted-foreground">
                            Mostrando {clients.length} de {pagination.total}
                        </p>
                        <div className="flex gap-2">
                            <button
                                className="btn btn-secondary"
                                disabled={page <= 1}
                                onClick={() => setSearchParams({ ...Object.fromEntries(searchParams), page: String(page - 1) })}
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <span className="flex items-center px-3 text-sm">
                                {page} / {pagination.totalPages}
                            </span>
                            <button
                                className="btn btn-secondary"
                                disabled={page >= pagination.totalPages}
                                onClick={() => setSearchParams({ ...Object.fromEntries(searchParams), page: String(page + 1) })}
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Info box */}
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30 rounded-lg p-4">
                <div className="flex gap-3">
                    <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                        <p className="font-medium text-blue-900 dark:text-blue-300">Flujo de aprobación</p>
                        <p className="text-blue-700 dark:text-blue-400 mt-1">
                            <strong>1.</strong> Cargar documentación → <strong>2.</strong> Revisar y aprobar/rechazar →
                            <strong>3.</strong> Aprobación final (solo con docs aprobados).
                            Si se rechaza algún documento, el cliente deberá volver a cargarlo.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PendingClientsList;
