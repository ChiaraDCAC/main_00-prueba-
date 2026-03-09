import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Download, FileText, Loader2 } from 'lucide-react';
import { reportService } from '../../services/reportService';

const Reports = () => {
  const currentDate = new Date();
  const [year, setYear] = useState(currentDate.getFullYear());
  const [month, setMonth] = useState(currentDate.getMonth() + 1);

  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['reportSummary', year, month],
    queryFn: () => reportService.getSummary(year, month),
  });

  const downloadReport = async (type) => {
    try {
      let response;
      let filename;

      switch (type) {
        case 'base-padron':
          response = await reportService.generateBasePadron(year, month);
          filename = `BASE_PADRON_${year}${String(month).padStart(2, '0')}.txt`;
          break;
        case 'apartados':
          response = await reportService.generateApartados(year, month);
          filename = `APARTADOS_${year}${String(month).padStart(2, '0')}.txt`;
          break;
        default:
          return;
      }

      const blob = new Blob([response.data], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success(`Reporte ${filename} descargado`);
    } catch (error) {
      toast.error('Error al descargar el reporte');
    }
  };

  const summaryData = summary?.data?.data;

  const years = [];
  for (let y = currentDate.getFullYear(); y >= currentDate.getFullYear() - 5; y--) {
    years.push(y);
  }

  const months = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reportes Regulatorios</h1>
        <p className="text-gray-500">Generación de reportes en formato TXT</p>
      </div>

      {/* Period Selector */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Seleccionar Período</h2>
        <div className="flex gap-4">
          <div>
            <label className="label">Año</label>
            <select className="input" value={year} onChange={(e) => setYear(parseInt(e.target.value))}>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Mes</label>
            <select className="input" value={month} onChange={(e) => setMonth(parseInt(e.target.value))}>
              {months.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Resumen del Período</h2>
        {loadingSummary ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : summaryData ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{summaryData.newClients}</p>
              <p className="text-sm text-gray-500">Clientes Nuevos</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{summaryData.modifiedClients}</p>
              <p className="text-sm text-gray-500">Modificados</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">{summaryData.deactivatedClients}</p>
              <p className="text-sm text-gray-500">Dados de Baja</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">{summaryData.alerts}</p>
              <p className="text-sm text-gray-500">Alertas</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-orange-600">{summaryData.unusualOperations}</p>
              <p className="text-sm text-gray-500">OI</p>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No hay datos disponibles</p>
        )}
      </div>

      {/* Reports */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold">Base Padrón</h3>
              <p className="text-sm text-gray-500">Padrón de clientes</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Reporte mensual con todos los clientes activos, modificados y dados de baja en el período.
            Incluye datos de beneficiarios finales.
          </p>
          <button
            onClick={() => downloadReport('base-padron')}
            className="btn btn-primary w-full flex items-center justify-center gap-2"
          >
            <Download size={18} />
            Descargar TXT
          </button>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold">Apartados</h3>
              <p className="text-sm text-gray-500">Saldos y cuentas</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Reporte con cuentas de pago, saldos en cuenta a la vista, saldos invertidos en FCI
            y saldos a liquidar.
          </p>
          <button
            onClick={() => downloadReport('apartados')}
            className="btn btn-primary w-full flex items-center justify-center gap-2"
          >
            <Download size={18} />
            Descargar TXT
          </button>
        </div>

      </div>
    </div>
  );
};

export default Reports;
