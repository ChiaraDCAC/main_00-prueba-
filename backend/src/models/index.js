const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize({
  dialect: dbConfig.dialect,
  storage: dbConfig.storage,
  database: dbConfig.database,
  username: dbConfig.username,
  password: dbConfig.password,
  host: dbConfig.host,
  port: dbConfig.port,
  logging: dbConfig.logging,
  define: dbConfig.define,
  pool: dbConfig.pool,
});

// ─── 1. SOCIEDADES_TAG ───────────────────────────────────────
// Tabla externa de producción — datos GET
const SociedadTag = sequelize.define('SociedadTag', {
  id_sociedad: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  razon_social:  { type: DataTypes.STRING(255) },
  cuit_cuil:     { type: DataTypes.STRING(20) },
  tipo_sociedad: { type: DataTypes.STRING(50) },
  estado:        { type: DataTypes.STRING(50) },
  nivel_riesgo:  { type: DataTypes.STRING(10) },
}, {
  tableName: 'sociedades_tag',
  timestamps: false,
});

// ─── 2. USUARIOS ─────────────────────────────────────────────
// Usuarios internos de la herramienta (analistas HC DCAC)
const Usuario = sequelize.define('Usuario', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre:        { type: DataTypes.STRING(100), allowNull: false },
  apellido:      { type: DataTypes.STRING(100), allowNull: false },
  email:         { type: DataTypes.STRING(255), allowNull: false, unique: true },
  password_hash: { type: DataTypes.STRING(255), allowNull: false },
  nivel: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: { isIn: [['nivel_1', 'nivel_2', 'nivel_3']] },
  },
  activo: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'usuarios',
  underscored: true,
});

// ─── 3. USUARIOS_SOCIEDAD ─────────────────────────────────────
// Personas vinculadas a sociedades — UUID (GET si existe, POST si nuevo)
const UsuarioSociedad = sequelize.define('UsuarioSociedad', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  apellido:           { type: DataTypes.STRING(100), allowNull: false },
  nombre:             { type: DataTypes.STRING(100), allowNull: false },
  nro_documento:      { type: DataTypes.STRING(20) },
  cuit:               { type: DataTypes.STRING(20) },
  correo_electronico: { type: DataTypes.STRING(255) },
  telefono:           { type: DataTypes.STRING(50) },
  domicilio:          { type: DataTypes.TEXT },
  es_pep:             { type: DataTypes.BOOLEAN, defaultValue: false },
  figura_en_repet:    { type: DataTypes.BOOLEAN, defaultValue: false },
  cargo_societario: {
    type: DataTypes.STRING(50),
    validate: { isIn: [['gerente','director','presidente','vicepresidente','apoderado','ninguno', null]] },
  },
  rol_interno:        { type: DataTypes.STRING(255) },
  alcance_actos:      { type: DataTypes.JSONB },
  limite_tipo: {
    type: DataTypes.STRING(30),
    validate: { isIn: [['sin_limite','hasta_x','rango_x_a_y', null]] },
  },
  limite_monto_hasta: { type: DataTypes.DECIMAL(18, 2) },
  limite_monto_desde: { type: DataTypes.DECIMAL(18, 2) },
  tipo_firma: {
    type: DataTypes.STRING(30),
    validate: { isIn: [['individual','conjunta','obligatoria_casos','ninguna', null]] },
  },
  tipo_firma_casos:   { type: DataTypes.TEXT },
  activo:             { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'usuarios_sociedad',
  underscored: true,
});

// ─── 4. USUARIOS_SOCIEDAD_TAG ─────────────────────────────────
// Tabla intermedia N:M: personas <-> sociedades
const UsuarioSociedadTag = sequelize.define('UsuarioSociedadTag', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  id_usuario_sociedad: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  id_sociedad: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  rol:    { type: DataTypes.STRING(100) },
  activo: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'usuarios_sociedad_tag',
  underscored: true,
});

