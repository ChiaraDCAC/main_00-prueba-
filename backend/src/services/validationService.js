const { Client, Document } = require('../models');

// Replicating frontend logic for document requirements
// Ideally this should be in a shared config or database table
//
// PRD VF §6.2.1 — Persona Humana / PF (monotributista, particular, profesional
// independiente, trabajador autónomo, responsable inscripto): NO carga archivos
// desde el front del cliente. Toda la información llega como datos estructurados
// (4iDigital + formulario del cliente). Por eso `monotributista: []`.
const DOCUMENT_REQUIREMENTS = {
  monotributista: [],
  sa: ['estatuto', 'acta_autoridades', 'registro_accionistas', 'constancia_cuit'],
  srl: ['contrato_social', 'acta_asamblea', 'registro_socios', 'constancia_cuit'],
  // Sociedad de Hecho: Contrato privado y DNI de todos los socios son OBLIGATORIOS
  // ddjj_representante y poder son condicionales
  sh: ['contrato_privado', 'dni_socios'],
  sucesion: ['declaratoria_herederos', 'dni_herederos'],
};

// Campos estructurados mínimos para PF (vienen como formData, no documentos).
// Si falta alguno, el alta queda incompleta.
const PF_REQUIRED_FORM_FIELDS = [
  // DNI Frente (4iDigital)
  'dni_numero', 'dni_apellido', 'dni_nombre', 'dni_sexo',
  'dni_nacionalidad', 'dni_fecha_nacimiento', 'dni_ejemplar',
  // DNI Dorso (4iDigital)
  'dni_domicilio', 'dni_jurisdiccion_residencia', 'dni_fecha_emision',
  'dni_fecha_vencimiento', 'dni_tramite', 'dni_vigente',
  // Declaración del cliente
  'ocupacion', 'es_pep',
];

// Documentos condicionales por tipo de entidad
// Para SH según normativa UIF:
// - DDJJ Representante: Obligatorio si el gestor NO es el representante designado en el contrato privado
//                       o si se otorgan facultades a un tercero
// - Poder: Obligatorio si existe delegación de facultades a terceros (apoderados)
const CONDITIONAL_DOCUMENTS = {
  sh: [
    {
      id: 'ddjj_representante',
      condition: 'gestor_no_es_representante',
      clientField: 'gestor_es_representante',
      triggerValue: 'No',
      name: 'DDJJ de Designación de Representante / Apoderado',
      description: 'Obligatorio si el gestor no es el representante designado en el contrato, o si se otorgan facultades a un tercero'
    },
    {
      id: 'poder',
      condition: 'tiene_apoderado_tercero',
      clientField: 'tiene_apoderado',
      triggerValue: 'Sí',
      name: 'Poder General o Especial',
      description: 'Obligatorio si se otorgan facultades a terceros'
    }
  ]
};

const COMPLEMENTARY_DOCUMENTS = [
  'ddjj_beneficiarios_finales',
  'ddjj_pep',
  'formulario_vinculo'
];

const validationService = {
  /**
   * Validate if a client has all required documents to be approved
   * @param {string} clientId
   * @returns {Promise<{isValid: boolean, missingDocuments: string[], conditionalMissing: string[]}>}
   */
  async validateClientDocuments(clientId) {
    const client = await Client.findByPk(clientId, {
      include: [{ model: Document, as: 'documents' }]
    });

    if (!client) {
      throw new Error('Client not found');
    }

    const { clientType, documents } = client;
    const uploadedDocTypes = documents.map(d => d.documentType);

    let specificRequirements = [];
    let includeComplementary = true;
    let legalFormKey = '';

    if (client.legalForm?.toLowerCase() === 'monotributista') {
      // PRD VF §6.2.1 — PF no carga archivos. Validamos formData (datos estructurados)
      // en lugar de documentos cargados.
      const formData = client.formData || {};
      // formData puede venir aplanado o agrupado por docId; aplanamos para chequear keys.
      const flatData = Object.values(formData).reduce((acc, v) => {
        if (v && typeof v === 'object') return { ...acc, ...v };
        return acc;
      }, { ...formData });

      const missingFields = PF_REQUIRED_FORM_FIELDS.filter(field => {
        const v = flatData[field];
        return v == null || v === '';
      });

      return {
        isValid: missingFields.length === 0,
        missingDocuments: missingFields,            // semántica reutilizada para no romper el contrato
        conditionalRequired: [],
        conditionalMissing: [],
        pfFormValidation: true,                     // hint para el caller: la validación corrió contra formData
      };
    } else if (clientType === 'persona_juridica') {
      legalFormKey = client.legalForm ? client.legalForm.toLowerCase() : '';
      if (legalFormKey === 'sa') specificRequirements = DOCUMENT_REQUIREMENTS.sa;
      else if (legalFormKey === 'srl') specificRequirements = DOCUMENT_REQUIREMENTS.srl;
      else if (legalFormKey === 'sh') specificRequirements = DOCUMENT_REQUIREMENTS.sh;
      else specificRequirements = [];
    }

    // Combine with complementary if applicable
    const allRequired = includeComplementary
      ? [...specificRequirements, ...COMPLEMENTARY_DOCUMENTS]
      : specificRequirements;

    const missingDocuments = allRequired.filter(reqDoc => !uploadedDocTypes.includes(reqDoc));

    // Check conditional documents for Sociedad de Hecho
    let conditionalMissing = [];
    let conditionalRequired = [];

    if (legalFormKey === 'sh') {
      const conditionalDocs = CONDITIONAL_DOCUMENTS.sh || [];
      const clientFormData = client.formData || {};

      conditionalDocs.forEach(condDoc => {
        const clientFieldValue = clientFormData[condDoc.clientField];
        const isRequired = clientFieldValue === condDoc.triggerValue;
        const isUploaded = uploadedDocTypes.includes(condDoc.id);

        if (isRequired && !isUploaded) {
          // El documento es obligatorio según los datos del cliente y no fue cargado
          conditionalRequired.push({
            id: condDoc.id,
            name: condDoc.name,
            reason: condDoc.description
          });
        } else if (!isUploaded && !clientFieldValue) {
          // No sabemos si es requerido porque el campo no fue completado
          conditionalMissing.push({
            id: condDoc.id,
            name: condDoc.name,
            condition: condDoc.condition,
            message: condDoc.description,
            pendingField: condDoc.clientField
          });
        }
      });
    }

    // Los documentos condicionales requeridos se suman a los faltantes obligatorios
    const allMissing = [...missingDocuments, ...conditionalRequired.map(d => d.id)];

    return {
      isValid: allMissing.length === 0,
      missingDocuments: allMissing,
      conditionalRequired, // Documentos condicionales que SON requeridos según datos del cliente
      conditionalMissing   // Documentos que podrían ser requeridos (pendiente determinar)
    };
  }
};

module.exports = validationService;
