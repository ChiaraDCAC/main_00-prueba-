import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { alertService } from '../../services/alertService';

const AlertList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1');
  const status = searchParams.get('status') || '';
  const severity = searchParams.get('severity') || '';

  const { data, isLoading } = useQuery({
    queryKey: ['alerts', { page, status, severity }],
    queryFn: () => alertService.list({ page, status, severity }),
  });

  const alerts = data?.data?.data || [];
  const pagination = data?.data?.pagination || { total: 0, totalPages: 1 };

  const getSeverityBadge = (sev) => {
    const badges = {
      baja: 'badge-info',
      media: 'badge-warning',
      alta: 'bg-orange-100 text-orange-800',
      critica: 'badge-danger',
    };
    return badges[sev] || 'badge-info';
  };

  const getStatusBadge = (st) => {
    const badges = {
      pendiente: 'badge-warning',
      en_revision: 'badge-info',
      cerrada: 'badge-success',
      escalada: 'badge-danger',
    };
    return badges[st] || 'badge-info';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Alertas</h1>
        <p className="text-muted-foreground">Gestión de alertas del sistema</p>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex gap-4 flex-wrap">
          <select
            className="input w-auto"
            value={status}
            onChange={(e) => setSearchParams({ ...Object.fromEntries(searchParams), status: e.target.value, page: '1' })}
          >
            <option value="">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="en_revision">En Revisión</option>
            <option value="cerrada">Cerrada</option>
            <option value="escalada">Escalada</option>
          </select>

          <select
            className="input w-auto"
            value={severity}
            onChange={(e) => setSearchParams({ ...Object.fromEntries(searchParams), severity: e.target.value, page: '1' })}
          >
            <option value="">Todas las criticidades</option>
            <option value="baja">Baja</option>
            <option value="media">Media</option>
            <option value="alta">Alta</option>
            <option value="critica">Crítica</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">ID Alerta</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Cliente</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Motivo</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Criticidad</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Estado</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-muted-foreground">Cargando...</td>
                </tr>
              ) : alerts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-muted-foreground">No hay alertas</td>
                </tr>
              ) : (
                alerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-muted/50">
                    <td className="px-4 py-3">
                      <Link to={`/alerts/${alert.id}`} className="text-primary hover:underline font-mono text-sm">
                        #{alert.id}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {alert.Client?.legalName || `${alert.Client?.firstName} ${alert.Client?.lastName}` || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">{alert.title || alert.alertType}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${getSeverityBadge(alert.severity)}`}>
                        {alert.severity === 'critica' ? 'Crítica' : alert.severity?.charAt(0).toUpperCase() + alert.severity?.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${getStatusBadge(alert.status)}`}>
                        {alert.status === 'en_revision' ? 'En Revisión' : alert.status?.charAt(0).toUpperCase() + alert.status?.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {new Date(alert.createdAt).toLocaleDateString('es-AR')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Mostrando {alerts.length} de {pagination.total} registros
            </p>
            <div className="flex gap-2">
              <button
                className="btn btn-secondary"
                disabled={page <= 1}
                onClick={() => setSearchParams({ ...Object.fromEntries(searchParams), page: String(page - 1) })}
              >
                <ChevronLeft size={20} />
              </button>
              <span className="flex items-center px-3 text-sm text-foreground">
                Página {page} de {pagination.totalPages}
              </span>
              <button
                className="btn btn-secondary"
                disabled={page >= pagination.totalPages}
                onClick={() => setSearchParams({ ...Object.fromEntries(searchParams), page: String(page + 1) })}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertList;