// ─── 5. DOCUMENTOS_CLIENTE ────────────────────────────────────
// Slot de documento: uno por tipo por sociedad
const DocumentoCliente = sequelize.define('DocumentoCliente', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  id_sociedad:     { type: DataTypes.INTEGER, allowNull: false },
  version_activa:  { type: DataTypes.INTEGER },
  tipo_entidad: {
    type: DataTypes.STRING(30),
    validate: { isIn: [['SA','SRL','SH','sucesion','monotributista', null]] },
  },
  id_documento:     { type: DataTypes.STRING(100), allowNull: false },
  nombre_documento: { type: DataTypes.STRING(255) },
  categoria: {
    type: DataTypes.STRING(50),
    validate: { isIn: [['identificacion','societario','pep','beneficiario_final','apoderado','otro', null]] },
  },
  es_obligatorio:  { type: DataTypes.BOOLEAN, defaultValue: true },
  es_condicional:  { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
  tableName: 'documentos_cliente',
  underscored: true,
});

// ─── 6. DOCUMENTOS_VERSIONES ──────────────────────────────────
// Cada subida de archivo
const DocumentoVersion = sequelize.define('DocumentoVersion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  id_documento:    { type: DataTypes.INTEGER, allowNull: false },
  aprobado_por:    { type: DataTypes.INTEGER },
  numero_version:  { type: DataTypes.INTEGER, defaultValue: 1 },
  url_archivo:     { type: DataTypes.STRING(500) },
  estado: {
    type: DataTypes.STRING(20),
    defaultValue: 'pendiente',
    validate: { isIn: [['pendiente','aprobado','rechazado','observado']] },
  },
  motivo_rechazo:  { type: DataTypes.TEXT },
  observaciones:   { type: DataTypes.TEXT },
  datos_formulario:{ type: DataTypes.JSONB },
  aprobado_en:     { type: DataTypes.DATE },
  subido_en:       { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'documentos_versiones',
  timestamps: false,
});

// ─── 7. ROLES ─────────────────────────────────────────────────

const BeneficiarioFinal = sequelize.define('BeneficiarioFinal', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_usuario_sociedad_tag:    { type: DataTypes.INTEGER, allowNull: false },
  porcentaje_participacion:   { type: DataTypes.DECIMAL(5, 2) },
  es_beneficiario_directo:    { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'beneficiarios_finales', underscored: true });

const AccionistaSocio = sequelize.define('AccionistaSocio', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_usuario_sociedad_tag:    { type: DataTypes.INTEGER, allowNull: false },
  porcentaje_participacion:   { type: DataTypes.DECIMAL(5, 2) },
  cantidad_acciones:          { type: DataTypes.INTEGER },
  tipo_acciones:              { type: DataTypes.STRING(100) },
}, { tableName: 'accionistas_socios', underscored: true });

const SocioSH = sequelize.define('SocioSH', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_usuario_sociedad_tag:    { type: DataTypes.INTEGER, allowNull: false },
  porcentaje_participacion:   { type: DataTypes.DECIMAL(5, 2) },
  es_administrador:           { type: DataTypes.BOOLEAN, defaultValue: false },
  tiene_firma:                { type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: 'socios_sh', underscored: true });

const Autoridad = sequelize.define('Autoridad', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_usuario_sociedad_tag:    { type: DataTypes.INTEGER, allowNull: false },
  cargo:                      { type: DataTypes.STRING(100) },
  fecha_designacion:          { type: DataTypes.DATEONLY },
  fecha_vencimiento_mandato:  { type: DataTypes.DATEONLY },
}, { tableName: 'autoridades', underscored: true });

const Apoderado = sequelize.define('Apoderado', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_usuario_sociedad_tag:    { type: DataTypes.INTEGER, allowNull: false },
  tipo_poder:                 { type: DataTypes.STRING(100) },
  fecha_poder:                { type: DataTypes.DATEONLY },
  fecha_vencimiento:          { type: DataTypes.DATEONLY },
  escribano:                  { type: DataTypes.STRING(255) },
}, { tableName: 'apoderados', underscored: true });

const Heredero = sequelize.define('Heredero', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_usuario_sociedad_tag:    { type: DataTypes.INTEGER, allowNull: false },
  vinculo:                    { type: DataTypes.STRING(100) },
  porcentaje_participacion:   { type: DataTypes.DECIMAL(5, 2) },
}, { tableName: 'herederos', underscored: true });

const AdministradorJusticia = sequelize.define('AdministradorJusticia', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_usuario_sociedad_tag:    { type: DataTypes.INTEGER, allowNull: false },
  fecha_designacion:          { type: DataTypes.DATEONLY },
  juzgado:                    { type: DataTypes.STRING(255) },
  nro_expediente:             { type: DataTypes.STRING(100) },
}, { tableName: 'administrador_justicia', underscored: true });

