import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Save, Check, Plus, Trash2 } from 'lucide-react';
import { FORM_FIELDS } from '../config/documentRequirements';

const DocumentForm = ({
  document,
  fields,
  initialValues,
  onSave,
  onFieldChange,
}) => {
  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isDirty } } = useForm({
    defaultValues: initialValues || {},
  });

  // State for repeatable sections
  const [repeatableData, setRepeatableData] = useState({});

  // Reset form when document changes
  useEffect(() => {
    // Build default values from field definitions
    const defaultValues = {};
    fields.forEach(field => {
      if (field.defaultValue !== undefined) {
        defaultValues[field.id] = field.defaultValue;
      }
    });
    // Merge with initial values (initial values take precedence)
    reset({ ...defaultValues, ...(initialValues || {}) });
    // Initialize repeatable sections from initialValues
    if (document?.repeatableSections && initialValues) {
      const newRepeatableData = {};
      document.repeatableSections.forEach(section => {
        newRepeatableData[section.id] = initialValues[section.id] || [{}];
      });
      setRepeatableData(newRepeatableData);
    } else if (document?.repeatableSections) {
      const newRepeatableData = {};
      document.repeatableSections.forEach(section => {
        newRepeatableData[section.id] = [{}];
      });
      setRepeatableData(newRepeatableData);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [document?.id]);

  // Watch all fields for real-time updates (subscription pattern avoids infinite re-render)
  const watchedFields = watch();

  useEffect(() => {
    if (!onFieldChange || !document) return;
    const notify = (values) => {
      const completedFields = {};
      fields.forEach(field => {
        completedFields[field.id] = !!values[field.id];
      });
      onFieldChange(document.id, completedFields);
    };
    // Notify immediately with current values
    notify(watchedFields);
    // Subscribe to future changes
    const { unsubscribe } = watch((values) => notify(values));
    return unsubscribe;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [document?.id, fields, onFieldChange]);

  const onSubmit = (data) => {
    // Merge regular fields with repeatable data
    const fullData = { ...data, ...repeatableData };
    onSave(document.id, fullData);
  };

  const addRepeatableItem = (sectionId) => {
    setRepeatableData(prev => ({
      ...prev,
      [sectionId]: [...(prev[sectionId] || []), {}]
    }));
  };

  const removeRepeatableItem = (sectionId, index) => {
    setRepeatableData(prev => ({
      ...prev,
      [sectionId]: prev[sectionId].filter((_, i) => i !== index)
    }));
  };

  const updateRepeatableItem = (sectionId, index, fieldId, value) => {
    setRepeatableData(prev => {
      const currentItems = prev[sectionId] || [{}];
      return {
        ...prev,
        [sectionId]: currentItems.map((item, i) =>
          i === index ? { ...item, [fieldId]: value } : item
        )
      };
    });
  };

  if (!document) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <p>Seleccione un documento para completar los datos</p>
      </div>
    );
  }

  const renderField = (field, registerProps = null, value = null, onChange = null) => {
    const isControlled = onChange !== null;
    const isReadOnly = field.readOnly === true;
    const defaultVal = field.defaultValue !== undefined ? field.defaultValue : '';
    // For controlled inputs, ensure value is never undefined
    const controlledValue = value !== undefined && value !== null ? value : defaultVal;

    const commonProps = isControlled
      ? {
          value: controlledValue,
          onChange: (e) => onChange(e.target.value),
          className: `input text-sm ${isReadOnly ? 'bg-muted text-muted-foreground cursor-not-allowed' : ''}`,
          placeholder: field.placeholder || '',
          readOnly: isReadOnly,
          disabled: isReadOnly,
        }
      : {
          ...registerProps,
          defaultValue: defaultVal,
          className: `input text-sm ${errors[field.id] ? 'border-red-500' : ''} ${isReadOnly ? 'bg-muted text-muted-foreground cursor-not-allowed' : ''}`,
          placeholder: field.placeholder || '',
          readOnly: isReadOnly,
          disabled: isReadOnly,
        };

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            {...commonProps}
            rows={2}
            className={`${commonProps.className} resize-none`}
          />
        );

      case 'select':
        return (
          <select {...commonProps}>
            <option value="">Seleccionar...</option>
            {field.options?.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );

      case 'date':
        return <input type="date" {...commonProps} />;

      case 'number':
        return <input type="number" {...commonProps} />;

      case 'email':
        return <input type="email" {...commonProps} />;

      case 'yesno': {
        const currentVal = isControlled ? controlledValue : watch(field.id);
        return (
          <div className="flex gap-2 mt-0.5">
            {['Sí', 'No'].map(opt => {
              const isActive = currentVal === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => isControlled ? onChange(opt) : setValue(field.id, opt)}
                  className={`flex-1 py-1.5 rounded-lg text-sm font-medium border transition-all ${isActive ? 'bg-[#3879a3] text-white border-[#3879a3]' : 'bg-transparent text-slate-500 border-slate-300 hover:border-[#3879a3] hover:text-[#3879a3]'}`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        );
      }

      default:
        return <input type="text" {...commonProps} />;
    }
  };

  const renderRepeatableSection = (section) => {
    const items = repeatableData[section.id] || [{}];

    return (
      <div key={section.id} className="border border-border rounded-lg p-3 mb-4 bg-muted/30">
        <h4 className="font-semibold text-sm text-foreground mb-3">{section.title}</h4>

        {items.map((item, index) => (
          <div key={index} className="bg-card border border-border rounded-lg p-3 mb-2">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium text-muted-foreground">
                #{index + 1}
              </span>
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRepeatableItem(section.id, index)}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-2">
              {section.fields.map(fieldId => {
                const fieldDef = FORM_FIELDS[fieldId];
                if (!fieldDef) return null;

                return (
                  <div key={fieldId}>
                    <label className="label text-xs">{fieldDef.label}</label>
                    {renderField(
                      fieldDef,
                      null,
                      item[fieldId],
                      (value) => updateRepeatableItem(section.id, index, fieldId, value)
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => addRepeatableItem(section.id)}
          className="btn btn-secondary w-full text-sm py-2 flex items-center justify-center gap-2"
        >
          <Plus size={16} />
          {section.addLabel}
        </button>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-muted">
        <h3 className="font-semibold text-foreground">{document.name}</h3>
        <p className="text-sm text-muted-foreground mt-1">{document.description}</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {fields.length === 0 && !document.repeatableSections?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              <Check className="w-12 h-12 mx-auto mb-2 text-emerald-500" />
              <p>No hay campos adicionales para este documento</p>
              <p className="text-sm">Solo se requiere la carga del archivo</p>
            </div>
          ) : (
            <>
              {/* Regular fields */}
              {fields
                .filter(field => {
                  if (field.type === 'section') return true;
                  if (!field.condition) return true;
                  const conditionValue = watchedFields[field.condition.field];
                  return conditionValue === field.condition.value;
                })
                .map(field => {
                  if (field.type === 'section') {
                    return (
                      <div key={field.id} className="pt-3 pb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-1 h-4 bg-[#3879a3] rounded-full shrink-0" />
                          <h4 className="text-xs font-bold text-[#3879a3] uppercase tracking-wider">{field.label}</h4>
                          <div className="flex-1 h-px bg-[#3879a3]/20" />
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={field.id}>
                      <label className="label text-xs">
                        {field.label}
                        {watchedFields[field.id] && (
                          <Check className="inline-block w-3 h-3 text-emerald-500 ml-1" />
                        )}
                      </label>
                      {renderField(field, register(field.id))}
                      {errors[field.id] && (
                        <p className="text-red-500 text-xs mt-1">{errors[field.id].message}</p>
                      )}
                    </div>
                  );
                })}

              {/* Repeatable sections */}
              {document.repeatableSections?.map(section => renderRepeatableSection(section))}
            </>
          )}
        </div>

        {/* Save button */}
        {(fields.length > 0 || document.repeatableSections?.length > 0) && (
          <div className="p-4 border-t bg-muted">
            <button
              type="submit"
              className="btn w-full flex items-center justify-center gap-2 btn-primary"
            >
              <Save size={18} />
              Guardar datos
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default DocumentForm;
