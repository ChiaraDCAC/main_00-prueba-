import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  ArrowLeft, Save, AlertTriangle, User, Calendar, DollarSign,
  FileText, Tag, Building, Search, X, Plus, Info, Shield
} from 'lucide-react';
import { unusualOperationService } from '../../services/unusualOperationService';
import { clientService } from '../../services/clientService';

// Tipos de operación según UIF
const OPERATION_TYPES = [
  { value: 'transferencia', label: 'Transferencia Bancaria' },
  { value: 'transferencia_internacional', label: 'Transferencia Internacional' },
  { value: 'deposito_efectivo', label: 'Depósito en Efectivo' },
  { value: 'retiro_efectivo', label: 'Retiro en Efectivo' },
  { value: 'cambio_divisas', label: 'Cambio de Divisas' },
  { value: 'compra_valores', label: 'Compra de Valores/Títulos' },
  { value: 'venta_valores', label: 'Venta de Valores/Títulos' },
  { value: 'pago_terceros', label: 'Pago a Terceros' },
  { value: 'cobro_terceros', label: 'Cobro de Terceros' },
  { value: 'prestamo', label: 'Préstamo' },
  { value: 'inversion', label: 'Inversión' },
  { value: 'otro', label: 'Otro' },
];

// Indicadores de inusualidad según normativa UIF/BCRA
const UNUSUAL_INDICATORS = [
  { value: 'monto_alto', label: 'Monto inusualmente alto', category: 'monto' },
  { value: 'monto_bajo_umbral', label: 'Monto justo por debajo del umbral de reporte', category: 'monto' },
  { value: 'fraccionamiento', label: 'Fraccionamiento de operaciones (structuring)', category: 'patron' },
  { value: 'frecuencia_inusual', label: 'Frecuencia inusual de operaciones', category: 'patron' },
  { value: 'sin_justificacion', label: 'Sin justificación económica aparente', category: 'documentacion' },
  { value: 'sin_documentacion', label: 'Falta de documentación respaldatoria', category: 'documentacion' },
  { value: 'inconsistencia_perfil', label: 'Inconsistente con perfil del cliente', category: 'perfil' },
  { value: 'perfil_transaccional', label: 'Supera perfil transaccional declarado', category: 'perfil' },
  { value: 'cambio_comportamiento', label: 'Cambio abrupto de comportamiento', category: 'perfil' },
  { value: 'efectivo', label: 'Uso intensivo de efectivo', category: 'medio' },
  { value: 'pais_riesgo', label: 'Vinculación con país de alto riesgo', category: 'geografico' },
  { value: 'terceros_desconocidos', label: 'Operaciones con terceros desconocidos', category: 'contraparte' },
  { value: 'pep_vinculado', label: 'Vinculación con PEP', category: 'contraparte' },
  { value: 'empresa_fantasma', label: 'Posible empresa fantasma/shell company', category: 'contraparte' },
  { value: 'urgencia_injustificada', label: 'Urgencia injustificada', category: 'comportamiento' },
  { value: 'reticencia_info', label: 'Reticencia a brindar información', category: 'comportamiento' },
  { value: 'datos_falsos', label: 'Posibles datos falsos o inconsistentes', category: 'documentacion' },
  { value: 'alerta_lista', label: 'Coincidencia con listas de control', category: 'screening' },
];

const CURRENCIES = [
  { value: 'ARS', label: 'Peso Argentino (ARS)' },
  { value: 'USD', label: 'Dólar Estadounidense (USD)' },
  { value: 'EUR', label: 'Euro (EUR)' },
  { value: 'BRL', label: 'Real Brasileño (BRL)' },
];