// ─── 8. FORM_* ────────────────────────────────────────────────

const FormEstatutoSA = sequelize.define('FormEstatutoSA', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_version:                 { type: DataTypes.INTEGER, allowNull: false },
  sa_razon_social:            { type: DataTypes.STRING(255) },
  sa_cuit:                    { type: DataTypes.STRING(20) },
  sa_fecha_constitucion:      { type: DataTypes.DATEONLY },
  sa_nro_inscripcion_igj:     { type: DataTypes.STRING(100) },
  sa_dom_legal:               { type: DataTypes.TEXT },
  sa_dom_real:                { type: DataTypes.TEXT },
  sa_objeto_social:           { type: DataTypes.TEXT },
  sa_capital_social:          { type: DataTypes.DECIMAL(18, 2) },
  sa_plazo_duracion:          { type: DataTypes.STRING(100) },
  sa_fecha_cierre_ejercicio:  { type: DataTypes.DATEONLY },
  sa_tipo_acciones:           { type: DataTypes.STRING(100) },
  sa_total_acciones:          { type: DataTypes.INTEGER },
  sa_valor_nominal_accion:    { type: DataTypes.DECIMAL(10, 4) },
}, { tableName: 'form_estatuto_sa', timestamps: false });

const FormEstatutoSRL = sequelize.define('FormEstatutoSRL', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_version:                 { type: DataTypes.INTEGER, allowNull: false },
  srl_razon_social:           { type: DataTypes.STRING(255) },
  srl_cuit:                   { type: DataTypes.STRING(20) },
  srl_fecha_constitucion:     { type: DataTypes.DATEONLY },
  srl_nro_inscripcion_igj:    { type: DataTypes.STRING(100) },
  srl_dom_legal:              { type: DataTypes.TEXT },
  srl_dom_real:               { type: DataTypes.TEXT },
  srl_objeto_social:          { type: DataTypes.TEXT },
  srl_capital_social:         { type: DataTypes.DECIMAL(18, 2) },
  srl_total_cuotas:           { type: DataTypes.INTEGER },
  srl_valor_cuota:            { type: DataTypes.DECIMAL(10, 4) },
  srl_tipo_gerencia:          { type: DataTypes.STRING(50) },
  srl_tipo_firma:             { type: DataTypes.STRING(50) },
}, { tableName: 'form_estatuto_srl', timestamps: false });

const FormEstatutoSH = sequelize.define('FormEstatutoSH', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_version:                     { type: DataTypes.INTEGER, allowNull: false },
  sh_denominacion:                { type: DataTypes.STRING(255) },
  sh_fecha_inicio:                { type: DataTypes.DATEONLY },
  sh_domicilio:                   { type: DataTypes.TEXT },
  sh_actividad_principal:         { type: DataTypes.STRING(255) },
  sh_objeto_social:               { type: DataTypes.TEXT },
  sh_cantidad_socios:             { type: DataTypes.INTEGER },
  sh_representante:               { type: DataTypes.STRING(255) },
  sh_cuit_representante:          { type: DataTypes.STRING(20) },
  sh_gestor_es_representante:     { type: DataTypes.BOOLEAN },
  sh_tiene_apoderado:             { type: DataTypes.BOOLEAN },
}, { tableName: 'form_estatuto_sh', timestamps: false });

const FormSucesion = sequelize.define('FormSucesion', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_version:                 { type: DataTypes.INTEGER, allowNull: false },
  suc_nombre_causante:        { type: DataTypes.STRING(255) },
  suc_cuit_causante:          { type: DataTypes.STRING(20) },
  suc_fecha_fallecimiento:    { type: DataTypes.DATEONLY },
  suc_juzgado:                { type: DataTypes.STRING(255) },
  suc_nro_expediente:         { type: DataTypes.STRING(100) },
  suc_fecha_declaratoria:     { type: DataTypes.DATEONLY },
  suc_administrador:          { type: DataTypes.STRING(255) },
  suc_cuit_administrador:     { type: DataTypes.STRING(20) },
}, { tableName: 'form_sucesion', timestamps: false });

