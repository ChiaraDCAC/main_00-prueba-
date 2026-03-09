// Configuración de documentos requeridos según tipo de entidad

export const ENTITY_TYPES = {
  MONOTRIBUTISTA: 'monotributista',
  SA: 'sa',
  SRL: 'srl',
  SH: 'sh',
  SUCESION: 'sucesion',
};

export const ENTITY_TYPE_LABELS = {
  [ENTITY_TYPES.MONOTRIBUTISTA]: 'Monotributista',
  [ENTITY_TYPES.SA]: 'Sociedad Anónima (SA)',
  [ENTITY_TYPES.SRL]: 'Sociedad de Responsabilidad Limitada (SRL)',
  [ENTITY_TYPES.SH]: 'Sociedad de Hecho (SH)',
  [ENTITY_TYPES.SUCESION]: 'Sucesión / Sucesión Indivisa',
};

// Documentos requeridos por tipo de entidad
export const DOCUMENT_REQUIREMENTS = {


  [ENTITY_TYPES.MONOTRIBUTISTA]: [
    {
      id: 'dni_frente',
      name: 'DNI Frente',
      description: 'Fotografía del frente del DNI del titular',
      required: true,
      fields: [
        'dni_numero', 'dni_apellido', 'dni_nombre', 'dni_sexo', 'dni_nacionalidad',
        'dni_fecha_nacimiento', 'dni_ejemplar'
      ],
    },
    {
      id: 'dni_dorso',
      name: 'DNI Dorso',
      description: 'Fotografía del dorso del DNI del titular',
      required: true,
      fields: [
        'dni_domicilio', 'dni_fecha_emision', 'dni_fecha_vencimiento',
        'dni_tramite', 'dni_vigente'
      ],
    },
    {
      id: 'ddjj_pep_monotributo',
      name: 'Declaración Jurada PEP',
      description: 'Si es PEP o no se indica en la sección Personas',
      required: true,
      fields: ['ddjj_pep_fecha', 'ddjj_pep_observaciones'],
    },
  ],

  [ENTITY_TYPES.SA]: [
    {
      id: 'estatuto',
      name: 'Estatuto Social',
      description: 'Datos básicos de constitución de la sociedad',
      required: true,
      fields: [
        'tipo_societario', 'denominacion_social', 'sa_cuit',
        'fecha_constitucion', 'lugar_constitucion',
        'duracion_sociedad', 'capital_suscripto'
      ],
    },
    {
      id: 'acta_autoridades',
      name: 'Última Acta de Designación de Autoridades',
      description: 'Datos del acta - Las autoridades se cargan en la sección Personas',
      required: true,
      fields: ['mandato_vigente', 'periodo_mandato_inicio', 'periodo_mandato_fin'],
      // Nota: Las autoridades se gestionan en la sección "Personas de la Sociedad"
    },
    {
      id: 'registro_accionistas',
      name: 'Libro de Registro de Accionistas (última página)',
      description: 'Composición accionaria - Beneficiarios finales se cargan en Personas',
      required: true,
      fields: ['total_acciones', 'fecha_ultima_anotacion'],
      // Nota: Los beneficiarios finales se gestionan en la sección "Personas de la Sociedad"
    },
    {
      id: 'constancia_cuit',
      name: 'Constancia de Inscripción ARCA',
      description: 'Verificar que CUIT y Razón Social coincidan con el documento',
      required: false,
      fields: ['arca_razon_verificar', 'arca_cuit_verificar', 'arca_coincide', 'arca_observaciones'],
    },
    {
      id: 'poder_administracion',
      name: 'Poder General de Administración',
      description: 'Documento que acredita facultades del apoderado - Los datos del apoderado se cargan en Personas',
      required: true,
      fields: ['poder_verificado', 'poder_observaciones'],
    },
  ],

  [ENTITY_TYPES.SRL]: [
    {
      id: 'contrato_social',
      name: 'Contrato Social',
      description: 'Datos básicos de la sociedad - Los socios se cargan en la sección Personas',
      required: true,
      fields: [
        'srl_razon_social', 'srl_cuit', 'srl_fecha_constitucion',
        'srl_dom_calle', 'srl_dom_numero', 'srl_dom_piso', 'srl_dom_depto',
        'srl_dom_localidad', 'srl_dom_provincia', 'srl_dom_cp',
        'srl_plazo_duracion', 'srl_capital_social'
      ],
      // Nota: Los socios se gestionan en la sección "Personas de la Sociedad"
    },
    {
      id: 'acta_asamblea_srl',
      name: 'Última Acta de Asamblea o Reunión de Socios',
      description: 'Datos del acta - Los gerentes se cargan en la sección Personas',
      required: true,
      fields: ['srl_fecha_asamblea', 'srl_mandato_vigente', 'srl_periodo_mandato_inicio', 'srl_periodo_mandato_fin'],
      // Nota: Los gerentes se gestionan en la sección "Personas de la Sociedad" como Autoridades
    },
    {
      id: 'registro_socios_srl',
      name: 'Libro de Registro de Socios (última hoja)',
      description: 'Composición de cuotas - Los socios se cargan en Personas',
      required: true,
      fields: ['srl_total_cuotas', 'srl_fecha_ultima_anotacion'],
      // Nota: Los socios se gestionan en la sección "Personas de la Sociedad"
    },
    {
      id: 'constancia_cuit_srl',
      name: 'Constancia de Inscripción ARCA',
      description: 'Verificar que CUIT y Razón Social coincidan con el documento',
      required: false,
      fields: ['arca_razon_verificar', 'arca_cuit_verificar', 'arca_coincide', 'arca_observaciones'],
    },
    {
      id: 'poder_srl',
      name: 'Poder General de Administración',
      description: 'Obligatorio si tiene apoderados - Los datos del apoderado se cargan en Personas',
      required: false,
      conditionalText: 'Obligatorio si la sociedad opera con apoderados',
      fields: ['poder_verificado', 'poder_observaciones'],
    },
  ],

  [ENTITY_TYPES.SH]: [
    {
      id: 'contrato_privado',
      name: 'Contrato Social Privado / Acuerdo de Constitución',
      required: true,
      important: true,
      fields: [
        // Datos de identificación de la sociedad
        'sh_denominacion', 'sh_fecha_constitucion',
        'sh_dom_calle', 'sh_dom_numero', 'sh_dom_piso', 'sh_dom_depto',
        'sh_dom_localidad', 'sh_dom_provincia', 'sh_dom_cp',
        'sh_objeto_social', 'sh_cuit', 'sh_duracion', 'sh_capital_aportes',
        'sh_distribucion_utilidades',
        // Administración y representación
        'sh_tipo_administracion', 'sh_administradores', 'sh_administrador_dni_cuit',
        'sh_facultades_representacion'
      ],
      // Nota: Los socios se cargan en la sección "Personas" con el rol "Socio"
    },
    {
      id: 'dni_socios',
      name: 'DNI de todos los socios',
      required: true,
      important: true,
      multiple: true,
      // Un archivo por socio — los datos personales se cargan en la sección "Personas"
      fields: [],
    },
    {
      id: 'ddjj_representante',
      name: 'DDJJ de Designación de Representante / Apoderado',
      required: false,
      conditionalRequired: true,
      conditionalText: 'Obligatorio si el gestor no es el representante designado en el contrato, o si se otorgan facultades a un tercero',
      multiple: true,
      fields: [
        'sh_ddjj_apellido_representante', 'sh_ddjj_nombre_representante', 'sh_ddjj_dni_cuit_representante', 'sh_ddjj_domicilio_representante',
        'sh_ddjj_sociedad_representa', 'sh_ddjj_sociedad_cuit', 'sh_ddjj_caracter_invocado',
        'sh_ddjj_fecha', 'sh_ddjj_facultades', 'sh_ddjj_firma_otorgantes', 'sh_ddjj_certificacion_firma'
      ],
    },
  ],

  [ENTITY_TYPES.SUCESION]: [
    {
      id: 'declaratoria_herederos',
      name: 'Solicitud / Resolución de Declaratoria de Herederos',
      description: 'Documento judicial que determina los herederos legítimos. Los herederos se cargan en la sección "Personas".',
      required: true,
      fields: [
        'suc_section_expediente',
        'suc_juzgado', 'suc_expediente_numero', 'suc_caratula', 'suc_tipo_sucesion', 'suc_estado_tramite',
        'suc_section_causante',
        'suc_causante_apellido', 'suc_causante_nombre', 'suc_causante_dni', 'suc_causante_cuit', 'suc_causante_fecha_fallecimiento',
      ],
      // NOTA: Los herederos se cargan en la sección "Personas" con el rol "Heredero"
    },
    {
      id: 'designacion_administrador',
      name: 'Solicitud / Resolución de Designación de Administrador Judicial',
      description: 'Documento judicial de designación. El administrador se carga en la sección "Personas".',
      required: false,
      conditionalText: 'Solo si corresponde. Si no hay administrador → firma conjunta de herederos',
      fields: [
        'admin_section_existencia',
        'admin_existe',
        'admin_section_identificacion',
        'admin_tipo', 'admin_apellido', 'admin_nombre', 'admin_dni', 'admin_cuit', 'admin_relacion_sucesion',
        'admin_section_designacion',
        'admin_fecha_designacion', 'admin_juzgado', 'admin_expediente', 'admin_estado', 'admin_acepto_cargo', 'admin_fecha_aceptacion',
        'admin_section_facultades',
        'admin_fac_firma', 'admin_fac_cobros_pagos', 'admin_fac_administracion', 'admin_fac_cuentas', 'admin_limitaciones'
      ],
      // NOTA: Los datos del administrador (nombre, DNI, tipo, aceptación) se cargan en la sección "Personas" con el rol "Administrador"
      // Regla PSP: Si hay administrador vigente → firmante único | Si no hay → firma conjunta de herederos
      pspRule: {
        condition: 'admin_existe',
        ifTrue: 'firmante_unico',
        ifFalse: 'firma_conjunta_herederos'
      }
    },
    {
      id: 'solicitud_agj',
      name: 'Solicitud a la Administración General de Justicia',
      description: 'Oficio o solicitud presentada ante la AGJ en el marco de la sucesión.',
      required: false,
      conditionalText: 'Adjuntar si fue presentada ante la AGJ',
      fields: [
        'agj_numero_expediente', 'agj_fecha_presentacion', 'agj_estado', 'agj_observaciones'
      ],
    },
    {
      id: 'ficha_sucesion',
      name: 'Ficha de Sucesión - Resumen Compliance',
      description: 'Documento consolidado con datos clave de la sucesión y facultades de firma. Herederos y administrador se cargan en "Personas".',
      required: true,
      important: true,
      sections: [
        { id: 'bloque_sucesion', title: '🗂️ Datos de la Sucesión' },
        { id: 'bloque_firma', title: '✍️ Facultades de Firma' }
      ],
      fields: [
        // Bloque: Sucesión
        'ficha_tipo_sucesion', 'ficha_expediente', 'ficha_juzgado', 'ficha_estado_tramite',
        // Bloque: Facultades de firma
        'ficha_tipo_firma', 'ficha_documento_respaldo'
      ],
      // NOTA: Herederos y administrador se cargan en la sección "Personas" con sus respectivos roles
    },
    {
      id: 'dni_herederos',
      name: 'DNI de todos los herederos / administrador',
      description: 'Documento Nacional de Identidad (frente y dorso) de cada heredero y/o del administrador designado',
      required: true,
      multiple: true,
      helpText: 'Cargar un registro por cada persona (heredero o administrador). Adjuntar imagen de frente y dorso.',
      repeatableSections: [
        {
          id: 'dni_personas',
          title: 'Persona (Heredero / Administrador)',
          addLabel: '+ Agregar DNI de otra persona',
          fields: [
            // Tipo de persona
            'dni_tipo_persona',
            // Datos del DNI (frente)
            'dni_numero', 'dni_apellido', 'dni_nombre', 'dni_sexo', 'dni_nacionalidad',
            'dni_fecha_nacimiento', 'dni_fecha_emision', 'dni_fecha_vencimiento',
            // Datos del DNI (dorso)
            'dni_domicilio', 'dni_ejemplar', 'dni_tramite',
            // Validación para compliance
            'dni_coincide_declaratoria', 'dni_vigente', 'dni_observaciones',
            // Vínculo con la sucesión
            'dni_vinculo_causante', 'dni_es_firmante'
          ]
        }
      ]
    },
  ],
};