const UnusualOperationForm = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showClientSearch, setShowClientSearch] = useState(false);

  const [formData, setFormData] = useState({
    clientId: '',
    client: null,
    detectionDate: new Date().toISOString().split('T')[0],
    operationType: '',
    otherOperationType: '',
    amount: '',
    currency: 'ARS',
    description: '',
    unusualIndicators: [],
    sourceOfDetection: 'monitoreo_interno',
    additionalNotes: '',
  });

  const [errors, setErrors] = useState({});

  // Obtener lista de clientes para búsqueda
  const { data: clientsData } = useQuery({
    queryKey: ['clients', searchTerm],
    queryFn: () => clientService.list({ search: searchTerm, limit: 10 }),
    enabled: searchTerm.length >= 2,
  });

  const clients = clientsData?.data?.data || [];

  // Mutación para crear la operación
  const createMutation = useMutation({
    mutationFn: (data) => unusualOperationService.create(data),
    onSuccess: (response) => {
      toast.success('Operación inusual registrada correctamente');
      const newId = response?.data?.data?.id;
      if (newId) {
        navigate(`/unusual-operations/${newId}`);
      } else {
        navigate('/unusual-operations');
      }
    },
    onError: () => {
      toast.error('Error al registrar la operación');
    },
  });

  const validateForm = () => {
    const newErrors = {};

    if (!formData.clientId) {
      newErrors.clientId = 'Debe seleccionar un cliente';
    }
    if (!formData.detectionDate) {
      newErrors.detectionDate = 'Debe indicar la fecha de detección';
    }
    if (!formData.operationType) {
      newErrors.operationType = 'Debe seleccionar el tipo de operación';
    }
    if (formData.operationType === 'otro' && !formData.otherOperationType.trim()) {
      newErrors.otherOperationType = 'Debe especificar el tipo de operación';
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Debe indicar el monto de la operación';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Debe describir el motivo de inusualidad';
    }
    if (formData.unusualIndicators.length === 0) {
      newErrors.unusualIndicators = 'Debe seleccionar al menos un indicador';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Por favor complete los campos requeridos');
      return;
    }

    const submitData = {
      clientId: formData.clientId,
      detectionDate: formData.detectionDate,
      operationType: formData.operationType === 'otro' ? formData.otherOperationType : formData.operationType,
      amount: parseFloat(formData.amount),
      currency: formData.currency,
      description: formData.description,
      unusualIndicators: formData.unusualIndicators,
      sourceOfDetection: formData.sourceOfDetection,
      additionalNotes: formData.additionalNotes,
    };

    createMutation.mutate(submitData);
  };

  const selectClient = (client) => {
    setFormData(prev => ({
      ...prev,
      clientId: client.id,
      client: client,
    }));
    setShowClientSearch(false);
    setSearchTerm('');
  };

  const clearClient = () => {
    setFormData(prev => ({
      ...prev,
      clientId: '',
      client: null,
    }));
  };

  const toggleIndicator = (value) => {
    setFormData(prev => ({
      ...prev,
      unusualIndicators: prev.unusualIndicators.includes(value)
        ? prev.unusualIndicators.filter(i => i !== value)
        : [...prev.unusualIndicators, value],
    }));
  };

  // Agrupar indicadores por categoría
  const groupedIndicators = UNUSUAL_INDICATORS.reduce((acc, indicator) => {
    if (!acc[indicator.category]) {
      acc[indicator.category] = [];
    }
    acc[indicator.category].push(indicator);
    return acc;
  }, {});

  const categoryLabels = {
    monto: 'Monto',
    patron: 'Patrón de Operaciones',
    documentacion: 'Documentación',
    perfil: 'Perfil del Cliente',
    medio: 'Medio de Pago',
    geografico: 'Geográfico',
    contraparte: 'Contraparte',
    comportamiento: 'Comportamiento',
    screening: 'Screening',
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/unusual-operations')} className="btn btn-secondary p-2">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Nueva Operación Inusual</h1>
          <p className="text-muted-foreground">Registro de operación para análisis según normativa UIF</p>
        </div>
      </div>

      {/* Info Box - Corporate Style */}
      <div className="relative overflow-hidden bg-blue-600 rounded-3xl p-8 shadow-xl shadow-blue-500/10 text-white">
        <div className="absolute -right-8 -top-8 opacity-10">
          <Shield size={160} />
        </div>
        <div className="relative z-10 flex items-start gap-5">
          <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
            <Info size={24} className="text-white" />
          </div>
          <div>
            <h3 className="text-lg font-black uppercase tracking-tight">Registro de Operación Inusual</h3>
            <p className="text-sm text-blue-50 mt-1 leading-relaxed max-w-2xl">
              Este proceso inicia el flujo de cumplimiento normativo. La información capturada será analizada para determinar si amerita un reporte **ROS ante la UIF**. Por favor, sea preciso con los detalles técnicos.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Sección 1: Cliente */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
          <h2 className="text-[10px] font-black text-slate-400 mb-6 uppercase tracking-[0.2em] flex items-center gap-2">
            <User size={16} className="text-sky-500" />
            Sujeto Involucrado
          </h2>

          {formData.client ? (
            <div className="bg-white rounded-2xl p-6 flex items-center justify-between border border-blue-100 shadow-xl shadow-blue-500/5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#3879a3]/10 flex items-center justify-center text-[#3879a3] font-bold text-lg">
                  {formData.client.legalName?.[0] || formData.client.firstName?.[0]}
                </div>
                <div>
                  <p className="text-lg font-black text-slate-900 leading-tight">
                    {formData.client.legalName || `${formData.client.firstName} ${formData.client.lastName}`}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono mt-1 uppercase tracking-widest">
                    ID Fiscal: {formData.client.taxId || formData.client.cuit || '-'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={clearClient}
                className="w-10 h-10 rounded-xl flex items-center justify-center border border-slate-100 text-slate-400 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-100 transition-all"
                title="Cambiar cliente"
              >
                <X size={20} />
              </button>
            </div>
          ) : (
            <div className="relative">
              <div className="relative group">
                <Search size={22} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  className={`w-full bg-slate-50 border-none py-4 pl-12 pr-4 rounded-2xl text-lg font-medium outline-none transition-all ${errors.clientId ? 'ring-4 ring-rose-500/10' : 'focus:ring-4 focus:ring-blue-500/10'
                    }`}
                  placeholder="Buscar CUIT o Razón Social..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowClientSearch(true);
                  }}
                  onFocus={() => setShowClientSearch(true)}
                />
              </div>
              {errors.clientId && (
                <p className="text-rose-500 text-xs mt-2 font-bold px-4">⚠️ {errors.clientId}</p>
              )}

              {/* Dropdown de resultados - Estilo Premium */}
              {showClientSearch && searchTerm.length >= 2 && (
                <div className="absolute z-20 w-full mt-2 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl shadow-2xl max-h-[320px] overflow-hidden flex flex-col">
                  <div className="px-4 py-2 border-b border-slate-50 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    Resultados de la búsqueda ({clients.length})
                  </div>
                  <div className="overflow-y-auto flex-1">
                    {clients.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        <User size={32} className="mx-auto mb-2 opacity-20" />
                        <p className="text-sm">No se encontraron clientes coincidentes</p>
                      </div>
                    ) : (
                      clients.map((client) => (
                        <button
                          key={client.id}
                          type="button"
                          className="w-full p-4 text-left hover:bg-primary/5 dark:hover:bg-primary/10 border-b border-slate-50 dark:border-slate-700 last:border-0 transition-all flex items-center justify-between group"
                          onClick={() => selectClient(client)}
                        >
                          <div className="min-w-0">
                            <p className="font-black text-foreground truncate group-hover:text-primary transition-colors">
                              {client.legalName || `${client.firstName} ${client.lastName}`}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono mt-0.5">
                              {client.taxId || client.cuit || '-'} • <span className="uppercase text-[10px] opacity-70">{client.entityType || client.type}</span>
                            </p>
                          </div>
                          <Plus size={18} className="text-slate-300 group-hover:text-primary transition-all group-hover:scale-125" />
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sección 2: Datos de la Operación */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
            <FileText size={20} className="text-primary" />
            Datos de la Operación
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Fecha de detección */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                <Calendar size={14} className="inline mr-1" />
                Fecha de Detección *
              </label>
              <input
                type="date"
                className={`input ${errors.detectionDate ? 'border-red-500' : ''}`}
                value={formData.detectionDate}
                onChange={(e) => setFormData(prev => ({ ...prev, detectionDate: e.target.value }))}
              />
              {errors.detectionDate && (
                <p className="text-red-500 text-xs mt-1">{errors.detectionDate}</p>
              )}
            </div>

            {/* Tipo de operación */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Tipo de Operación *
              </label>
              <select
                className={`input ${errors.operationType ? 'border-red-500' : ''}`}
                value={formData.operationType}
                onChange={(e) => setFormData(prev => ({ ...prev, operationType: e.target.value }))}
              >
                <option value="">Seleccionar...</option>
                {OPERATION_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
              {errors.operationType && (
                <p className="text-red-500 text-xs mt-1">{errors.operationType}</p>
              )}
            </div>

            {/* Campo adicional si es "otro" */}
            {formData.operationType === 'otro' && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1">
                  Especificar tipo de operación *
                </label>
                <input
                  type="text"
                  className={`input ${errors.otherOperationType ? 'border-red-500' : ''}`}
                  placeholder="Describa el tipo de operación..."
                  value={formData.otherOperationType}
                  onChange={(e) => setFormData(prev => ({ ...prev, otherOperationType: e.target.value }))}
                />
                {errors.otherOperationType && (
                  <p className="text-red-500 text-xs mt-1">{errors.otherOperationType}</p>
                )}
              </div>
            )}

            {/* Monto */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                <DollarSign size={14} className="inline mr-1" />
                Monto *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                className={`input ${errors.amount ? 'border-red-500' : ''}`}
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              />
              {errors.amount && (
                <p className="text-red-500 text-xs mt-1">{errors.amount}</p>
              )}
            </div>

            {/* Moneda */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Moneda
              </label>
              <select
                className="input"
                value={formData.currency}
                onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
              >
                {CURRENCIES.map((curr) => (
                  <option key={curr.value} value={curr.value}>{curr.label}</option>
                ))}
              </select>
            </div>

            {/* Fuente de detección */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-1">
                Fuente de Detección
              </label>
              <select
                className="input"
                value={formData.sourceOfDetection}
                onChange={(e) => setFormData(prev => ({ ...prev, sourceOfDetection: e.target.value }))}
              >
                <option value="monitoreo_interno">Monitoreo Interno</option>
                <option value="alerta_sistema">Alerta del Sistema</option>
                <option value="reporte_empleado">Reporte de Empleado</option>
                <option value="revision_periodica">Revisión Periódica</option>
                <option value="informacion_externa">Información Externa</option>
                <option value="otro">Otro</option>
              </select>
            </div>
          </div>
        </div>

        {/* Sección 3: Descripción y Motivo */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-blue-50 shadow-xl shadow-blue-500/5">
          <h2 className="text-[10px] font-black text-slate-400 mb-6 uppercase tracking-[0.2em] flex items-center gap-2">
            <AlertTriangle size={16} className="text-sky-500" />
            Hallazgos de Inusualidad
          </h2>

          <div className="space-y-4">
            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Descripción detallada del motivo de inusualidad *
              </label>
              <textarea
                className={`input min-h-[120px] ${errors.description ? 'border-red-500' : ''}`}
                placeholder="Describa por qué esta operación es considerada inusual, incluyendo todos los detalles relevantes para el análisis..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
              {errors.description && (
                <p className="text-red-500 text-xs mt-1">{errors.description}</p>
              )}
            </div>

            {/* Indicadores de inusualidad */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Tag size={14} className="inline mr-1" />
                Indicadores de Inusualidad *
              </label>
              {errors.unusualIndicators && (
                <p className="text-red-500 text-xs mb-2">{errors.unusualIndicators}</p>
              )}

              <div className="space-y-4">
                {Object.entries(groupedIndicators).map(([category, indicators]) => (
                  <div key={category}>
                    <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                      {categoryLabels[category] || category}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {indicators.map((indicator) => (
                        <button
                          key={indicator.value}
                          type="button"
                          onClick={() => toggleIndicator(indicator.value)}
                          className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all ${formData.unusualIndicators.includes(indicator.value)
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                            : 'bg-slate-100 text-slate-400 hover:bg-blue-50 hover:text-blue-600'
                            }`}
                        >
                          {indicator.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notas adicionales */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Notas adicionales (opcional)
              </label>
              <textarea
                className="input min-h-[80px]"
                placeholder="Información adicional relevante para el caso..."
                value={formData.additionalNotes}
                onChange={(e) => setFormData(prev => ({ ...prev, additionalNotes: e.target.value }))}
              />
            </div>
          </div>
        </div>

        {/* Resumen antes de enviar */}
        {formData.client && formData.amount && formData.unusualIndicators.length > 0 && (
          <div className="card bg-slate-50 dark:bg-slate-800/50 border-2 border-dashed border-slate-300 dark:border-slate-600">
            <h2 className="text-lg font-semibold mb-3 text-foreground">Resumen</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Cliente</p>
                <p className="font-medium text-foreground truncate">
                  {formData.client.legalName || `${formData.client.firstName} ${formData.client.lastName}`}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Monto</p>
                <p className="font-medium text-foreground">
                  {new Intl.NumberFormat('es-AR', { style: 'currency', currency: formData.currency }).format(formData.amount || 0)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Tipo</p>
                <p className="font-medium text-foreground">
                  {OPERATION_TYPES.find(t => t.value === formData.operationType)?.label || formData.otherOperationType || '-'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Indicadores</p>
                <p className="font-medium text-foreground">{formData.unusualIndicators.length} seleccionados</p>
              </div>
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={() => navigate('/unusual-operations')}
            className="btn btn-secondary"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn btn-primary flex items-center gap-2"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Guardando...
              </>
            ) : (
              <>
                <Save size={18} />
                Registrar Operación Inusual
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UnusualOperationForm;