const FormMonotributista = sequelize.define('FormMonotributista', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_version:                 { type: DataTypes.INTEGER, allowNull: false },
  mono_apellido:              { type: DataTypes.STRING(100) },
  mono_nombre:                { type: DataTypes.STRING(100) },
  mono_dni:                   { type: DataTypes.STRING(20) },
  mono_cuit:                  { type: DataTypes.STRING(20) },
  mono_fecha_nacimiento:      { type: DataTypes.DATEONLY },
  mono_nacionalidad:          { type: DataTypes.STRING(100) },
  mono_estado_civil:          { type: DataTypes.STRING(50) },
  mono_dom_real:              { type: DataTypes.TEXT },
  mono_dom_fiscal:            { type: DataTypes.TEXT },
  mono_telefono:              { type: DataTypes.STRING(50) },
  mono_email:                 { type: DataTypes.STRING(255) },
  mono_categoria:             { type: DataTypes.STRING(5) },
  mono_actividad_principal:   { type: DataTypes.STRING(255) },
  mono_fecha_inscripcion:     { type: DataTypes.DATEONLY },
  mono_ingresos_anuales:      { type: DataTypes.DECIMAL(18, 2) },
}, { tableName: 'form_monotributista', timestamps: false });

const FormDDJJBeneficiarios = sequelize.define('FormDDJJBeneficiarios', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_version:             { type: DataTypes.INTEGER, allowNull: false },
  ddjj_bf_fecha:          { type: DataTypes.DATEONLY },
  ddjj_bf_observaciones:  { type: DataTypes.TEXT },
}, { tableName: 'form_ddjj_beneficiarios_finales', timestamps: false });

const FormDDJJPep = sequelize.define('FormDDJJPep', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_version:               { type: DataTypes.INTEGER, allowNull: false },
  ddjj_pep_fecha:           { type: DataTypes.DATEONLY },
  ddjj_pep_observaciones:   { type: DataTypes.TEXT },
}, { tableName: 'form_ddjj_pep', timestamps: false });

// ─── 9. LOGS_ACCIONES ─────────────────────────────────────────
const LogAccion = sequelize.define('LogAccion', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_sociedad:          { type: DataTypes.INTEGER },
  id_usuario_interno:   { type: DataTypes.INTEGER },
  id_usuario_sociedad:  { type: DataTypes.UUID },
  id_documento:         { type: DataTypes.INTEGER },
  tipo_accion: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      isIn: [[
        'alta_iniciada', 'alta_guardada_borrador', 'alta_avanzada_pendiente',
        'alta_completada', 'alta_excepcion_docs', 'alta_psp', 'alta_psp_excepcion',
        'documento_aprobado', 'documento_rechazado', 'documento_observado',
        'documento_re_solicitado', 'datos_modificados',
        'cvu_habilitado', 'cvu_bloqueado', 'cvu_excepcion',
        'pep_detectado', 'comentario',
      ]],
    },
  },
  estado_anterior:  { type: DataTypes.STRING(100) },
  estado_nuevo:     { type: DataTypes.STRING(100) },
  motivo:           { type: DataTypes.TEXT },
  genera_cvu:       { type: DataTypes.BOOLEAN, defaultValue: false },
  nro_cvu:          { type: DataTypes.STRING(100) },
  cvu_generado_en:  { type: DataTypes.DATE },
  direccion_ip:     { type: DataTypes.STRING(50) },
}, {
  tableName: 'logs_acciones',
  updatedAt: false,
  underscored: true,
});

