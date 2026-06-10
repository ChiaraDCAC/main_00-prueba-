import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { ArrowLeft, CheckCircle, ArrowUp, Loader2, FileSearch } from 'lucide-react';
import { alertService } from '../../services/alertService';
import { unusualOperationService } from '../../services/unusualOperationService';
import { useAuthStore } from '../../context/authStore';
import { useInvestigationCaseStore } from '../../context/investigationCaseStore';
import { InvestigationCaseSection } from '../../components/investigation';
import { useState, useEffect } from 'react';

const AlertDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [resolution, setResolution] = useState('');
  const [showInvestigation, setShowInvestigation] = useState(false);
  const [investigationCaseId, setInvestigationCaseId] = useState(null);
  const { cases, fetchCases } = useInvestigationCaseStore();

  // Buscar si existe un caso de investigación para esta alerta
  useEffect(() => {
    fetchCases().then(() => {
      const existingCase = cases.find(c => c.alertId === id);
      if (existingCase) {
        setInvestigationCaseId(existingCase.id);
        setShowInvestigation(true);
      }
    });
  }, [id, cases.length]);

  const { data, isLoading } = useQuery({
    queryKey: ['alert', id],
    queryFn: () => alertService.getById(id),
  });

  const alert = data?.data?.data;

  const resolveMutation = useMutation({
    mutationFn: () => alertService.resolve(id, resolution),
    onSuccess: () => {
      toast.success('Alerta resuelta');
      queryClient.invalidateQueries(['alert', id]);
    },
  });

  const escalateMutation = useMutation({
    mutationFn: (reason) => alertService.escalate(id, reason),
    onSuccess: () => {
      toast.success('Alerta escalada');
      queryClient.invalidateQueries(['alert', id]);
    },
  });

  const createOIMutation = useMutation({
    mutationFn: () => unusualOperationService.createFromAlert(id),
    onSuccess: (data) => {
      toast.success('Operación inusual creada');
      navigate(`/unusual-operations/${data.data.data.id}`);
    },
  });

  const handleResolve = () => {
    if (!resolution.trim()) {
      toast.error('Ingrese la resolución');
      return;
    }
    resolveMutation.mutate();
  };

  const handleEscalate = () => {
    const reason = prompt('Ingrese el motivo de escalamiento:');
    if (reason) {
      escalateMutation.mutate(reason);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!alert) {
    return <div className="text-center py-12">Alerta no encontrada</div>;
  }

  const getSeverityBadge = (sev) => {
    const badges = {
      baja: 'badge-info',
      media: 'badge-warning',
      alta: 'bg-orange-100 text-orange-800',
      critica: 'badge-danger',
    };
    return badges[sev] || 'badge-info';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/alerts')} className="btn btn-secondary">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{alert.title}</h1>
          <p className="text-gray-500">Alerta #{id.slice(0, 8)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Detalle de la Alerta</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Tipo</p>
                  <p className="font-medium">{alert.alertType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Severidad</p>
                  <span className={`badge ${getSeverityBadge(alert.severity)}`}>{alert.severity}</span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Estado</p>
                  <p className="font-medium capitalize">{alert.status}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Fecha</p>
                  <p className="font-medium">{new Date(alert.createdAt).toLocaleString('es-AR')}</p>
                </div>
              </div>

              {alert.description && (
                <div>
                  <p className="text-sm text-gray-500">Descripción</p>
                  <p className="mt-1">{alert.description}</p>
                </div>
              )}

              {alert.triggerValue && (
                <div>
                  <p className="text-sm text-gray-500">Valor que disparó la alerta</p>
                  <p className="font-mono mt-1">{alert.triggerValue}</p>
                </div>
              )}
            </div>
          </div>

          {alert.status !== 'cerrada' && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Resolver Alerta</h2>
              <textarea
                className="input min-h-[120px] mb-4"
                placeholder="Ingrese la resolución o análisis realizado..."
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
              />
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={handleResolve}
                  className="btn btn-success flex items-center gap-2"
                  disabled={resolveMutation.isPending}
                >
                  <CheckCircle size={18} />
                  Resolver
                </button>
                <button
                  onClick={handleEscalate}
                  className="btn btn-danger flex items-center gap-2"
                  disabled={escalateMutation.isPending}
                >
                  <ArrowUp size={18} />
                  Escalar
                </button>
                <button
                  onClick={() => createOIMutation.mutate()}
                  className="btn btn-secondary"
                  disabled={createOIMutation.isPending}
                >
                  Crear OI
                </button>
                {!investigationCaseId && (
                  <button
                    onClick={() => setShowInvestigation(true)}
                    className="btn btn-primary flex items-center gap-2"
                  >
                    <FileSearch size={18} />
                    Iniciar Investigación
                  </button>
                )}
              </div>
            </div>
          )}

          {alert.resolution && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Resolución</h2>
              <p>{alert.resolution}</p>
              {alert.resolvedAt && (
                <p className="text-sm text-gray-500 mt-2">
                  Resuelto el {new Date(alert.resolvedAt).toLocaleString('es-AR')}
                </p>
              )}
            </div>
          )}

          {/* Sección de Caso de Investigación */}
          {showInvestigation && (
            <InvestigationCaseSection
              caseId={investigationCaseId}
              alertId={id}
              onCaseCreated={(newCase) => {
                setInvestigationCaseId(newCase.id);
                queryClient.invalidateQueries(['alert', id]);
              }}
            />
          )}
        </div>

        <div className="space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Cliente</h2>
            {alert.Client ? (
              <>
                <p className="font-medium">
                  {alert.Client.legalName || `${alert.Client.firstName} ${alert.Client.lastName}`}
                </p>
                <p className="text-sm text-gray-500 font-mono">{alert.Client.cuit}</p>
                <Link
                  to={`/clients/${alert.Client.id}`}
                  className="text-primary-600 hover:underline text-sm mt-2 inline-block"
                >
                  Ver cliente
                </Link>
              </>
            ) : (
              <p className="text-gray-500">Sin cliente asociado</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertDetail;
