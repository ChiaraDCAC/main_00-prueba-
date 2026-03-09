import { useState } from 'react';
import {
  Users,
  UserPlus,
  Check,
  X,
  Trash2,
  AlertCircle,
  Building2,
  User,
  FileText,
  ChevronDown,
  ChevronUp,
  Save,
} from 'lucide-react';

/**
 * SignerConfiguration - Configuración de firmantes obligatorios
 *
 * El admin debe configurar los firmantes antes de aceptar la documentación.
 * - Muestra listado de personas registradas en la sociedad
 * - El admin selecciona firmantes mediante checkbox
 * - Puede añadir firmantes externos (nombre, CUIT, email)
 */

const SignerConfiguration = ({
  client,
  beneficialOwners = [],
  signatories = [],
  attorneys = [],
  authorities = [],
  selectedSigners = [],
  externalSigners = [],
  onSelectSigner,
  onDeselectSigner,
  onAddExternalSigner,
  onRemoveExternalSigner,
  onSave,
  readOnly = false,
}) => {
  const [showAddExternal, setShowAddExternal] = useState(false);
  const [externalForm, setExternalForm] = useState({
    name: '',
    cuit: '',
    email: '',
  });
  const [expandedSection, setExpandedSection] = useState('all');

  // Combinar todas las personas de la sociedad
  const allPersons = [
    ...beneficialOwners.map(p => ({ ...p, type: 'beneficial_owner', typeLabel: 'Beneficiario Final' })),
    ...authorities.map(p => ({ ...p, type: 'authority', typeLabel: 'Autoridad/Representante' })),
    ...attorneys.map(p => ({ ...p, type: 'attorney', typeLabel: 'Apoderado' })),
    ...signatories.map(p => ({ ...p, type: 'signatory', typeLabel: 'Firmante Registrado' })),
  ];

  // Verificar si una persona está seleccionada como firmante
  const isSelected = (personId) => {
    return selectedSigners.some(s => s.personId === personId);
  };

  // Manejar selección/deselección
  const handleToggle = (person) => {
    if (readOnly) return;

    if (isSelected(person.id)) {
      onDeselectSigner(person.id);
    } else {
      onSelectSigner({
        personId: person.id,
        personType: person.type,
        name: `${person.firstName} ${person.lastName}`,
        dni: person.dni,
        cuit: person.cuit,
        email: person.email,
        role: person.typeLabel,
        isExternal: false,
      });
    }
  };

  // Agregar firmante externo
  const handleAddExternal = () => {
    if (!externalForm.name || !externalForm.cuit || !externalForm.email) {
      return;
    }

    onAddExternalSigner({
      id: `external_${Date.now()}`,
      name: externalForm.name,
      cuit: externalForm.cuit,
      email: externalForm.email,
      isExternal: true,
    });

    setExternalForm({ name: '', cuit: '', email: '' });
    setShowAddExternal(false);
  };

  // Contar firmantes seleccionados
  const totalSelected = selectedSigners.length + externalSigners.length;

  // Agrupar personas por tipo
  const groupedPersons = {
    authorities: allPersons.filter(p => p.type === 'authority'),
    beneficialOwners: allPersons.filter(p => p.type === 'beneficial_owner'),
    attorneys: allPersons.filter(p => p.type === 'attorney'),
    signatories: allPersons.filter(p => p.type === 'signatory'),
  };

  const renderPersonCheckbox = (person) => {
    const selected = isSelected(person.id);

    return (
      <div
        key={person.id}
        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
          selected
            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300'
        } ${readOnly ? 'cursor-not-allowed opacity-70' : ''}`}
        onClick={() => handleToggle(person)}
      >
        <div className="flex items-center gap-3">
          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
            selected
              ? 'bg-blue-600 border-blue-600'
              : 'border-gray-300 dark:border-gray-600'
          }`}>
            {selected && <Check className="w-3 h-3 text-white" />}
          </div>

          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              {person.firstName} {person.lastName}
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              {person.dni && <span>DNI: {person.dni}</span>}
              {person.cuit && <span>• CUIT: {person.cuit}</span>}
            </div>
          </div>
        </div>

        <span className={`px-2 py-1 rounded text-xs font-medium ${
          person.type === 'authority'
            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
            : person.type === 'beneficial_owner'
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
            : person.type === 'attorney'
            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
        }`}>
          {person.typeLabel}
        </span>
      </div>
    );
  };

  const renderSection = (title, persons, icon, sectionKey) => {
    if (persons.length === 0) return null;

    const isExpanded = expandedSection === 'all' || expandedSection === sectionKey;
    const selectedInSection = persons.filter(p => isSelected(p.id)).length;

    return (
      <div className="mb-4">
        <button
          className="w-full flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
          onClick={() => setExpandedSection(isExpanded ? null : sectionKey)}
        >
          <div className="flex items-center gap-2">
            {icon}
            <span className="font-medium text-gray-700 dark:text-gray-300">{title}</span>
            <span className="text-xs text-gray-500">
              ({selectedInSection}/{persons.length} seleccionados)
            </span>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </button>

        {isExpanded && (
          <div className="mt-2 space-y-2 pl-2">
            {persons.map(person => renderPersonCheckbox(person))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Configuración de Firmantes
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Seleccione los firmantes obligatorios para el contrato
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-2xl font-bold text-blue-600">{totalSelected}</p>
          <p className="text-xs text-gray-500">firmantes seleccionados</p>
        </div>
      </div>

      {/* Warning if no signers selected */}
      {totalSelected === 0 && (
        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-200">
                Debe seleccionar al menos un firmante
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                Configure los firmantes obligatorios antes de aprobar la documentación.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Persons from society */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Personas registradas en la sociedad
        </h3>

        {renderSection(
          'Autoridades / Representantes Legales',
          groupedPersons.authorities,
          <Building2 className="w-4 h-4 text-purple-600" />,
          'authorities'
        )}

        {renderSection(
          'Beneficiarios Finales',
          groupedPersons.beneficialOwners,
          <User className="w-4 h-4 text-emerald-600" />,
          'beneficialOwners'
        )}

        {renderSection(
          'Apoderados',
          groupedPersons.attorneys,
          <FileText className="w-4 h-4 text-amber-600" />,
          'attorneys'
        )}

        {renderSection(
          'Firmantes Registrados',
          groupedPersons.signatories,
          <User className="w-4 h-4 text-blue-600" />,
          'signatories'
        )}

        {allPersons.length === 0 && (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">
            No hay personas registradas en la sociedad
          </p>
        )}
      </div>

      {/* External signers section */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Firmantes Externos
          </h3>
          {!readOnly && (
            <button
              onClick={() => setShowAddExternal(!showAddExternal)}
              className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
            >
              <UserPlus className="w-4 h-4" />
              Agregar firmante externo
            </button>
          )}
        </div>

        {/* Add external form */}
        {showAddExternal && (
          <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  value={externalForm.name}
                  onChange={(e) => setExternalForm({ ...externalForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800"
                  placeholder="Juan Pérez"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  CUIT *
                </label>
                <input
                  type="text"
                  value={externalForm.cuit}
                  onChange={(e) => setExternalForm({ ...externalForm, cuit: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800"
                  placeholder="20-12345678-9"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={externalForm.email}
                  onChange={(e) => setExternalForm({ ...externalForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800"
                  placeholder="email@ejemplo.com"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowAddExternal(false)}
                className="px-3 py-1.5 text-gray-600 hover:text-gray-800 text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddExternal}
                disabled={!externalForm.name || !externalForm.cuit || !externalForm.email}
                className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Agregar
              </button>
            </div>
          </div>
        )}

        {/* External signers list */}
        {externalSigners.length > 0 ? (
          <div className="space-y-2">
            {externalSigners.map((signer, index) => (
              <div
                key={signer.id || index}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{signer.name}</p>
                    <p className="text-xs text-gray-500">
                      CUIT: {signer.cuit} • {signer.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded text-xs">
                    Externo
                  </span>
                  {!readOnly && (
                    <button
                      onClick={() => onRemoveExternalSigner(signer.id)}
                      className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-2">
            No hay firmantes externos agregados
          </p>
        )}
      </div>

      {/* Save button */}
      {!readOnly && onSave && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onSave}
            disabled={totalSelected === 0}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            Guardar configuración de firmantes ({totalSelected})
          </button>
        </div>
      )}
    </div>
  );
};

export default SignerConfiguration;
