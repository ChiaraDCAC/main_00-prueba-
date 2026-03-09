import { useState } from 'react';
import {
  Shield,
  Upload,
  CheckCircle2,
  AlertTriangle,
  FileText,
  User,
  X,
  Eye,
  Plus,
  Trash2,
} from 'lucide-react';

/**
 * PersonPepUploader - Carga de DDJJ PEP por cada persona
 *
 * Se usa durante el alta de la sociedad.
 * Por cada persona humana agregada (socio, representante, apoderado, etc.)
 * se debe cargar una DDJJ PEP indicando si es o no PEP.
 */

const PersonPepUploader = ({
  person, // { id, firstName, lastName, dni, cuit, type, typeLabel }
  pepData, // Datos PEP existentes si los hay
  onSave,
  onUploadDocument,
  onUploadAdditionalDoc,
  readOnly = false,
}) => {
  const [formData, setFormData] = useState({
    isPep: pepData?.isPep ?? null,
    pepPosition: pepData?.pepPosition || '',
    pepOrganization: pepData?.pepOrganization || '',
    pepStartDate: pepData?.pepStartDate || '',
    pepEndDate: pepData?.pepEndDate || '',
    pepRelationship: pepData?.pepRelationship || '',
    documentFile: null,
    documentUrl: pepData?.documentUrl || null,
  });

  const [additionalDocs, setAdditionalDocs] = useState(pepData?.additionalDocs || {
    ddjj_ingresos: null,
    extractos_bancarios: null,
    ddjj_patrimonio: null,
    origen_fondos: null,
  });

  const [showForm, setShowForm] = useState(pepData?.isPep !== undefined);

  const handleIsPepChange = (value) => {
    setFormData({ ...formData, isPep: value });
    setShowForm(true);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, documentFile: file });
      if (onUploadDocument) {
        onUploadDocument(person.id, file);
      }
    }
  };

  const handleAdditionalDocUpload = (docType, e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAdditionalDocs({ ...additionalDocs, [docType]: file });
      if (onUploadAdditionalDoc) {
        onUploadAdditionalDoc(person.id, docType, file);
      }
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave(person.id, {
        ...formData,
        additionalDocs: formData.isPep ? additionalDocs : null,
      });
    }
  };

  const isComplete = () => {
    if (formData.isPep === null) return false;
    if (!formData.documentFile && !formData.documentUrl) return false;
    if (formData.isPep) {
      // Para PEP, verificar que tenga los datos básicos
      if (!formData.pepPosition) return false;
    }
    return true;
  };

  const getAdditionalDocsStatus = () => {
    if (!formData.isPep) return null;
    const required = ['ddjj_ingresos', 'extractos_bancarios', 'ddjj_patrimonio', 'origen_fondos'];
    const uploaded = required.filter(doc => additionalDocs[doc]);
    return { uploaded: uploaded.length, total: required.length };
  };

  const additionalDocsStatus = getAdditionalDocsStatus();

  return (
    <div className={`border rounded-lg overflow-hidden ${
      isComplete()
        ? 'border-emerald-300 dark:border-emerald-700'
        : 'border-gray-200 dark:border-gray-700'
    }`}>
      {/* Header con datos de la persona */}
      <div className={`p-4 flex items-center justify-between ${
        isComplete()
          ? 'bg-emerald-50 dark:bg-emerald-900/20'
          : 'bg-gray-50 dark:bg-gray-800'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isComplete()
              ? 'bg-emerald-500'
              : formData.isPep
              ? 'bg-amber-100 dark:bg-amber-900/30'
              : 'bg-gray-200 dark:bg-gray-700'
          }`}>
            {isComplete() ? (
              <CheckCircle2 className="w-5 h-5 text-white" />
            ) : (
              <User className={`w-5 h-5 ${formData.isPep ? 'text-amber-600' : 'text-gray-500'}`} />
            )}
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              {person.firstName} {person.lastName}
            </p>
            <p className="text-xs text-gray-500">
              DNI: {person.dni} {person.cuit && `• CUIT: ${person.cuit}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {person.typeLabel && (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded text-xs">
              {person.typeLabel}
            </span>
          )}
          {formData.isPep === true && (
            <span className="px-2 py-1 bg-amber-500 text-white rounded text-xs font-bold">
              PEP
            </span>
          )}
          {isComplete() && (
            <span className="px-2 py-1 bg-emerald-500 text-white rounded text-xs">
              Completo
            </span>
          )}
        </div>
      </div>

      {/* Contenido */}
      <div className="p-4">
        {/* Pregunta inicial: ¿Es PEP? */}
        {formData.isPep === null && !readOnly && (
          <div className="text-center py-4">
            <Shield className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              ¿Esta persona es Políticamente Expuesta (PEP)?
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => handleIsPepChange(false)}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                NO es PEP
              </button>
              <button
                onClick={() => handleIsPepChange(true)}
                className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
              >
                SÍ es PEP
              </button>
            </div>
          </div>
        )}

        {/* Formulario si ya se indicó si es PEP o no */}
        {formData.isPep !== null && (
          <div className="space-y-4">
            {/* Estado PEP (editable) */}
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Condición PEP:
              </span>
              {!readOnly ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleIsPepChange(false)}
                    className={`px-3 py-1 rounded text-sm transition-colors ${
                      formData.isPep === false
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    NO PEP
                  </button>
                  <button
                    onClick={() => handleIsPepChange(true)}
                    className={`px-3 py-1 rounded text-sm transition-colors ${
                      formData.isPep === true
                        ? 'bg-amber-600 text-white'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    SÍ PEP
                  </button>
                </div>
              ) : (
                <span className={`font-bold ${formData.isPep ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {formData.isPep ? 'SÍ' : 'NO'}
                </span>
              )}
            </div>

            {/* Campos adicionales si es PEP */}
            {formData.isPep && (
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Datos PEP requeridos
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Cargo / Función *
                    </label>
                    <input
                      type="text"
                      value={formData.pepPosition}
                      onChange={(e) => setFormData({ ...formData, pepPosition: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800"
                      placeholder="Ej: Diputado Nacional"
                      disabled={readOnly}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Organismo
                    </label>
                    <input
                      type="text"
                      value={formData.pepOrganization}
                      onChange={(e) => setFormData({ ...formData, pepOrganization: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800"
                      placeholder="Ej: Congreso de la Nación"
                      disabled={readOnly}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Fecha inicio cargo
                    </label>
                    <input
                      type="date"
                      value={formData.pepStartDate}
                      onChange={(e) => setFormData({ ...formData, pepStartDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800"
                      disabled={readOnly}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Fecha fin cargo (si aplica)
                    </label>
                    <input
                      type="date"
                      value={formData.pepEndDate}
                      onChange={(e) => setFormData({ ...formData, pepEndDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800"
                      disabled={readOnly}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Relación (si es PEP por vínculo)
                    </label>
                    <select
                      value={formData.pepRelationship}
                      onChange={(e) => setFormData({ ...formData, pepRelationship: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800"
                      disabled={readOnly}
                    >
                      <option value="">No aplica (es PEP directo)</option>
                      <option value="conyuge">Cónyuge</option>
                      <option value="conviviente">Conviviente</option>
                      <option value="padre">Padre/Madre</option>
                      <option value="hijo">Hijo/a</option>
                      <option value="hermano">Hermano/a</option>
                      <option value="otro_familiar">Otro familiar</option>
                      <option value="asociado_cercano">Asociado cercano</option>
                    </select>
                  </div>
                </div>

                {/* Documentación adicional requerida para PEP */}
                <div className="mt-4 pt-4 border-t border-amber-200 dark:border-amber-700">
                  <h5 className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-3">
                    Documentación adicional requerida ({additionalDocsStatus?.uploaded}/{additionalDocsStatus?.total})
                  </h5>

                  <div className="space-y-2">
                    {[
                      { id: 'ddjj_ingresos', label: 'DDJJ de Ingresos' },
                      { id: 'extractos_bancarios', label: 'Extractos Bancarios (últimos 3 meses)' },
                      { id: 'ddjj_patrimonio', label: 'DDJJ Patrimonio / Balances' },
                      { id: 'origen_fondos', label: 'Documentación Origen de Fondos' },
                    ].map(doc => (
                      <div key={doc.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded">
                        <div className="flex items-center gap-2">
                          {additionalDocs[doc.id] ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                          )}
                          <span className="text-sm">{doc.label}</span>
                        </div>
                        {!readOnly && (
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              className="hidden"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => handleAdditionalDocUpload(doc.id, e)}
                            />
                            <span className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1">
                              {additionalDocs[doc.id] ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3" />
                                  Cargado
                                </>
                              ) : (
                                <>
                                  <Upload className="w-3 h-3" />
                                  Cargar
                                </>
                              )}
                            </span>
                          </label>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Carga de DDJJ PEP (documento) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                DDJJ PEP firmada *
              </label>
              {formData.documentFile || formData.documentUrl ? (
                <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-600" />
                    <span className="text-sm text-emerald-700 dark:text-emerald-300">
                      {formData.documentFile?.name || 'DDJJ PEP cargada'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {formData.documentUrl && (
                      <button className="text-blue-600 hover:text-blue-700">
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                    {!readOnly && (
                      <button
                        onClick={() => setFormData({ ...formData, documentFile: null, documentUrl: null })}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <label className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                  readOnly
                    ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                    : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50 dark:border-gray-600 dark:hover:border-blue-500'
                }`}>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    disabled={readOnly}
                  />
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Cargar DDJJ PEP firmada
                  </span>
                  <span className="text-xs text-gray-400 mt-1">
                    PDF, JPG o PNG
                  </span>
                </label>
              )}
            </div>

            {/* Botón guardar */}
            {!readOnly && (
              <button
                onClick={handleSave}
                disabled={!isComplete()}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Guardar DDJJ PEP
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonPepUploader;
