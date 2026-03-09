import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { clientService } from '../../services/clientService';

const ClientForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm({
    defaultValues: {
      clientType: 'persona_humana',
    },
  });

  const clientType = watch('clientType');

  const { data: clientData, isLoading: loadingClient } = useQuery({
    queryKey: ['client', id],
    queryFn: () => clientService.getById(id),
    enabled: isEdit,
  });

  useEffect(() => {
    if (clientData?.data?.data) {
      reset(clientData.data.data);
    }
  }, [clientData, reset]);

  const createMutation = useMutation({
    mutationFn: (data) => clientService.create(data),
    onSuccess: () => {
      toast.success('Cliente creado exitosamente');
      navigate('/clients');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => clientService.update(id, data),
    onSuccess: () => {
      toast.success('Cliente actualizado exitosamente');
      navigate(`/clients/${id}`);
    },
  });

  const onSubmit = (data) => {
    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  if (isEdit && loadingClient) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="btn btn-secondary">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Editar Cliente' : 'Nuevo Cliente'}
          </h1>
          <p className="text-gray-500">
            {isEdit ? 'Modificar datos del cliente' : 'Complete los datos identificatorios'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Tipo de cliente */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Tipo de Cliente</h2>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="persona_humana"
                {...register('clientType')}
                className="w-4 h-4 text-primary-600"
                disabled={isEdit}
              />
              <span>Persona Humana</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="persona_juridica"
                {...register('clientType')}
                className="w-4 h-4 text-primary-600"
                disabled={isEdit}
              />
              <span>Persona Jurídica</span>
            </label>
          </div>
        </div>

        {/* Datos comunes */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Datos Identificatorios</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="label">CUIT *</label>
              <input
                type="text"
                className="input"
                {...register('cuit', {
                  required: 'CUIT requerido',
                  pattern: { value: /^\d{11}$/, message: 'CUIT debe tener 11 dígitos' },
                })}
                placeholder="20123456789"
              />
              {errors.cuit && <p className="text-red-500 text-sm mt-1">{errors.cuit.message}</p>}
            </div>

            <div>
              <label className="label">Email</label>
              <input type="email" className="input" {...register('email')} />
            </div>

            <div>
              <label className="label">Teléfono</label>
              <input type="tel" className="input" {...register('phone')} />
            </div>
          </div>
        </div>

        {/* Datos específicos según tipo */}
        {clientType === 'persona_humana' ? (
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Datos Personales</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="label">Nombre *</label>
                <input
                  type="text"
                  className="input"
                  {...register('firstName', { required: 'Nombre requerido' })}
                />
                {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>}
              </div>

              <div>
                <label className="label">Apellido *</label>
                <input
                  type="text"
                  className="input"
                  {...register('lastName', { required: 'Apellido requerido' })}
                />
                {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>}
              </div>

              <div>
                <label className="label">DNI</label>
                <input type="text" className="input" {...register('dni')} />
              </div>

              <div>
                <label className="label">Fecha de Nacimiento</label>
                <input type="date" className="input" {...register('birthDate')} />
              </div>

              <div>
                <label className="label">Nacionalidad</label>
                <input type="text" className="input" {...register('nationality')} defaultValue="Argentina" />
              </div>

              <div>
                <label className="label">Ocupación</label>
                <input type="text" className="input" {...register('occupation')} />
              </div>

              <div>
                <label className="label">Estado Civil</label>
                <select className="input" {...register('maritalStatus')}>
                  <option value="">Seleccionar...</option>
                  <option value="soltero">Soltero/a</option>
                  <option value="casado">Casado/a</option>
                  <option value="divorciado">Divorciado/a</option>
                  <option value="viudo">Viudo/a</option>
                </select>
              </div>
            </div>
          </div>
        ) : (
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Datos Societarios</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <label className="label">Razón Social *</label>
                <input
                  type="text"
                  className="input"
                  {...register('legalName', { required: 'Razón social requerida' })}
                />
                {errors.legalName && <p className="text-red-500 text-sm mt-1">{errors.legalName.message}</p>}
              </div>

              <div>
                <label className="label">Nombre Fantasía</label>
                <input type="text" className="input" {...register('tradeName')} />
              </div>

              <div>
                <label className="label">Forma Jurídica</label>
                <select className="input" {...register('legalForm')}>
                  <option value="">Seleccionar...</option>
                  <option value="SA">SA</option>
                  <option value="SRL">SRL</option>
                  <option value="SAS">SAS</option>
                  <option value="SC">SC</option>
                  <option value="SH">SH</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div>
                <label className="label">Fecha de Constitución</label>
                <input type="date" className="input" {...register('incorporationDate')} />
              </div>

              <div>
                <label className="label">N° de Inscripción</label>
                <input type="text" className="input" {...register('registrationNumber')} />
              </div>

              <div>
                <label className="label">Actividad Principal</label>
                <input type="text" className="input" {...register('mainActivity')} />
              </div>

              <div>
                <label className="label">Actividad Secundaria</label>
                <input type="text" className="input" {...register('secondaryActivity')} />
              </div>
            </div>
          </div>
        )}

        {/* Domicilio */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Domicilio</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <label className="label">Dirección</label>
              <input type="text" className="input" {...register('address')} />
            </div>

            <div>
              <label className="label">Código Postal</label>
              <input type="text" className="input" {...register('postalCode')} />
            </div>

            <div>
              <label className="label">Ciudad</label>
              <input type="text" className="input" {...register('city')} />
            </div>

            <div>
              <label className="label">Provincia</label>
              <input type="text" className="input" {...register('province')} />
            </div>

            <div>
              <label className="label">País</label>
              <input type="text" className="input" {...register('country')} defaultValue="Argentina" />
            </div>
          </div>
        </div>

        {/* PEP */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Persona Expuesta Políticamente (PEP)</h2>
          <div className="space-y-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('isPep')}
                className="w-4 h-4 text-primary-600 rounded"
              />
              <span>¿Es Persona Expuesta Políticamente?</span>
            </label>

            {watch('isPep') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="label">Cargo/Función</label>
                  <input type="text" className="input" {...register('pepPosition')} />
                </div>
                <div>
                  <label className="label">Relación (si aplica)</label>
                  <input type="text" className="input" {...register('pepRelationship')} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Perfil transaccional */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Perfil Transaccional Esperado</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Transacciones Mensuales Esperadas</label>
              <input
                type="number"
                className="input"
                {...register('expectedMonthlyTransactions', { valueAsNumber: true })}
              />
            </div>
            <div>
              <label className="label">Monto Mensual Esperado (ARS)</label>
              <input
                type="number"
                className="input"
                {...register('expectedMonthlyAmount', { valueAsNumber: true })}
              />
            </div>
          </div>
        </div>

        {/* Notas */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Notas</h2>
          <textarea
            className="input min-h-[100px]"
            {...register('notes')}
            placeholder="Observaciones adicionales..."
          />
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <button type="button" onClick={() => navigate(-1)} className="btn btn-secondary">
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary flex items-center gap-2" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save size={20} />
                {isEdit ? 'Guardar Cambios' : 'Crear Cliente'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClientForm;