// Documentación complementaria obligatoria para TODOS los tipos
export const COMPLEMENTARY_DOCUMENTS = [
  {
    id: 'ddjj_beneficiarios_finales',
    name: 'Declaración Jurada de Beneficiarios Finales',
    description: 'Documento adjunto - Los BF se cargan en sección Personas',
    required: true,
    fields: ['ddjj_bf_fecha', 'ddjj_bf_observaciones'],
  },
  {
    id: 'ddjj_pep',
    name: 'Declaración Jurada PEP',
    description: 'Documento adjunto - Los PEP se marcan en sección Personas',
    required: true,
    multiple: true,
    fields: ['ddjj_pep_fecha', 'ddjj_pep_observaciones'],
  },
];

// Campos del formulario según el documento
export const FORM_FIELDS = {
  // Campos comunes persona
  numero_documento: { label: 'Número de Documento', type: 'text', placeholder: '12345678' },
  apellido: { label: 'Apellido', type: 'text' },
  nombre: { label: 'Nombre', type: 'text' },
  fecha_nacimiento: { label: 'Fecha de Nacimiento', type: 'date' },
  sexo: { label: 'Sexo', type: 'select', options: ['Masculino', 'Femenino', 'Otro'] },
  domicilio: { label: 'Domicilio', type: 'text' },
  domicilio_real: { label: 'Domicilio Real', type: 'text' },
  fecha_emision: { label: 'Fecha de Emisión', type: 'date' },
  fecha_vencimiento: { label: 'Fecha de Vencimiento', type: 'date' },
  cuit: { label: 'CUIT', type: 'text', placeholder: '20-12345678-9' },

  // 1. DATOS DE IDENTIFICACIÓN LEGAL
  denominacion_social: { label: 'Denominación Social', type: 'text' },
  sa_cuit: { label: 'CUIT', type: 'text', placeholder: '30-12345678-9' },
  tipo_societario: { label: 'Tipo Societario', type: 'text', defaultValue: 'S.A.', readOnly: true },
  fecha_constitucion: { label: 'Fecha de Constitución', type: 'date' },
  lugar_constitucion: { label: 'Domicilio Social', type: 'text' },
  domicilio_calle: { label: 'Calle', type: 'text', placeholder: 'Ej: Av. Corrientes' },
  domicilio_numero: { label: 'Número', type: 'text', placeholder: 'Ej: 1234' },
  domicilio_piso: { label: 'Piso', type: 'text', placeholder: 'Ej: 3' },
  domicilio_depto: { label: 'Depto', type: 'text', placeholder: 'Ej: A' },
  domicilio_localidad: { label: 'Localidad', type: 'text', placeholder: 'Ej: Buenos Aires' },
  domicilio_provincia: { label: 'Provincia', type: 'text', placeholder: 'Ej: CABA' },
  domicilio_cp: { label: 'Código Postal', type: 'text', placeholder: 'Ej: C1043' },
  duracion_sociedad: { label: 'Duración de la Sociedad', type: 'text', placeholder: 'Ej: 99 años' },
  registro_inscripcion: { label: 'Registro de Inscripción', type: 'select', options: ['IGJ', 'Registro Público Provincial', 'Otro'] },
  numero_inscripcion: { label: 'Número de Inscripción', type: 'text' },
  fecha_inscripcion_registro: { label: 'Fecha de Inscripción en Registro', type: 'date' },

  // 2. OBJETO Y ACTIVIDAD
  objeto_social: { label: 'Objeto Social Declarado', type: 'textarea', placeholder: 'Descripción del objeto social según estatuto' },
  actividades_habilitadas: { label: 'Actividades Habilitadas', type: 'textarea', placeholder: 'Lista de actividades permitidas' },

  // 3. CAPITAL SOCIAL
  capital_suscripto: { label: 'Capital Social Suscripto', type: 'text', placeholder: 'Ej: $1.000.000' },
  capital_integrado: { label: 'Capital Integrado', type: 'text', placeholder: 'Si figura en estatuto' },
  valor_nominal_acciones: { label: 'Valor Nominal de Acciones/Cuotas', type: 'text' },
  tipo_clase_acciones: { label: 'Tipo/Clase de Acciones', type: 'text', placeholder: 'Ej: Ordinarias, Preferidas' },

  // 4. ÓRGANO DE ADMINISTRACIÓN
  cargos_organo: { label: 'Cargos del Órgano', type: 'textarea', placeholder: 'Presidente, Vicepresidente, Directores, etc.' },

  // 5. REPRESENTACIÓN LEGAL
  representante_legal: { label: 'Quién Ejerce la Representación Legal', type: 'text', placeholder: 'Cargo o persona' },
  forma_actuacion: { label: 'Forma de Actuación', type: 'select', options: ['Individual', 'Conjunta', 'Indistinta'] },
  alcance_facultades: { label: 'Alcance de Facultades', type: 'select', options: ['Administración', 'Disposición', 'Administración y Disposición', 'Plenas facultades'] },

  // 6. ÓRGANO DE FISCALIZACIÓN
  tiene_sindico: { label: '¿Tiene Síndico/Comisión Fiscalizadora?', type: 'select', options: ['Sí', 'No', 'Prescinde (Art. 284 LGS)'] },

  // Campos legacy (mantener compatibilidad)
  razon_social: { label: 'Razón Social', type: 'text' },
  capital_social: { label: 'Capital Social', type: 'number' },
  duracion: { label: 'Duración', type: 'text' },

  // AUTORIDADES DESIGNADAS (campos dinámicos)
  autoridad_apellido: { label: 'Apellido', type: 'text' },
  autoridad_nombre: { label: 'Nombre', type: 'text' },
  autoridad_documento: { label: 'Tipo y Nro Documento', type: 'text', placeholder: 'DNI 12345678' },
  autoridad_cargo: { label: 'Cargo', type: 'select', options: ['Presidente', 'Vicepresidente', 'Director Titular', 'Director Suplente', 'Gerente General', 'Síndico', 'Otro'] },
  autoridad_fecha_inicio: { label: 'Fecha Inicio Mandato', type: 'date' },
  autoridad_fecha_vencimiento: { label: 'Fecha Vencimiento', type: 'date' },
  autoridad_aceptacion: { label: 'Aceptación del Cargo', type: 'select', options: ['Explícita en Acta', 'Implícita', 'Pendiente'] },
  autoridad_domicilio: { label: 'Domicilio Constituido', type: 'text' },

  // VIGENCIA DE AUTORIDADES
  mandato_vigente: { label: '¿Mandato Vigente?', type: 'select', options: ['Sí', 'No', 'Próximo a vencer'] },
  periodo_mandato_inicio: { label: 'Año Inicio Mandato', type: 'select', options: ['2020', '2021', '2022', '2023', '2024', '2025', '2026', '2027', '2028', '2029', '2030'] },
  periodo_mandato_fin: { label: 'Año Fin Mandato', type: 'select', options: ['2020', '2021', '2022', '2023', '2024', '2025', '2026', '2027', '2028', '2029', '2030', '2031', '2032', '2033', '2034', '2035'] },

  // FIRMA / AUTORIDAD DEL ACTA
  quien_preside_reunion: { label: 'Quién Preside la Reunión', type: 'text' },
  firmantes_acta: { label: 'Firmantes del Acta', type: 'textarea', placeholder: 'Nombres de quienes firman el acta' },

  // ACCIONISTAS (campos dinámicos)
  accionista_nombre: { label: 'Nombre/Razón Social', type: 'text' },
  accionista_documento: { label: 'CUIT/DNI', type: 'text' },
  accionista_porcentaje: { label: '% Participación', type: 'number' },
  accionista_acciones: { label: 'Cantidad de Acciones', type: 'number' },
  accionista_tipo_acciones: { label: 'Tipo de Acciones', type: 'select', options: ['Ordinarias', 'Preferidas', 'Escriturales'] },

  // Totales accionistas
  total_acciones: { label: 'Total de Acciones Emitidas', type: 'number' },
  fecha_ultima_anotacion: { label: 'Fecha Última Anotación en Libro', type: 'date' },

  // === CAMPOS SRL ===
  // Datos de la sociedad SRL - Identificación Societaria
  srl_razon_social: { label: 'Razón Social', type: 'text', placeholder: 'Ej: Mi Empresa S.R.L.' },
  srl_cuit: { label: 'CUIT', type: 'text', placeholder: '30-12345678-9' },
  srl_fecha_constitucion: { label: 'Fecha Constitución', type: 'date' },
  srl_dom_calle: { label: 'Calle', type: 'text', placeholder: 'Ej: Av. Corrientes' },
  srl_dom_numero: { label: 'Número', type: 'text', placeholder: 'Ej: 1234' },
  srl_dom_piso: { label: 'Piso', type: 'text', placeholder: 'Ej: 3' },
  srl_dom_depto: { label: 'Depto', type: 'text', placeholder: 'Ej: A' },
  srl_dom_localidad: { label: 'Localidad', type: 'text', placeholder: 'Ej: Buenos Aires' },
  srl_dom_provincia: { label: 'Provincia', type: 'text', placeholder: 'Ej: CABA' },
  srl_dom_cp: { label: 'Código Postal', type: 'text', placeholder: 'Ej: C1425' },
  srl_sede_social: { label: 'Sede Social', type: 'text' },
  srl_plazo_duracion: { label: 'Plazo', type: 'text', placeholder: 'Ej: 99 años' },
  srl_capital_social: { label: 'Capital Social', type: 'text', placeholder: 'Ej: $100.000' },
  srl_valor_cuota_social: { label: 'Valor de la Cuota Social', type: 'text', placeholder: 'Ej: $1.000' },

  // Socios SRL (dinámico)
  socio_nombre: { label: 'Nombre', type: 'text' },
  socio_documento: { label: 'Documento', type: 'text', placeholder: 'DNI 12345678' },
  socio_cuit: { label: 'CUIT', type: 'text', placeholder: '20-12345678-9' },
  socio_porcentaje: { label: '% Participación', type: 'number' },
  socio_domicilio: { label: 'Domicilio', type: 'text' },

  // Gerentes SRL (dinámico)
  gerente_nombre: { label: 'Nombre', type: 'text' },
  gerente_cargo: { label: 'Cargo', type: 'select', options: ['Gerente', 'Gerente General', 'Socio Gerente', 'Co-Gerente'] },

  // Acta SRL
  srl_fecha_asamblea: { label: 'Fecha de Asamblea/Reunión', type: 'date' },
  srl_tipo_firma: { label: 'Tipo de Firma', type: 'select', options: ['Indistinta', 'Conjunta', 'Según contrato'] },
  srl_quien_preside: { label: 'Quién Preside', type: 'text' },
  srl_firmantes: { label: 'Firmantes del Acta', type: 'textarea' },

  // Libro de Socios SRL
  srl_total_cuotas: { label: 'Total de Cuotas Emitidas', type: 'number' },
  srl_fecha_ultima_anotacion: { label: 'Fecha Última Anotación', type: 'date' },

  // Legacy (mantener compatibilidad)
  presidente: { label: 'Presidente', type: 'text' },
  vicepresidente: { label: 'Vicepresidente', type: 'text' },
  directores: { label: 'Directores', type: 'textarea', placeholder: 'Nombre - Cargo (uno por línea)' },
  gerentes: { label: 'Gerentes', type: 'textarea' },
  gerentes_designados: { label: 'Gerentes Designados', type: 'textarea' },
  fecha_designacion: { label: 'Fecha de Designación', type: 'date' },
  vigencia_mandato: { label: 'Vigencia del Mandato', type: 'text' },
  tipo_firma: { label: 'Tipo de Firma', type: 'select', options: ['Indistinta', 'Conjunta', 'Según estatuto'] },

  // Accionistas/Socios
  accionistas: { label: 'Accionistas', type: 'textarea', placeholder: 'Nombre - % participación' },
  socios: { label: 'Socios', type: 'textarea', placeholder: 'Nombre - % participación' },
  porcentajes_participacion: { label: 'Porcentajes de Participación', type: 'textarea' },
  cantidad_acciones: { label: 'Cantidad de Acciones', type: 'number' },
  cuotas_sociales: { label: 'Cuotas Sociales', type: 'number' },

  // Apoderados
  apoderado: { label: 'Apoderado', type: 'text' },
  apoderado_apellido: { label: 'Apellido del Apoderado', type: 'text' },
  apoderado_nombre: { label: 'Nombre del Apoderado', type: 'text' },
  poderdante: { label: 'Poderdante', type: 'text' },
  facultades: { label: 'Facultades', type: 'textarea' },
  fecha_otorgamiento: { label: 'Fecha de Otorgamiento', type: 'date' },
  vigencia: { label: 'Vigencia', type: 'text' },

  // Verificación de Poder
  poder_verificado: {
    label: '¿Poder verificado y vigente?',
    type: 'select',
    options: ['Sí', 'No', 'Pendiente revisar'],
    helpText: 'Los datos del apoderado se completan en la pestaña Personas'
  },
  poder_observaciones: {
    label: 'Observaciones del Poder',
    type: 'textarea',
    placeholder: 'Notas sobre el documento de poder...'
  },

  // SRL - Campos adicionales
  srl_mandato_vigente: { label: 'Mandato Vigente', type: 'yesno' },
  srl_periodo_mandato_inicio: { label: 'Inicio del Mandato', type: 'date' },
  srl_periodo_mandato_fin: { label: 'Fin del Mandato', type: 'date' },

  // ==========================================
  // SOCIEDAD DE HECHO - Contrato Social Privado
  // ==========================================

  // Datos de identificación de la sociedad
  sh_denominacion: { label: 'Denominación / Nombre de la sociedad', type: 'text', placeholder: 'Si figura en el documento' },
  sh_tipo_figura: {
    label: 'Tipo / Figura',
    type: 'select',
    options: ['Sociedad de Hecho', 'Acuerdo Privado', 'Sociedad Irregular', 'Otro']
  },
  sh_fecha_constitucion: { label: 'Fecha de constitución / firma del acuerdo', type: 'date' },
  sh_dom_calle: { label: 'Calle', type: 'text', placeholder: 'Ej: Av. Corrientes' },
  sh_dom_numero: { label: 'Número', type: 'text', placeholder: 'Ej: 1234' },
  sh_dom_piso: { label: 'Piso', type: 'text', placeholder: 'Ej: 3' },
  sh_dom_depto: { label: 'Depto', type: 'text', placeholder: 'Ej: A' },
  sh_dom_localidad: { label: 'Localidad', type: 'text', placeholder: 'Ej: Buenos Aires' },
  sh_dom_provincia: { label: 'Provincia', type: 'text', placeholder: 'Ej: CABA' },
  sh_dom_cp: { label: 'Código Postal', type: 'text', placeholder: 'Ej: C1043' },
  sh_objeto_social: { label: 'Objeto / Actividad (objeto social)', type: 'textarea', placeholder: 'Descripción del objeto social según contrato' },
  sh_cuit: { label: 'CUIT de la sociedad', type: 'text', placeholder: 'Si figura - Ej: 30-12345678-9' },
  sh_duracion: { label: 'Duración', type: 'text', placeholder: 'Si figura - Ej: 99 años / Indeterminada' },
  sh_capital_aportes: { label: 'Capital / Aportes', type: 'text', placeholder: 'Si figura - Monto y tipo de aportes' },
  sh_distribucion_utilidades: { label: 'Reglas de distribución de utilidades/pérdidas', type: 'textarea', placeholder: 'Si figura' },

  // Socios (campos para repeatable section)
  sh_socio_apellido: { label: 'Apellido', type: 'text' },
  sh_socio_nombre: { label: 'Nombre', type: 'text' },
  sh_socio_dni: { label: 'DNI', type: 'text', placeholder: '12345678' },
  sh_socio_cuit: { label: 'CUIT', type: 'text', placeholder: '20-12345678-9' },
  sh_socio_domicilio: { label: 'Domicilio', type: 'text', placeholder: 'Si figura' },
  sh_socio_porcentaje: { label: 'Porcentaje de participación / cuota-parte', type: 'text', placeholder: 'Ej: 50%' },
  sh_socio_firma: {
    label: 'Firma presente',
    type: 'yesno',
    helpText: 'Verificar presencia de firma del socio en el documento'
  },
  sh_socio_cargo: {
    label: 'Cargo/Rol',
    type: 'select',
    options: ['Socio', 'Socio Administrador', 'Socio Gerente', 'Otro'],
    placeholder: 'Si se menciona'
  },

  // Administración y representación
  sh_tipo_administracion: {
    label: 'Tipo de administración',
    type: 'select',
    options: ['No especificado', 'Conjunta', 'Indistinta'],
    helpText: 'Si figura en el contrato'
  },
  sh_administradores: { label: 'Nombre del/los administradores/representantes', type: 'textarea', placeholder: 'Listar nombres' },
  sh_administrador_dni_cuit: { label: 'DNI/CUIT del/los administradores/representantes', type: 'textarea', placeholder: 'Listar DNI/CUIT' },
  sh_facultades_representacion: {
    label: 'Facultades/alcance de representación',
    type: 'textarea',
    placeholder: 'Operar cuentas, firmar contratos, etc. (si está detallado)'
  },

  // ==========================================
  // SOCIEDAD DE HECHO - DDJJ Representante/Apoderado
  // ==========================================

  sh_ddjj_apellido_representante: { label: 'Apellido del representante/apoderado', type: 'text' },
  sh_ddjj_nombre_representante: { label: 'Nombre del representante/apoderado', type: 'text' },
  sh_ddjj_dni_cuit_representante: { label: 'DNI / CUIT del representante/apoderado', type: 'text' },
  sh_ddjj_domicilio_representante: { label: 'Domicilio del representante/apoderado', type: 'text', placeholder: 'Si figura' },
  sh_ddjj_sociedad_representa: { label: 'Sociedad a la que representa (nombre)', type: 'text' },
  sh_ddjj_sociedad_cuit: { label: 'CUIT de la sociedad que representa', type: 'text', placeholder: 'Si figura' },
  sh_ddjj_caracter_invocado: {
    label: 'Carácter invocado',
    type: 'select',
    options: ['Representante', 'Apoderado', 'Representante y Apoderado', 'Otro']
  },
  sh_ddjj_fecha: { label: 'Fecha de la DDJJ', type: 'date' },
  sh_ddjj_facultades: { label: 'Facultades otorgadas / alcance', type: 'textarea', placeholder: 'Si figura' },
  sh_ddjj_firma_otorgantes: {
    label: 'Firma del/los otorgantes y/o representante',
    type: 'select',
    options: ['Presente', 'No presente'],
    helpText: 'Según corresponda al documento'
  },
  sh_ddjj_certificacion_firma: {
    label: 'Certificación de firma / escribano',
    type: 'select',
    options: ['Sí', 'No', 'No aplica'],
    helpText: 'Si figura'
  },

  // ==========================================
  // SUCESIÓN - Declaratoria de Herederos
  // ==========================================

  // Datos del expediente (trazabilidad legal)
  suc_juzgado: { label: 'Juzgado', type: 'text', placeholder: 'Ej: Juzgado Civil Nº 5, CABA' },
  suc_expediente_numero: { label: 'Nº de Expediente', type: 'text', placeholder: 'Ej: 12345/2024' },
  suc_caratula: { label: 'Carátula', type: 'text', placeholder: 'Ej: "García Juan s/ Sucesión ab intestato"' },
  suc_tipo_sucesion: {
    label: 'Tipo de Sucesión',
    type: 'select',
    options: ['Ab intestato', 'Testamentaria']
  },
  suc_estado_tramite: {
    label: 'Estado del Trámite',
    type: 'select',
    options: ['En trámite', 'Declaratoria dictada', 'Firme']
  },

  // Solicitud AGJ
  agj_numero_expediente: { label: 'N° de Expediente / Oficio', type: 'text', placeholder: 'Ej: 12345/2024' },
  agj_fecha_presentacion: { label: 'Fecha de Presentación', type: 'date' },
  agj_estado: {
    label: 'Estado',
    type: 'select',
    options: ['Presentado', 'En curso', 'Respondido', 'Archivado']
  },
  agj_observaciones: { label: 'Observaciones', type: 'textarea', placeholder: 'Notas relevantes sobre la solicitud...' },

  // Section headers (tipo especial para separadores visuales en el formulario)
  suc_section_expediente: { label: 'Datos de la Sucesión', type: 'section' },
  suc_section_causante: { label: 'Datos del Causante', type: 'section' },
  admin_section_existencia: { label: 'A · Existencia del Administrador', type: 'section' },
  admin_section_identificacion: { label: 'B · Identificación del Administrador', type: 'section' },
  admin_section_designacion: { label: 'C · Designación y Vigencia', type: 'section' },
  admin_section_facultades: { label: 'D · Facultades (operativa PSP)', type: 'section' },

  // Datos del causante
  suc_causante_apellido: { label: 'Apellido del Causante', type: 'text' },
  suc_causante_nombre: { label: 'Nombre del Causante', type: 'text' },
  suc_causante_dni: { label: 'DNI del Causante', type: 'text', placeholder: '12345678' },
  suc_causante_cuit: { label: 'CUIT del Causante (si surge)', type: 'text', placeholder: '20-12345678-9' },
  suc_causante_tipo_persona: {
    label: 'Tipo de Persona',
    type: 'select',
    options: ['Persona Humana'],
    defaultValue: 'Persona Humana'
  },
  suc_causante_fecha_fallecimiento: { label: 'Fecha de Fallecimiento', type: 'date' },

  // Herederos (campos dinámicos para repeatable section)
  heredero_apellido: { label: 'Apellido', type: 'text' },
  heredero_nombre: { label: 'Nombre', type: 'text' },
  heredero_dni: { label: 'DNI', type: 'text', placeholder: '12345678' },
  heredero_cuit: { label: 'CUIT/CUIL', type: 'text', placeholder: '20-12345678-9' },
  heredero_domicilio: { label: 'Domicilio (real o constituido)', type: 'text' },
  heredero_rol: {
    label: 'Rol',
    type: 'select',
    options: ['Heredero'],
    defaultValue: 'Heredero'
  },
  heredero_tipo: {
    label: 'Tipo de Heredero',
    type: 'select',
    options: ['Forzoso', 'Testamentario', 'No especificado']
  },
  heredero_comparece: {
    label: '¿Comparece en autos?',
    type: 'yesno',
  },

  // ==========================================
  // SUCESIÓN - Designación de Administrador Judicial
  // ==========================================

  // Identificación del administrador
  admin_existe: {
    label: '¿Existe administrador designado?',
    type: 'yesno',
    important: true,
    helpText: 'Si NO existe → firma conjunta de todos los herederos'
  },
  admin_tipo: {
    label: 'Tipo de Administrador',
    type: 'select',
    options: ['Administrador judicial', 'Heredero administrador'],
    condition: { field: 'admin_existe', value: 'Sí' }
  },
  admin_apellido: {
    label: 'Apellido',
    type: 'text',
    condition: { field: 'admin_existe', value: 'Sí' }
  },
  admin_nombre: {
    label: 'Nombre',
    type: 'text',
    condition: { field: 'admin_existe', value: 'Sí' }
  },
  admin_dni: {
    label: 'DNI',
    type: 'text',
    placeholder: '12345678',
    condition: { field: 'admin_existe', value: 'Sí' }
  },
  admin_cuit: {
    label: 'CUIT/CUIL',
    type: 'text',
    placeholder: '20-12345678-9',
    condition: { field: 'admin_existe', value: 'Sí' }
  },
  admin_domicilio: {
    label: 'Domicilio',
    type: 'text',
    condition: { field: 'admin_existe', value: 'Sí' }
  },
  admin_relacion_sucesion: {
    label: 'Relación con la Sucesión',
    type: 'select',
    options: ['Heredero', 'Abogado', 'Tercero'],
    condition: { field: 'admin_existe', value: 'Sí' }
  },

  // Datos de la designación
  admin_juzgado: {
    label: 'Juzgado',
    type: 'text',
    placeholder: 'Ej: Juzgado Civil Nº 5, CABA',
    condition: { field: 'admin_existe', value: 'Sí' }
  },
  admin_expediente: {
    label: 'Nº de Expediente',
    type: 'text',
    placeholder: 'Ej: 12345/2024',
    condition: { field: 'admin_existe', value: 'Sí' }
  },
  admin_fecha_designacion: {
    label: 'Fecha de Designación',
    type: 'date',
    condition: { field: 'admin_existe', value: 'Sí' }
  },
  admin_estado: {
    label: 'Estado',
    type: 'select',
    options: ['Provisional', 'Definitivo'],
    condition: { field: 'admin_existe', value: 'Sí' }
  },
  admin_acepto_cargo: {
    label: '¿Aceptó el cargo?',
    type: 'select',
    options: ['Sí', 'Pendiente'],
    condition: { field: 'admin_existe', value: 'Sí' }
  },
  admin_fecha_aceptacion: {
    label: 'Fecha de Aceptación del Cargo',
    type: 'date',
    condition: { field: 'admin_acepto_cargo', value: 'Sí' }
  },

  // Facultades (clave para PSP)
  admin_fac_administracion: {
    label: '¿Puede administrar bienes / cuentas?',
    type: 'select',
    options: ['Sí', 'No', 'No especificado'],
    condition: { field: 'admin_existe', value: 'Sí' }
  },
  admin_fac_firma: {
    label: '¿Puede firmar en nombre de la sucesión?',
    type: 'select',
    options: ['Sí', 'No', 'No especificado'],
    condition: { field: 'admin_existe', value: 'Sí' }
  },
  admin_fac_cobros_pagos: {
    label: '¿Puede cobrar y/o pagar?',
    type: 'select',
    options: ['Sí', 'No', 'No especificado'],
    condition: { field: 'admin_existe', value: 'Sí' }
  },
  admin_fac_cuentas: {
    label: '¿Puede abrir / cerrar cuentas?',
    type: 'select',
    options: ['Sí', 'No', 'No especificado'],
    important: true,
    helpText: 'Clave para operatoria PSP',
    condition: { field: 'admin_existe', value: 'Sí' }
  },
  admin_limitaciones: {
    label: 'Limitaciones (si las hubiera)',
    type: 'textarea',
    placeholder: 'Describir limitaciones específicas de la resolución judicial',
    condition: { field: 'admin_existe', value: 'Sí' }
  },

  // ==========================================
  // SUCESIÓN - Ficha Resumen Compliance
  // ==========================================

  // Bloque: Sucesión
  ficha_tipo_sucesion: {
    label: 'Tipo de Sucesión',
    type: 'select',
    options: ['Ab intestato', 'Testamentaria'],
    section: 'bloque_sucesion'
  },
  ficha_expediente: {
    label: 'Nº de Expediente',
    type: 'text',
    placeholder: 'Ej: 12345/2024',
    section: 'bloque_sucesion'
  },
  ficha_juzgado: {
    label: 'Juzgado',
    type: 'text',
    placeholder: 'Ej: Juzgado Civil Nº 5, CABA',
    section: 'bloque_sucesion'
  },
  ficha_estado_tramite: {
    label: 'Estado del Trámite',
    type: 'select',
    options: ['En trámite', 'Declaratoria dictada', 'Firme'],
    section: 'bloque_sucesion'
  },

  // Bloque: Herederos (repetible)
  ficha_her_apellido: { label: 'Apellido', type: 'text' },
  ficha_her_nombre: { label: 'Nombre', type: 'text' },
  ficha_her_dni: { label: 'DNI', type: 'text', placeholder: '12345678' },
  ficha_her_rol: {
    label: 'Rol',
    type: 'select',
    options: ['Heredero'],
    defaultValue: 'Heredero',
    readOnly: true
  },
  ficha_her_beneficiario_final: {
    label: 'Beneficiario Final',
    type: 'yesno',
    defaultValue: 'Sí',
    important: true,
    helpText: 'Los herederos son beneficiarios finales de la sucesión'
  },

  // Bloque: Administrador (si existe)
  ficha_admin_apellido: { label: 'Apellido', type: 'text' },
  ficha_admin_nombre: { label: 'Nombre', type: 'text' },
  ficha_admin_dni: { label: 'DNI', type: 'text', placeholder: '12345678' },
  ficha_admin_rol: {
    label: 'Rol',
    type: 'select',
    options: ['Administrador judicial', 'Heredero administrador'],
    defaultValue: 'Administrador judicial'
  },
  ficha_admin_firmante: {
    label: 'Firmante Autorizado',
    type: 'yesno',
    defaultValue: 'Sí',
    important: true
  },

  // Bloque: Facultades de firma
  ficha_tipo_firma: {
    label: 'Tipo de Firma',
    type: 'select',
    options: ['Administrador único', 'Firma conjunta herederos'],
    important: true,
    helpText: 'Define quién puede firmar en nombre de la sucesión',
    section: 'bloque_firma'
  },
  ficha_documento_respaldo: {
    label: 'Documento de Respaldo',
    type: 'select',
    options: ['Declaratoria de Herederos', 'Designación de Administrador', 'Ambos'],
    helpText: 'Documento que respalda la facultad de firma',
    section: 'bloque_firma'
  },

  // ==========================================
  // SUCESIÓN - DNI Herederos / Administrador
  // ==========================================

  // Tipo de persona
  dni_tipo_persona: {
    label: 'Tipo de Persona',
    type: 'select',
    options: ['Heredero', 'Administrador', 'Heredero y Administrador'],
    important: true
  },

  // Datos del DNI (FRENTE)
  dni_numero: { label: 'Número de DNI', type: 'text', placeholder: '12345678' },
  dni_apellido: { label: 'Apellido', type: 'text' },
  dni_nombre: { label: 'Nombre/s', type: 'text' },
  dni_sexo: {
    label: 'Sexo',
    type: 'select',
    options: ['M', 'F', 'X']
  },
  dni_nacionalidad: {
    label: 'Nacionalidad',
    type: 'select',
    options: ['Argentina', 'Extranjera']
  },
  dni_fecha_nacimiento: { label: 'Fecha de Nacimiento', type: 'date' },
  dni_fecha_emision: { label: 'Fecha de Emisión', type: 'date' },
  dni_fecha_vencimiento: {
    label: 'Fecha de Vencimiento',
    type: 'date',
    important: true,
    helpText: 'Verificar vigencia del documento'
  },

  // Datos del DNI (DORSO)
  dni_domicilio: { label: 'Domicilio (según DNI)', type: 'text' },
  dni_ejemplar: {
    label: 'Ejemplar',
    type: 'select',
    options: ['A', 'B', 'C', 'D', 'E', 'F']
  },
  dni_tramite: { label: 'Nº de Trámite', type: 'text', placeholder: 'Número de 11 dígitos del dorso' },

  // Validación para compliance
  dni_coincide_declaratoria: {
    label: '¿Datos coinciden con Declaratoria?',
    type: 'select',
    options: ['Sí', 'No', 'Parcialmente'],
    important: true,
    helpText: 'Verificar que nombre y DNI coincidan con la declaratoria de herederos'
  },
  dni_vigente: {
    label: '¿DNI vigente?',
    type: 'select',
    options: ['Sí', 'No', 'Próximo a vencer'],
    important: true
  },
  dni_observaciones: {
    label: 'Observaciones',
    type: 'textarea',
    placeholder: 'Discrepancias, datos ilegibles, etc.'
  },

  // Vínculo con la sucesión
  dni_vinculo_causante: {
    label: 'Vínculo con el Causante',
    type: 'select',
    options: ['Cónyuge', 'Hijo/a', 'Padre/Madre', 'Hermano/a', 'Nieto/a', 'Abuelo/a', 'Sobrino/a', 'Tercero (administrador)', 'Otro']
  },
  dni_es_firmante: {
    label: '¿Es firmante autorizado?',
    type: 'yesno',
    important: true,
    helpText: 'Indica si esta persona firmará en nombre de la sucesión'
  },

  // Legacy (mantener compatibilidad)
  dni_heredero_numero: { label: 'Número de DNI', type: 'text', placeholder: '12345678' },
  dni_heredero_apellido: { label: 'Apellido', type: 'text' },
  dni_heredero_nombre: { label: 'Nombre', type: 'text' },
  dni_heredero_domicilio: { label: 'Domicilio según DNI', type: 'text' },
  dni_heredero_vinculo: {
    label: 'Vínculo con el Causante',
    type: 'select',
    options: ['Cónyuge', 'Hijo/a', 'Padre/Madre', 'Hermano/a', 'Nieto/a', 'Otro']
  },

  // Legacy (mantener compatibilidad)
  causante: { label: 'Causante', type: 'text' },
  herederos: { label: 'Herederos', type: 'textarea', placeholder: 'Nombre - Vínculo - % participación' },
  fecha_declaratoria: { label: 'Fecha de Declaratoria', type: 'date' },
  juzgado: { label: 'Juzgado', type: 'text' },
  administrador: { label: 'Administrador', type: 'text' },
  vinculo_causante: { label: 'Vínculo con el Causante', type: 'text' },

  // Monotributo
  categoria_monotributo: { label: 'Categoría Monotributo', type: 'select', options: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'] },
  actividad_principal: { label: 'Actividad Principal', type: 'text' },
  fecha_inscripcion: { label: 'Fecha de Inscripción', type: 'date' },
  domicilio_fiscal: { label: 'Domicilio Fiscal', type: 'text' },

  // DNI Fotos - Monotributista
  foto_dni_frente: {
    label: 'Foto DNI - Frente',
    type: 'file',
    accept: 'image/*',
    helpText: 'Cargar imagen del frente del DNI',
    important: true
  },
  foto_dni_dorso: {
    label: 'Foto DNI - Dorso',
    type: 'file',
    accept: 'image/*',
    helpText: 'Cargar imagen del dorso del DNI',
    important: true
  },

  // PEP
  es_pep: { label: '¿Es PEP?', type: 'yesno' },
  cargo_funcion: { label: 'Cargo/Función', type: 'text' },
  organismo: { label: 'Organismo', type: 'text' },
  fecha_inicio: { label: 'Fecha Inicio Cargo', type: 'date' },
  fecha_fin: { label: 'Fecha Fin Cargo', type: 'date' },

  // Beneficiarios
  beneficiarios: { label: 'Beneficiarios Finales', type: 'textarea', placeholder: 'Nombre - CUIT - % participación' },
  porcentaje_participacion: { label: 'Porcentaje de Participación', type: 'number' },
  tipo_control: { label: 'Tipo de Control', type: 'select', options: ['Directo', 'Indirecto', 'Control efectivo'] },

  // Otros
  actividades: { label: 'Actividades', type: 'textarea' },
  representante: { label: 'Representante', type: 'text' },
  objeto: { label: 'Objeto', type: 'textarea' },
  rol: { label: 'Rol', type: 'text' },
  fecha_asamblea: { label: 'Fecha de Asamblea/Reunión', type: 'date' },
  estado_vigencia: { label: 'Estado de Vigencia', type: 'select', options: ['Vigente', 'Vencido', 'Próximo a vencer'] },
  fecha_inscripcion_afip: { label: 'Fecha Inscripción ARCA', type: 'date' },
  // Campos adicionales Monotributo/Persona
  tipo_documento: { label: 'Tipo de Documento', type: 'select', options: ['DNI', 'LE', 'LC', 'PASAPORTE'] },
  estado_civil: { label: 'Estado Civil', type: 'select', options: ['Soltero', 'Casado', 'Divorciado', 'Viudo', 'Unión Convivencial'] },
  telefono: { label: 'Teléfono', type: 'text' },
  lugar_nacimiento: { label: 'Lugar de Nacimiento', type: 'text' },
  nacionalidad: { label: 'Nacionalidad', type: 'text' },
  actividad_laboral: { label: 'Actividad Laboral', type: 'text' },
  email: { label: 'Correo Electrónico', type: 'email' },

  // Campos Cónyuge
  conyuge_apellido: {
    label: 'Apellido del Cónyuge',
    type: 'text',
    condition: { field: 'estado_civil', value: 'Casado' }
  },
  conyuge_nombre: {
    label: 'Nombre del Cónyuge',
    type: 'text',
    condition: { field: 'estado_civil', value: 'Casado' }
  },
  conyuge_documento: {
    label: 'Tipo y Número de Documento (Cónyuge)',
    type: 'text',
    condition: { field: 'estado_civil', value: 'Casado' }
  },
  conyuge_cuit_cuil: {
    label: 'CUIT o CUIL (Cónyuge)',
    type: 'text',
    condition: { field: 'estado_civil', value: 'Casado' }
  },

  // Campos sociedad detallados
  numero_registro_igj: { label: 'Número de Registro IGJ/RPC', type: 'text' },
  tomo_igj: { label: 'Tomo IGJ', type: 'text' },
  folio_igj: { label: 'Folio IGJ', type: 'text' },
  estado_afip: { label: 'Estado ARCA', type: 'select', options: ['Activo', 'Inactivo', 'Limitado'] },

  // Verificación Constancia ARCA
  arca_razon_verificar: {
    label: 'Denominación Social',
    type: 'text',
    readOnly: true,
    helpText: 'Pre-llenado desde el estatuto / contrato social'
  },
  arca_cuit_verificar: {
    label: 'CUIT',
    type: 'text',
    readOnly: true,
    helpText: 'Pre-llenado desde el estatuto / contrato social'
  },
  arca_coincide: {
    label: '¿Los datos coinciden con la constancia ARCA?',
    type: 'yesno',
    important: true
  },
  arca_observaciones: {
    label: 'Observaciones / Discrepancias',
    type: 'textarea',
    placeholder: 'Describir las diferencias encontradas...',
    condition: { field: 'arca_coincide', value: 'No' }
  },

  // DDJJ Beneficiarios Finales
  ddjj_bf_fecha: { label: 'Fecha de la Declaración', type: 'date' },
  ddjj_bf_observaciones: { label: 'Observaciones', type: 'textarea', placeholder: 'Notas sobre la declaración de BF...' },

  // DDJJ PEP
  ddjj_pep_fecha: { label: 'Fecha de la Declaración', type: 'date' },
  ddjj_pep_observaciones: { label: 'Observaciones', type: 'textarea', placeholder: 'Notas sobre la declaración PEP...' },
};

// Helper para obtener documentos requeridos por tipo
export const getRequiredDocuments = (entityType) => {
  const normalized = entityType?.toLowerCase();
  const specific = DOCUMENT_REQUIREMENTS[normalized] || [];
  // For Monotributista, we strictly follow the user request for ONLY the PEP declaration
  if (normalized === ENTITY_TYPES.MONOTRIBUTISTA) {
    return specific;
  }
  return [...specific, ...COMPLEMENTARY_DOCUMENTS];
};

// Helper para obtener campos de un documento
export const getDocumentFields = (documentId, entityType) => {
  const allDocs = getRequiredDocuments(entityType);
  const doc = allDocs.find(d => d.id === documentId);
  if (!doc) return [];

  return (doc.fields || []).map(fieldId => ({
    id: fieldId,
    ...FORM_FIELDS[fieldId],
  })).filter(f => f.label); // Solo campos definidos
};