// ─── 10. OPERACIONES INUSUALES ───────────────────────────────
const OperacionInusual = sequelize.define('OperacionInusual', {
  id:               { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  codigo:           { type: DataTypes.STRING(20), allowNull: false, unique: true },
  id_sociedad:      { type: DataTypes.INTEGER },
  monto:            { type: DataTypes.DECIMAL(18, 2) },
  moneda:           { type: DataTypes.STRING(10), defaultValue: 'ARS' },
  descripcion:      { type: DataTypes.TEXT },
  fecha_operacion:  { type: DataTypes.DATEONLY },
  estado:           { type: DataTypes.STRING(20), defaultValue: 'nueva' },
  asignado_a:       { type: DataTypes.INTEGER },
  comentario_cierre:{ type: DataTypes.TEXT },
  cerrado_por:      { type: DataTypes.INTEGER },
  cerrado_en:       { type: DataTypes.DATE },
  origen:           { type: DataTypes.STRING(50), defaultValue: 'sistema_externo' },
  datos_externos:   { type: DataTypes.JSONB },
}, { tableName: 'operaciones_inusuales', underscored: true });

const OIComentario = sequelize.define('OIComentario', {
  id:         { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_oi:      { type: DataTypes.INTEGER, allowNull: false },
  id_usuario: { type: DataTypes.INTEGER, allowNull: false },
  texto:      { type: DataTypes.TEXT, allowNull: false },
}, { tableName: 'oi_comentarios', underscored: true, updatedAt: false });

const OIAdjunto = sequelize.define('OIAdjunto', {
  id:             { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_oi:          { type: DataTypes.INTEGER, allowNull: false },
  id_usuario:     { type: DataTypes.INTEGER, allowNull: false },
  nombre_archivo: { type: DataTypes.STRING(255), allowNull: false },
  url_archivo:    { type: DataTypes.STRING(500), allowNull: false },
  mime_type:      { type: DataTypes.STRING(100) },
}, { tableName: 'oi_adjuntos', underscored: true, updatedAt: false });

// ─── 11. RIESGO_SOCIEDAD ─────────────────────────────────────
const RiesgoSociedad = sequelize.define('RiesgoSociedad', {
  id:           { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_sociedad:  { type: DataTypes.INTEGER, allowNull: false },
  es_pep:       { type: DataTypes.BOOLEAN, defaultValue: false },
  residencia:   { type: DataTypes.SMALLINT, allowNull: false },
  nacionalidad: { type: DataTypes.SMALLINT, allowNull: false },
  actividad:    { type: DataTypes.SMALLINT, allowNull: false },
  antiguedad:   { type: DataTypes.SMALLINT, allowNull: false },
  materialidad: { type: DataTypes.SMALLINT, allowNull: false },
  puntaje:      { type: DataTypes.DECIMAL(4, 2), allowNull: false },
  nivel_riesgo: { type: DataTypes.STRING(10), allowNull: false },
  evaluado_por: { type: DataTypes.INTEGER },
  observaciones:{ type: DataTypes.TEXT },
}, {
  tableName: 'riesgo_sociedad',
  underscored: true,
});

// ─── 12. ALTAS PENDIENTES — PERSONA HUMANA ────────────────────
// Borradores de alta de persona humana (natural) en curso.
// Permite arrancar el proceso aunque falten datos/documentos.
const AltaPendientePersona = sequelize.define('AltaPendientePersona', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  // — Datos básicos —
  apellido:           { type: DataTypes.STRING(100), allowNull: false },
  nombre:             { type: DataTypes.STRING(100), allowNull: false },
  tipo_documento: {
    type: DataTypes.STRING(20),
    defaultValue: 'DNI',
    validate: { isIn: [['DNI','LE','LC','PASAPORTE','CI', null]] },
  },
  nro_documento:      { type: DataTypes.STRING(20) },
  cuit:               { type: DataTypes.STRING(20) },
  fecha_nacimiento:   { type: DataTypes.DATEONLY },
  nacionalidad:       { type: DataTypes.STRING(100) },
  correo_electronico: { type: DataTypes.STRING(255) },
  telefono:           { type: DataTypes.STRING(50) },
  domicilio:          { type: DataTypes.TEXT },
  es_pep:             { type: DataTypes.BOOLEAN, defaultValue: false },

  // — Vínculo con sociedad / rol —
  id_sociedad:        { type: DataTypes.INTEGER },
  rol: {
    type: DataTypes.STRING(50),
    validate: { isIn: [[
      'beneficiario_final','accionista','socio','autoridad',
      'apoderado','heredero','administrador_justicia','firmante',
      'cliente_persona_humana', null,
    ]] },
  },

  // — Gestión / seguimiento —
  id_responsable:     { type: DataTypes.INTEGER }, // Usuario interno asignado
  fecha_limite:       { type: DataTypes.DATEONLY },
  estado: {
    type: DataTypes.STRING(20),
    defaultValue: 'pendiente',
    validate: { isIn: [['pendiente','en_proceso','completada','cancelada']] },
  },

  // — Documentación faltante —
  // Estructura: [{ tipo: 'dni_frente', nombre: 'DNI Frente', recibido: false, observaciones: '' }, ...]
  documentos_requeridos: {
    type: DataTypes.JSONB,
    defaultValue: [
      { tipo: 'dni_frente',           nombre: 'DNI Frente',                   recibido: false },
      { tipo: 'dni_dorso',            nombre: 'DNI Dorso',                    recibido: false },
      { tipo: 'constancia_cuit',      nombre: 'Constancia de CUIT/CUIL',      recibido: false },
      { tipo: 'comprobante_domicilio',nombre: 'Comprobante de domicilio',     recibido: false },
      { tipo: 'ddjj_pep',             nombre: 'DDJJ PEP',                     recibido: false },
    ],
  },

  observaciones:      { type: DataTypes.TEXT },

  // — Cierre —
  completada_en:      { type: DataTypes.DATE },
  id_usuario_sociedad_creado: { type: DataTypes.UUID }, // Si al completar generó UsuarioSociedad
}, {
  tableName: 'altas_pendientes_persona',
  underscored: true,
});

// ─── 11. ALERTAS ──────────────────────────────────────────────
const Alerta = sequelize.define('Alerta', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_sociedad:          { type: DataTypes.INTEGER, allowNull: false },
  id_usuario_sociedad:  { type: DataTypes.UUID },
  tipo_alerta: {
    type: DataTypes.STRING(60),
    allowNull: false,
    validate: {
      isIn: [[
        'vencimiento_ddjj', 'informe_debida_diligencia',
        'solicitud_informacion_pendiente', 'documentacion_pendiente',
        'renovacion_documento',
      ]],
    },
  },
  mensaje:           { type: DataTypes.TEXT },
  fecha_vencimiento: { type: DataTypes.DATE },
  estado: {
    type: DataTypes.STRING(20),
    defaultValue: 'pendiente',
    validate: { isIn: [['pendiente', 'enviada', 'resuelta', 'ignorada']] },
  },
}, {
  tableName: 'alertas',
  underscored: true,
});

// ─── ASOCIACIONES ─────────────────────────────────────────────

// Sociedad → UsuarioSociedadTag
SociedadTag.hasMany(UsuarioSociedadTag, { foreignKey: 'id_sociedad' });
UsuarioSociedadTag.belongsTo(SociedadTag, { foreignKey: 'id_sociedad' });

// UsuarioSociedad → UsuarioSociedadTag
UsuarioSociedad.hasMany(UsuarioSociedadTag, { foreignKey: 'id_usuario_sociedad' });
UsuarioSociedadTag.belongsTo(UsuarioSociedad, { foreignKey: 'id_usuario_sociedad' });

// Sociedad → DocumentoCliente
SociedadTag.hasMany(DocumentoCliente, { foreignKey: 'id_sociedad' });
DocumentoCliente.belongsTo(SociedadTag, { foreignKey: 'id_sociedad' });

// DocumentoCliente → DocumentoVersion
DocumentoCliente.hasMany(DocumentoVersion, { foreignKey: 'id_documento' });
DocumentoVersion.belongsTo(DocumentoCliente, { foreignKey: 'id_documento' });

// Usuario aprueba DocumentoVersion
Usuario.hasMany(DocumentoVersion, { foreignKey: 'aprobado_por' });
DocumentoVersion.belongsTo(Usuario, { foreignKey: 'aprobado_por' });

// Roles → UsuarioSociedadTag
const rolesConfig = [
  [BeneficiarioFinal, 'beneficiarios_finales'],
  [AccionistaSocio,   'accionistas_socios'],
  [SocioSH,          'socios_sh'],
  [Autoridad,        'autoridades'],
  [Apoderado,        'apoderados'],
  [Heredero,         'herederos'],
  [AdministradorJusticia, 'administrador_justicia'],
];
rolesConfig.forEach(([Model]) => {
  UsuarioSociedadTag.hasMany(Model, { foreignKey: 'id_usuario_sociedad_tag' });
  Model.belongsTo(UsuarioSociedadTag, { foreignKey: 'id_usuario_sociedad_tag' });
});

// Forms → DocumentoVersion
const formsConfig = [
  FormEstatutoSA, FormEstatutoSRL, FormEstatutoSH,
  FormSucesion, FormMonotributista,
  FormDDJJBeneficiarios, FormDDJJPep,
];
formsConfig.forEach(Model => {
  DocumentoVersion.hasOne(Model, { foreignKey: 'id_version' });
  Model.belongsTo(DocumentoVersion, { foreignKey: 'id_version' });
});

// Logs
SociedadTag.hasMany(LogAccion, { foreignKey: 'id_sociedad' });
LogAccion.belongsTo(SociedadTag, { foreignKey: 'id_sociedad' });
Usuario.hasMany(LogAccion, { foreignKey: 'id_usuario_interno' });
LogAccion.belongsTo(Usuario, { foreignKey: 'id_usuario_interno' });
UsuarioSociedad.hasMany(LogAccion, { foreignKey: 'id_usuario_sociedad' });
LogAccion.belongsTo(UsuarioSociedad, { foreignKey: 'id_usuario_sociedad' });
DocumentoCliente.hasMany(LogAccion, { foreignKey: 'id_documento' });
LogAccion.belongsTo(DocumentoCliente, { foreignKey: 'id_documento' });

// Operaciones Inusuales
SociedadTag.hasMany(OperacionInusual, { foreignKey: 'id_sociedad' });
OperacionInusual.belongsTo(SociedadTag, { foreignKey: 'id_sociedad' });
Usuario.hasMany(OperacionInusual, { foreignKey: 'asignado_a' });
OperacionInusual.hasMany(OIComentario, { foreignKey: 'id_oi' });
OIComentario.belongsTo(OperacionInusual, { foreignKey: 'id_oi' });
OIComentario.belongsTo(Usuario, { foreignKey: 'id_usuario' });
OperacionInusual.hasMany(OIAdjunto, { foreignKey: 'id_oi' });
OIAdjunto.belongsTo(OperacionInusual, { foreignKey: 'id_oi' });
OIAdjunto.belongsTo(Usuario, { foreignKey: 'id_usuario' });

// Riesgo
SociedadTag.hasMany(RiesgoSociedad, { foreignKey: 'id_sociedad' });
RiesgoSociedad.belongsTo(SociedadTag, { foreignKey: 'id_sociedad' });
Usuario.hasMany(RiesgoSociedad, { foreignKey: 'evaluado_por' });
RiesgoSociedad.belongsTo(Usuario, { foreignKey: 'evaluado_por' });

// Alertas
SociedadTag.hasMany(Alerta, { foreignKey: 'id_sociedad' });
Alerta.belongsTo(SociedadTag, { foreignKey: 'id_sociedad' });
UsuarioSociedad.hasMany(Alerta, { foreignKey: 'id_usuario_sociedad' });
Alerta.belongsTo(UsuarioSociedad, { foreignKey: 'id_usuario_sociedad' });

// Altas Pendientes — Persona Humana
SociedadTag.hasMany(AltaPendientePersona, { foreignKey: 'id_sociedad', as: 'altasPendientes' });
AltaPendientePersona.belongsTo(SociedadTag, { foreignKey: 'id_sociedad', as: 'sociedad' });
Usuario.hasMany(AltaPendientePersona, { foreignKey: 'id_responsable', as: 'altasAsignadas' });
AltaPendientePersona.belongsTo(Usuario, { foreignKey: 'id_responsable', as: 'responsable' });
UsuarioSociedad.hasOne(AltaPendientePersona, { foreignKey: 'id_usuario_sociedad_creado', as: 'altaOrigen' });
AltaPendientePersona.belongsTo(UsuarioSociedad, { foreignKey: 'id_usuario_sociedad_creado', as: 'usuarioCreado' });

// ─── EXPORTS ──────────────────────────────────────────────────

module.exports = {
  sequelize,
  SociedadTag,
  Usuario,
  UsuarioSociedad,
  UsuarioSociedadTag,
  DocumentoCliente,
  DocumentoVersion,
  BeneficiarioFinal,
  AccionistaSocio,
  SocioSH,
  Autoridad,
  Apoderado,
  Heredero,
  AdministradorJusticia,
  FormEstatutoSA,
  FormEstatutoSRL,
  FormEstatutoSH,
  FormSucesion,
  FormMonotributista,
  FormDDJJBeneficiarios,
  FormDDJJPep,
  LogAccion,
  Alerta,
  RiesgoSociedad,
  OperacionInusual,
  OIComentario,
  OIAdjunto,
  AltaPendientePersona,
};
