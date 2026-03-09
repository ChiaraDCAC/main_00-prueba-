import { useQuery } from '@tanstack/react-query';
import { riskService } from '../../services/riskService';
import { Loader2 } from 'lucide-react';

const RiskMatrix = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['riskMatrix'],
    queryFn: () => riskService.getMatrix(),
  });

  const matrix = data?.data?.data || [];

  const groupedMatrix = matrix.reduce((acc, item) => {
    if (!acc[item.factor]) {
      acc[item.factor] = [];
    }
    acc[item.factor].push(item);
    return acc;
  }, {});

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
        <h1 className="text-2xl font-bold text-gray-900">Matriz de Riesgo</h1>
        <p className="text-gray-500">Configuración de factores y puntajes de riesgo</p>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Niveles de Riesgo</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-2xl font-bold text-green-600">BAJO</p>
            <p className="text-sm text-gray-600">Puntaje &lt; 20</p>
            <p className="text-sm text-gray-500">Diligencia Simplificada</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-2xl font-bold text-yellow-600">MEDIO</p>
            <p className="text-sm text-gray-600">Puntaje 20-34</p>
            <p className="text-sm text-gray-500">Diligencia Media</p>
          </div>
          <div className="text-center p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-2xl font-bold text-red-600">ALTO</p>
            <p className="text-sm text-gray-600">Puntaje &gt;= 35</p>
            <p className="text-sm text-gray-500">Diligencia Reforzada</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Factores de Riesgo</h2>

        {Object.keys(groupedMatrix).length > 0 ? (
          <div className="space-y-6">
            {Object.entries(groupedMatrix).map(([factor, items]) => (
              <div key={factor}>
                <h3 className="font-medium text-gray-900 mb-2 capitalize">{factor.replace(/_/g, ' ')}</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm">Categoría</th>
                        <th className="px-4 py-2 text-left text-sm">Valor</th>
                        <th className="px-4 py-2 text-left text-sm">Puntaje</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr key={item.id} className="border-t">
                          <td className="px-4 py-2">{item.category}</td>
                          <td className="px-4 py-2">{item.value}</td>
                          <td className="px-4 py-2">
                            <span className={`badge ${
                              item.score >= 8 ? 'badge-danger' :
                              item.score >= 5 ? 'badge-warning' : 'badge-success'
                            }`}>
                              {item.score}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No hay factores de riesgo configurados</p>
            <p className="text-sm text-gray-400">
              Los factores por defecto se aplican automáticamente:
            </p>
            <ul className="text-sm text-gray-500 mt-2">
              <li>Tipo de cliente: Persona Humana (3), Persona Jurídica (7)</li>
              <li>Actividad: Normal (3), Alto riesgo (10)</li>
              <li>Geografía: Local (1), Extranjero (5), Alto riesgo (10)</li>
              <li>PEP: Sí (10), No (0)</li>
            </ul>
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Periodicidad de Revisión</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="font-medium">Riesgo Bajo</p>
            <p className="text-2xl font-bold text-green-600">24 meses</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="font-medium">Riesgo Medio</p>
            <p className="text-2xl font-bold text-yellow-600">12 meses</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="font-medium">Riesgo Alto</p>
            <p className="text-2xl font-bold text-red-600">6 meses</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskMatrix;
