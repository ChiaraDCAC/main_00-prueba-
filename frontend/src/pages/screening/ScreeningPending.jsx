import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { screeningService } from '../../services/screeningService';
import { useState } from 'react';

const ScreeningPending = () => {
  const queryClient = useQueryClient();
  const [reviewingId, setReviewingId] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['screeningPending'],
    queryFn: () => screeningService.getPendingMatches(),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ resultId, status, notes }) => screeningService.reviewResult(resultId, status, notes),
    onSuccess: () => {
      toast.success('Resultado revisado');
      queryClient.invalidateQueries(['screeningPending']);
      setReviewingId(null);
      setReviewNotes('');
    },
  });

  const results = data?.data?.data || [];

  const handleReview = (resultId, status) => {
    reviewMutation.mutate({ resultId, status, notes: reviewNotes });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Screening Pendiente</h1>
        <p className="text-gray-500">Coincidencias de screening que requieren revisión</p>
      </div>

      {results.length === 0 ? (
        <div className="card text-center py-12">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <p className="text-xl font-medium text-gray-900">No hay coincidencias pendientes</p>
          <p className="text-gray-500">Todas las coincidencias han sido revisadas</p>
        </div>
      ) : (
        <div className="space-y-4">
          {results.map((result) => (
            <div
              key={result.id}
              className="card border-l-4 border-red-500"
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="badge badge-danger">{result.listType}</span>
                    <span className="text-sm text-gray-500">
                      {new Date(result.createdAt).toLocaleDateString('es-AR')}
                    </span>
                  </div>

                  <p className="font-medium mb-1">
                    Búsqueda: <span className="font-mono">{result.searchTerm}</span>
                  </p>

                  {result.matchScore && (
                    <p className="text-sm text-gray-600">
                      Score de coincidencia: <span className="font-bold">{result.matchScore}%</span>
                    </p>
                  )}

                  {result.matchDetails && (
                    <div className="mt-2 p-3 bg-red-50 rounded-lg">
                      <p className="text-sm font-medium text-red-800">Detalles de la coincidencia:</p>
                      <pre className="text-xs text-red-700 mt-1 overflow-x-auto">
                        {JSON.stringify(result.matchDetails, null, 2)}
                      </pre>
                    </div>
                  )}

                  <Link
                    to={`/clients/${result.clientId}`}
                    className="text-primary-600 hover:underline text-sm mt-2 inline-block"
                  >
                    Ver cliente
                  </Link>
                </div>

                <div className="lg:w-80">
                  {reviewingId === result.id ? (
                    <div className="space-y-3">
                      <textarea
                        className="input w-full"
                        placeholder="Notas de revisión..."
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReview(result.id, 'confirmado')}
                          className="btn btn-danger flex-1 flex items-center justify-center gap-1"
                          disabled={reviewMutation.isPending}
                        >
                          <CheckCircle size={16} />
                          Confirmar
                        </button>
                        <button
                          onClick={() => handleReview(result.id, 'descartado')}
                          className="btn btn-success flex-1 flex items-center justify-center gap-1"
                          disabled={reviewMutation.isPending}
                        >
                          <XCircle size={16} />
                          Descartar
                        </button>
                      </div>
                      <button
                        onClick={() => {
                          setReviewingId(null);
                          setReviewNotes('');
                        }}
                        className="btn btn-secondary w-full"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setReviewingId(result.id)}
                      className="btn btn-primary w-full"
                    >
                      Revisar
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ScreeningPending;
