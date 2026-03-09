import { useState } from 'react';
import {
  FileText,
  Plus,
  Clock,
  Send,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Calendar,
  X,
} from 'lucide-react';
import { useInvestigationCaseStore } from '../../context/investigationCaseStore';

const REQUEST_STATUS = {
  pendiente: { label: 'Pendiente', color: 'bg-gray-100 text-gray-800', icon: Clock },
  enviada: { label: 'Enviada', color: 'bg-blue-100 text-blue-800', icon: Send },
  recibida: { label: 'Recibida', color: 'bg-yellow-100 text-yellow-800', icon: FileText },
  aprobada: { label: 'Aprobada', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  rechazada: { label: 'Rechazada', color: 'bg-red-100 text-red-800', icon: XCircle },
  vencida: { label: 'Vencida', color: 'bg-orange-100 text-orange-800', icon: AlertTriangle },
};

const REQUEST_TYPES = [
  { value: 'origen_fondos', label: 'Declaración de origen de fondos' },
  { value: 'comprobante_operacion', label: 'Comprobante de operación' },
  { value: 'contrato', label: 'Contrato o acuerdo' },
  { value: 'factura', label: 'Factura o comprobante' },
  { value: 'extracto_bancario', label: 'Extracto bancario' },
  { value: 'ddjj_patrimonio', label: 'DDJJ de patrimonio' },
  { value: 'comprobante_ingresos', label: 'Comprobante de ingresos' },
  { value: 'otro', label: 'Otro documento' },
];

export default function DocumentRequestList({ caseId, requests = [], disabled }) {
  const { createDocumentRequest, updateDocumentRequest } = useInvestigationCaseStore();
  const [showModal, setShowModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const [newRequest, setNewRequest] = useState({
    requestType: '',
    description: '',
    priority: 'media',
    dueDate: '',
  });

  const [updateData, setUpdateData] = useState({
    status: '',
    sentMethod: '',
    responseNotes: '',
    reviewNotes: '',
  });

  const handleCreate = async () => {
    if (!newRequest.requestType || !newRequest.description) {
      return;
    }

    await createDocumentRequest(caseId, {
      ...newRequest,
      dueDate: newRequest.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });

    setNewRequest({
      requestType: '',
      description: '',
      priority: 'media',
      dueDate: '',
    });
    setShowModal(false);
  };

  const handleUpdate = async () => {
    if (!selectedRequest) return;

    await updateDocumentRequest(selectedRequest.id, updateData);
    setShowUpdateModal(false);
    setSelectedRequest(null);
    setUpdateData({
      status: '',
      sentMethod: '',
      responseNotes: '',
      reviewNotes: '',
    });
  };

  const openUpdateModal = (request) => {
    setSelectedRequest(request);
    setUpdateData({
      status: request.status,
      sentMethod: request.sentMethod || '',
      responseNotes: request.responseNotes || '',
      reviewNotes: request.reviewNotes || '',
    });
    setShowUpdateModal(true);
  };

  return (
    <div className="border rounded-lg">
      <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
        <h4 className="font-medium text-gray-900 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Solicitudes de Documentación
          {requests.length > 0 && (
            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-sm">
              {requests.length}
            </span>
          )}
        </h4>
        {!disabled && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            <Plus className="w-4 h-4" />
            Nueva Solicitud
          </button>
        )}
      </div>

      <div className="divide-y">
        {requests.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No hay solicitudes de documentación registradas.
          </div>
        ) : (
          requests.map((request) => {
            const StatusIcon = REQUEST_STATUS[request.status]?.icon || Clock;
            const isOverdue = request.dueDate && new Date(request.dueDate) < new Date() && request.status !== 'aprobada';

            return (
              <div
                key={request.id}
                className={`p-4 hover:bg-gray-50 cursor-pointer ${isOverdue ? 'bg-red-50' : ''}`}
                onClick={() => !disabled && openUpdateModal(request)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">
                        {REQUEST_TYPES.find(t => t.value === request.requestType)?.label || request.requestType}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${REQUEST_STATUS[request.status]?.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {REQUEST_STATUS[request.status]?.label}
                      </span>
                      {request.priority === 'alta' && (
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-800 rounded-full text-xs">
                          Prioridad Alta
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{request.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      {request.dueDate && (
                        <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
                          <Calendar className="w-3 h-3" />
                          Vence: {new Date(request.dueDate).toLocaleDateString('es-AR')}
                        </span>
                      )}
                      {request.sentAt && (
                        <span>Enviada: {new Date(request.sentAt).toLocaleDateString('es-AR')}</span>
                      )}
                      {request.receivedAt && (
                        <span>Recibida: {new Date(request.receivedAt).toLocaleDateString('es-AR')}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Nueva Solicitud */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
              <h3 className="text-lg font-semibold text-foreground">Nueva Solicitud de Documentación</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Documento *
                </label>
                <select
                  value={newRequest.requestType}
                  onChange={(e) => setNewRequest({ ...newRequest, requestType: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccione...</option>
                  {REQUEST_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción / Detalle *
                </label>
                <textarea
                  value={newRequest.description}
                  onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Describa específicamente qué documentación se requiere..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prioridad
                  </label>
                  <select
                    value={newRequest.priority}
                    onChange={(e) => setNewRequest({ ...newRequest, priority: e.target.value })}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha Límite
                  </label>
                  <input
                    type="date"
                    value={newRequest.dueDate}
                    onChange={(e) => setNewRequest({ ...newRequest, dueDate: e.target.value })}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t bg-gray-50 flex-shrink-0">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={!newRequest.requestType || !newRequest.description}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Crear Solicitud
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Actualizar Solicitud */}
      {showUpdateModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
              <h3 className="text-lg font-semibold text-foreground">Actualizar Solicitud</h3>
              <button onClick={() => setShowUpdateModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm font-medium text-gray-900">
                  {REQUEST_TYPES.find(t => t.value === selectedRequest.requestType)?.label}
                </p>
                <p className="text-sm text-gray-600 mt-1">{selectedRequest.description}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  value={updateData.status}
                  onChange={(e) => setUpdateData({ ...updateData, status: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="enviada">Enviada al cliente</option>
                  <option value="recibida">Documentación recibida</option>
                  <option value="aprobada">Aprobada</option>
                  <option value="rechazada">Rechazada</option>
                </select>
              </div>

              {updateData.status === 'enviada' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Método de Envío
                  </label>
                  <select
                    value={updateData.sentMethod}
                    onChange={(e) => setUpdateData({ ...updateData, sentMethod: e.target.value })}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccione...</option>
                    <option value="email">Email</option>
                    <option value="telefono">Teléfono</option>
                    <option value="presencial">Presencial</option>
                    <option value="carta">Carta documento</option>
                  </select>
                </div>
              )}

              {updateData.status === 'recibida' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notas de Recepción
                  </label>
                  <textarea
                    value={updateData.responseNotes}
                    onChange={(e) => setUpdateData({ ...updateData, responseNotes: e.target.value })}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="Observaciones sobre la documentación recibida..."
                  />
                </div>
              )}

              {(updateData.status === 'aprobada' || updateData.status === 'rechazada') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notas de Revisión
                  </label>
                  <textarea
                    value={updateData.reviewNotes}
                    onChange={(e) => setUpdateData({ ...updateData, reviewNotes: e.target.value })}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder={updateData.status === 'rechazada' ? 'Indique motivo del rechazo...' : 'Observaciones de la revisión...'}
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 p-4 border-t bg-gray-50 flex-shrink-0">
              <button
                onClick={() => setShowUpdateModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Actualizar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
