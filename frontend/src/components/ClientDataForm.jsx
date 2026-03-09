import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Save, Check, Building2, User, Users, FileText } from 'lucide-react';
import { ENTITY_TYPES, ENTITY_TYPE_LABELS } from '../config/documentRequirements';

// Campos según tipo de entidad
const ENTITY_FIELDS = {
  [ENTITY_TYPES.SA]: {
    sections: [
      {
        title: 'Datos de la Sociedad',
        icon: Building2,
        fields: [
          { id: 'razon_social', label: 'Razón Social', type: 'text', required: true },
          { id: 'cuit', label: 'CUIT', type: 'text', required: true },
          { id: 'fecha_constitucion', label: 'Fecha de Constitución', type: 'date', required: true },
          { id: 'numero_inscripcion_igj', label: 'Número de Inscripción IGJ', type: 'text', required: true },
          { id: 'domicilio_legal', label: 'Domicilio Legal', type: 'text', required: true },
          { id: 'domicilio_real', label: 'Domicilio Real', type: 'text', required: true },
          { id: 'objeto_social', label: 'Objeto Social', type: 'textarea', required: true },
          { id: 'capital_social', label: 'Capital Social ($)', type: 'number', required: true },
          { id: 'duracion_sociedad', label: 'Duración de la Sociedad', type: 'text', required: false },
          { id: 'cierre_ejercicio', label: 'Fecha de Cierre de Ejercicio', type: 'text', required: true },
        ],
      },
      {
        title: 'Autoridades',
        icon: Users,
        fields: [
          { id: 'presidente', label: 'Presidente', type: 'text', required: true },
          { id: 'presidente_cuit', label: 'CUIT Presidente', type: 'text', required: true },
          { id: 'vicepresidente', label: 'Vicepresidente', type: 'text', required: false },
          { id: 'directores', label: 'Directores (nombre - cargo)', type: 'textarea', required: false },
          { id: 'sindico', label: 'Síndico', type: 'text', required: false },
          { id: 'vigencia_mandato', label: 'Vigencia del Mandato', type: 'text', required: true },
        ],
      },
      {
        title: 'Composición Accionaria',
        icon: FileText,
        fields: [
          { id: 'cantidad_acciones', label: 'Cantidad Total de Acciones', type: 'number', required: true },
          { id: 'valor_nominal_accion', label: 'Valor Nominal por Acción ($)', type: 'number', required: true },
          { id: 'tipo_acciones', label: 'Tipo de Acciones', type: 'select', options: ['Nominativas no endosables', 'Nominativas endosables', 'Escriturales'], required: true },
          { id: 'accionistas', label: 'Accionistas (nombre - CUIT - cantidad - %)', type: 'textarea', required: true },
        ],
      },
    ],
  },
  [ENTITY_TYPES.SRL]: {
    sections: [
      {
        title: 'Datos de la Sociedad',
        icon: Building2,
        fields: [
          { id: 'razon_social', label: 'Razón Social', type: 'text', required: true },
          { id: 'cuit', label: 'CUIT', type: 'text', required: true },
          { id: 'fecha_constitucion', label: 'Fecha de Constitución', type: 'date', required: true },
          { id: 'numero_inscripcion_igj', label: 'Número de Inscripción IGJ', type: 'text', required: true },
          { id: 'domicilio_legal', label: 'Domicilio Legal', type: 'text', required: true },
          { id: 'domicilio_real', label: 'Domicilio Real', type: 'text', required: true },
          { id: 'objeto_social', label: 'Objeto Social', type: 'textarea', required: true },
          { id: 'capital_social', label: 'Capital Social ($)', type: 'number', required: true },
        ],
      },
      {
        title: 'Gerencia',
        icon: Users,
        fields: [
          { id: 'gerentes', label: 'Gerentes (nombre - CUIT)', type: 'textarea', required: true },
          { id: 'tipo_gerencia', label: 'Tipo de Gerencia', type: 'select', options: ['Individual', 'Colegiada'], required: true },
          { id: 'tipo_firma', label: 'Tipo de Firma', type: 'select', options: ['Indistinta', 'Conjunta'], required: true },
        ],
      },
      {
        title: 'Composición Societaria',
        icon: FileText,
        fields: [
          { id: 'cantidad_cuotas', label: 'Cantidad Total de Cuotas', type: 'number', required: true },
          { id: 'valor_cuota', label: 'Valor por Cuota ($)', type: 'number', required: true },
          { id: 'socios', label: 'Socios (nombre - CUIT - cuotas - %)', type: 'textarea', required: true },
        ],
      },
    ],
  },
  [ENTITY_TYPES.SH]: {
    sections: [
      {
        title: 'Datos de la Sociedad de Hecho',
        icon: Building2,
        fields: [
          { id: 'denominacion', label: 'Denominación', type: 'text', required: true },
          { id: 'fecha_inicio_actividades', label: 'Fecha de Inicio de Actividades', type: 'date', required: true },
          { id: 'domicilio', label: 'Domicilio', type: 'text', required: true },
          { id: 'actividad_principal', label: 'Actividad Principal', type: 'text', required: true },
          { id: 'objeto', label: 'Objeto Social', type: 'textarea', required: false },
        ],
      },
      {
        title: 'Socios (Beneficiarios Finales)',
        icon: Users,
        helpText: 'Todos los socios son responsables solidarios y, por normativa UIF, todos son Beneficiarios Finales.',
        fields: [
          { id: 'socios', label: 'Socios (nombre - DNI - CUIT - %)', type: 'textarea', required: true, helpText: 'Listar todos los socios con su porcentaje de participación' },
          { id: 'cantidad_socios', label: 'Cantidad de Socios', type: 'number', required: true },
        ],
      },
      {
        title: 'Representación y Administración',
        icon: FileText,
        helpText: 'Datos del representante designado en el contrato privado',
        fields: [
          { id: 'representante', label: 'Representante Designado (según Contrato Privado)', type: 'text', required: true },
          { id: 'representante_dni', label: 'DNI Representante', type: 'text', required: true },
          { id: 'representante_cuit', label: 'CUIT Representante', type: 'text', required: true },
          { id: 'gestor_es_representante', label: '¿El gestor/firmante es el representante designado?', type: 'select', options: ['Sí', 'No'], required: true, helpText: 'Si es "No", se requiere DDJJ de Designación de Representante/Apoderado' },
          { id: 'tiene_apoderado', label: '¿Tiene apoderado/tercero con facultades?', type: 'select', options: ['No', 'Sí'], required: true, helpText: 'Si es "Sí", se requiere Poder General o Especial' },
        ],
      },
    ],
  },
  [ENTITY_TYPES.SUCESION]: {
    sections: [
      {
        title: 'Datos de la Sucesión',
        icon: Building2,
        fields: [
          { id: 'causante_nombre', label: 'Nombre del Causante', type: 'text', required: true },
          { id: 'causante_cuit', label: 'CUIT del Causante', type: 'text', required: true },
          { id: 'fecha_fallecimiento', label: 'Fecha de Fallecimiento', type: 'date', required: true },
          { id: 'juzgado', label: 'Juzgado Interviniente', type: 'text', required: true },
          { id: 'expediente', label: 'Número de Expediente', type: 'text', required: true },
          { id: 'fecha_declaratoria', label: 'Fecha de Declaratoria de Herederos', type: 'date', required: false },
        ],
      },
      {
        title: 'Herederos',
        icon: Users,
        fields: [
          { id: 'herederos', label: 'Herederos (nombre - DNI - vínculo - %)', type: 'textarea', required: true },
          { id: 'administrador', label: 'Administrador de la Sucesión', type: 'text', required: false },
          { id: 'administrador_cuit', label: 'CUIT Administrador', type: 'text', required: false },
        ],
      },
    ],
  },
  [ENTITY_TYPES.MONOTRIBUTISTA]: {
    sections: [
      {
        title: 'Datos Personales',
        icon: User,
        fields: [
          { id: 'apellido', label: 'Apellido', type: 'text', required: true },
          { id: 'nombre', label: 'Nombre', type: 'text', required: true },
          { id: 'dni', label: 'DNI', type: 'text', required: true },
          { id: 'cuit', label: 'CUIT', type: 'text', required: true },
          { id: 'fecha_nacimiento', label: 'Fecha de Nacimiento', type: 'date', required: true },
          { id: 'nacionalidad', label: 'Nacionalidad', type: 'text', required: true },
          { id: 'estado_civil', label: 'Estado Civil', type: 'select', options: ['Soltero/a', 'Casado/a', 'Divorciado/a', 'Viudo/a', 'Unión convivencial'], required: true },
        ],
      },
      {
        title: 'Datos de Contacto',
        icon: FileText,
        fields: [
          { id: 'domicilio_real', label: 'Domicilio Real', type: 'text', required: true },
          { id: 'domicilio_fiscal', label: 'Domicilio Fiscal', type: 'text', required: true },
          { id: 'telefono', label: 'Teléfono', type: 'text', required: true },
          { id: 'email', label: 'Email', type: 'email', required: true },
        ],
      },
      {
        title: 'Datos Monotributo',
        icon: Building2,
        fields: [
          { id: 'categoria', label: 'Categoría', type: 'select', options: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'], required: true },
          { id: 'actividad_principal', label: 'Actividad Principal', type: 'text', required: true },
          { id: 'fecha_inscripcion', label: 'Fecha de Inscripción', type: 'date', required: true },
          { id: 'ingresos_anuales', label: 'Ingresos Brutos Anuales ($)', type: 'number', required: true },
        ],
      },
    ],
  },
  [ENTITY_TYPES.PERSONA_HUMANA]: {
    sections: [
      {
        title: 'Datos Personales',
        icon: User,
        fields: [
          { id: 'apellido', label: 'Apellido', type: 'text', required: true },
          { id: 'nombre', label: 'Nombre', type: 'text', required: true },
          { id: 'dni', label: 'DNI', type: 'text', required: true },
          { id: 'cuil', label: 'CUIL', type: 'text', required: true },
          { id: 'fecha_nacimiento', label: 'Fecha de Nacimiento', type: 'date', required: true },
          { id: 'lugar_nacimiento', label: 'Lugar de Nacimiento', type: 'text', required: true },
          { id: 'nacionalidad', label: 'Nacionalidad', type: 'text', required: true },
          { id: 'sexo', label: 'Sexo', type: 'select', options: ['Masculino', 'Femenino', 'Otro'], required: true },
          { id: 'estado_civil', label: 'Estado Civil', type: 'select', options: ['Soltero/a', 'Casado/a', 'Divorciado/a', 'Viudo/a', 'Unión convivencial'], required: true },
        ],
      },
      {
        title: 'Datos de Contacto',
        icon: FileText,
        fields: [
          { id: 'domicilio', label: 'Domicilio', type: 'text', required: true },
          { id: 'ciudad', label: 'Ciudad', type: 'text', required: true },
          { id: 'provincia', label: 'Provincia', type: 'text', required: true },
          { id: 'codigo_postal', label: 'Código Postal', type: 'text', required: true },
          { id: 'telefono', label: 'Teléfono', type: 'text', required: true },
          { id: 'email', label: 'Email', type: 'email', required: true },
        ],
      },
      {
        title: 'Datos Laborales / Económicos',
        icon: Building2,
        fields: [
          { id: 'ocupacion', label: 'Ocupación / Profesión', type: 'text', required: true },
          { id: 'empleador', label: 'Empleador (si aplica)', type: 'text', required: false },
          { id: 'ingresos_mensuales', label: 'Ingresos Mensuales Estimados ($)', type: 'number', required: true },
          { id: 'origen_fondos', label: 'Origen de los Fondos', type: 'textarea', required: true },
        ],
      },
    ],
  },
};

const ClientDataForm = ({ client, onSave, readOnly = false }) => {
  const entityType = client?.entityType || ENTITY_TYPES.PERSONA_HUMANA;
  const entityConfig = ENTITY_FIELDS[entityType] || ENTITY_FIELDS[ENTITY_TYPES.PERSONA_HUMANA];

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm({
    defaultValues: client?.formData || {},
  });

  useEffect(() => {
    reset(client?.formData || {});
  }, [client?.id, reset]);

  const onSubmit = (data) => {
    onSave(client.id, data);
  };

  const renderField = (field) => {
    const baseClasses = `input ${errors[field.id] ? 'border-red-500' : ''} ${readOnly ? 'bg-gray-100' : ''}`;

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            {...register(field.id, { required: field.required && 'Este campo es requerido' })}
            className={`${baseClasses} resize-none`}
            rows={3}
            disabled={readOnly}
          />
        );
      case 'select':
        return (
          <select
            {...register(field.id, { required: field.required && 'Este campo es requerido' })}
            className={baseClasses}
            disabled={readOnly}
          >
            <option value="">Seleccionar...</option>
            {field.options?.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );
      case 'date':
        return (
          <input
            type="date"
            {...register(field.id, { required: field.required && 'Este campo es requerido' })}
            className={baseClasses}
            disabled={readOnly}
          />
        );
      case 'number':
        return (
          <input
            type="number"
            {...register(field.id, { required: field.required && 'Este campo es requerido' })}
            className={baseClasses}
            disabled={readOnly}
          />
        );
      case 'email':
        return (
          <input
            type="email"
            {...register(field.id, {
              required: field.required && 'Este campo es requerido',
              pattern: { value: /^\S+@\S+$/i, message: 'Email inválido' }
            })}
            className={baseClasses}
            disabled={readOnly}
          />
        );
      default:
        return (
          <input
            type="text"
            {...register(field.id, { required: field.required && 'Este campo es requerido' })}
            className={baseClasses}
            disabled={readOnly}
          />
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Datos del Cliente - {ENTITY_TYPE_LABELS[entityType]}
          </h2>
          <p className="text-gray-500 mt-1">
            Complete los campos requeridos según el tipo de entidad
          </p>
        </div>
        {client?.clientNumber && (
          <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg">
            <span className="text-sm font-medium">ID Cliente:</span>
            <span className="ml-2 font-mono font-bold">{client.clientNumber}</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {entityConfig.sections.map((section, idx) => (
          <div key={idx} className="card border">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                <section.icon className="w-5 h-5 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold">{section.title}</h3>
            </div>
            {section.helpText && (
              <p className="text-sm text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20 rounded px-3 py-2 mb-4">
                {section.helpText}
              </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {section.fields.map(field => (
                <div key={field.id} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                  <label className="label">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {renderField(field)}
                  {field.helpText && (
                    <p className="text-xs text-muted-foreground mt-1">{field.helpText}</p>
                  )}
                  {errors[field.id] && (
                    <p className="text-red-500 text-xs mt-1">{errors[field.id].message}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Submit Button */}
        {!readOnly && (
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => reset(client?.formData || {})}
              className="btn btn-secondary"
              disabled={!isDirty}
            >
              Descartar Cambios
            </button>
            <button
              type="submit"
              className={`btn flex items-center gap-2 ${isDirty ? 'btn-primary' : 'btn-secondary'}`}
            >
              <Save size={18} />
              Guardar Datos
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default ClientDataForm;
