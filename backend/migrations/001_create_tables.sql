-- ============================================================
-- MIGRACIÓN 001 — Herramienta Compliance HC DCAC
-- Tablas basadas en el DER v2.0
-- Ejecutar en PostgreSQL
-- ============================================================

-- Limpiar si existe (orden inverso por dependencias)
DROP TABLE IF EXISTS alertas CASCADE;
DROP TABLE IF EXISTS logs_acciones CASCADE;
DROP TABLE IF EXISTS form_ddjj_pep CASCADE;
DROP TABLE IF EXISTS form_ddjj_beneficiarios_finales CASCADE;
DROP TABLE IF EXISTS form_complementarios CASCADE;
DROP TABLE IF EXISTS form_monotributista CASCADE;
DROP TABLE IF EXISTS form_sucesion CASCADE;
DROP TABLE IF EXISTS form_estatuto_sh CASCADE;
DROP TABLE IF EXISTS form_estatuto_srl CASCADE;
DROP TABLE IF EXISTS form_estatuto_sa CASCADE;
DROP TABLE IF EXISTS documentos_versiones CASCADE;
DROP TABLE IF EXISTS documentos_cliente CASCADE;
DROP TABLE IF EXISTS apoderados CASCADE;
DROP TABLE IF EXISTS administrador_justicia CASCADE;
DROP TABLE IF EXISTS herederos CASCADE;
DROP TABLE IF EXISTS autoridades CASCADE;
DROP TABLE IF EXISTS socios_sh CASCADE;
DROP TABLE IF EXISTS accionistas_socios CASCADE;
DROP TABLE IF EXISTS beneficiarios_finales CASCADE;
DROP TABLE IF EXISTS usuarios_sociedad_tag CASCADE;
DROP TABLE IF EXISTS usuarios_sociedad CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DROP TABLE IF EXISTS sociedades_tag CASCADE;

-- ============================================================
-- 1. SOCIEDADES_TAG
-- Tabla externa de producción — solo lectura desde compliance
-- ============================================================
CREATE TABLE sociedades_tag (
    id_sociedad     SERIAL PRIMARY KEY,
    razon_social    VARCHAR(255) NOT NULL,
    cuit_cuil       VARCHAR(20),
    tipo_sociedad   VARCHAR(50),  -- SA / SRL / SH / sucesion / monotributista
    estado          VARCHAR(50)
);

-- ============================================================
-- 2. USUARIOS
-- Usuarios internos de la herramienta (analistas HC DCAC)
-- ============================================================
CREATE TABLE usuarios (
    id              SERIAL PRIMARY KEY,
    nombre          VARCHAR(100) NOT NULL,
    apellido        VARCHAR(100) NOT NULL,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    nivel           VARCHAR(20) NOT NULL CHECK (nivel IN ('nivel_1', 'nivel_2', 'nivel_3')),
    activo          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. USUARIOS_SOCIEDAD
-- Personas vinculadas a sociedades (directores, socios, etc.)
-- UUID porque puede venir del sistema externo (GET) o ser nuevo (POST)
-- ============================================================
CREATE TABLE usuarios_sociedad (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    apellido                VARCHAR(100) NOT NULL,
    nombre                  VARCHAR(100) NOT NULL,
    nro_documento           VARCHAR(20),
    cuit                    VARCHAR(20),
    correo_electronico      VARCHAR(255),
    telefono                VARCHAR(50),
    domicilio               TEXT,
    es_pep                  BOOLEAN NOT NULL DEFAULT FALSE,
    figura_en_repet         BOOLEAN NOT NULL DEFAULT FALSE,
    cargo_societario        VARCHAR(50) CHECK (cargo_societario IN ('gerente','director','presidente','vicepresidente','apoderado','ninguno')),
    rol_interno             VARCHAR(255),
    alcance_actos           JSONB,  -- ["credito","pagos","bancos",...]
    limite_tipo             VARCHAR(30) CHECK (limite_tipo IN ('sin_limite','hasta_x','rango_x_a_y')),
    limite_monto_hasta      NUMERIC(18,2),
    limite_monto_desde      NUMERIC(18,2),
    tipo_firma              VARCHAR(30) CHECK (tipo_firma IN ('individual','conjunta','obligatoria_casos','ninguna')),
    tipo_firma_casos        TEXT,
    activo                  BOOLEAN NOT NULL DEFAULT TRUE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 4. USUARIOS_SOCIEDAD_TAG
-- Tabla intermedia N:M: personas <-> sociedades
-- ============================================================
CREATE TABLE usuarios_sociedad_tag (
    id                  SERIAL PRIMARY KEY,
    id_usuario_sociedad UUID NOT NULL REFERENCES usuarios_sociedad(id) ON DELETE CASCADE,
    id_sociedad         INTEGER NOT NULL REFERENCES sociedades_tag(id_sociedad) ON DELETE CASCADE,
    rol                 VARCHAR(100),
    activo              BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (id_usuario_sociedad, id_sociedad)
);

-- ============================================================
-- 5. DOCUMENTOS_CLIENTE
-- Slot de documento: uno por tipo de documento por sociedad
-- ============================================================
CREATE TABLE documentos_cliente (
    id              SERIAL PRIMARY KEY,
    id_sociedad     INTEGER NOT NULL REFERENCES sociedades_tag(id_sociedad) ON DELETE CASCADE,
    version_activa  INTEGER,  -- FK a documentos_versiones (se agrega luego con ALTER)
    tipo_entidad    VARCHAR(30) CHECK (tipo_entidad IN ('SA','SRL','SH','sucesion','monotributista')),
    id_documento    VARCHAR(100) NOT NULL,  -- GET: viene del sistema externo
    nombre_documento VARCHAR(255),
    categoria       VARCHAR(50) CHECK (categoria IN ('identificacion','societario','pep','beneficiario_final','apoderado','otro')),
    es_obligatorio  BOOLEAN NOT NULL DEFAULT TRUE,
    es_condicional  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 6. DOCUMENTOS_VERSIONES
-- Cada subida de archivo para un documento
-- ============================================================
CREATE TABLE documentos_versiones (
    id              SERIAL PRIMARY KEY,
    id_documento    INTEGER NOT NULL REFERENCES documentos_cliente(id) ON DELETE CASCADE,
    aprobado_por    INTEGER REFERENCES usuarios(id),
    numero_version  INTEGER NOT NULL DEFAULT 1,
    url_archivo     VARCHAR(500),
    estado          VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','aprobado','rechazado','observado')),
    motivo_rechazo  TEXT,
    observaciones   TEXT,
    datos_formulario JSONB,
    aprobado_en     TIMESTAMPTZ,
    subido_en       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- FK circular: version_activa en documentos_cliente apunta a documentos_versiones
ALTER TABLE documentos_cliente
    ADD CONSTRAINT fk_version_activa
    FOREIGN KEY (version_activa) REFERENCES documentos_versiones(id) ON DELETE SET NULL;

-- ============================================================
-- 7. ROLES — tablas que referencian usuarios_sociedad_tag
-- ============================================================

CREATE TABLE beneficiarios_finales (
    id                          SERIAL PRIMARY KEY,
    id_usuario_sociedad_tag     INTEGER NOT NULL REFERENCES usuarios_sociedad_tag(id) ON DELETE CASCADE,
    porcentaje_participacion    NUMERIC(5,2),
    es_beneficiario_directo     BOOLEAN DEFAULT TRUE,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE accionistas_socios (
    id                          SERIAL PRIMARY KEY,
    id_usuario_sociedad_tag     INTEGER NOT NULL REFERENCES usuarios_sociedad_tag(id) ON DELETE CASCADE,
    porcentaje_participacion    NUMERIC(5,2),
    cantidad_acciones           INTEGER,
    tipo_acciones               VARCHAR(100),
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE socios_sh (
    id                          SERIAL PRIMARY KEY,
    id_usuario_sociedad_tag     INTEGER NOT NULL REFERENCES usuarios_sociedad_tag(id) ON DELETE CASCADE,
    porcentaje_participacion    NUMERIC(5,2),
    es_administrador            BOOLEAN DEFAULT FALSE,
    tiene_firma                 BOOLEAN DEFAULT FALSE,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE autoridades (
    id                          SERIAL PRIMARY KEY,
    id_usuario_sociedad_tag     INTEGER NOT NULL REFERENCES usuarios_sociedad_tag(id) ON DELETE CASCADE,
    cargo                       VARCHAR(100),  -- presidente / director / gerente / etc.
    fecha_designacion           DATE,
    fecha_vencimiento_mandato   DATE,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE apoderados (
    id                          SERIAL PRIMARY KEY,
    id_usuario_sociedad_tag     INTEGER NOT NULL REFERENCES usuarios_sociedad_tag(id) ON DELETE CASCADE,
    tipo_poder                  VARCHAR(100),  -- general / especial
    fecha_poder                 DATE,
    fecha_vencimiento           DATE,
    escribano                   VARCHAR(255),
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE herederos (
    id                          SERIAL PRIMARY KEY,
    id_usuario_sociedad_tag     INTEGER NOT NULL REFERENCES usuarios_sociedad_tag(id) ON DELETE CASCADE,
    vinculo                     VARCHAR(100),  -- hijo/a, cónyuge, etc.
    porcentaje_participacion    NUMERIC(5,2),
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE administrador_justicia (
    id                          SERIAL PRIMARY KEY,
    id_usuario_sociedad_tag     INTEGER NOT NULL REFERENCES usuarios_sociedad_tag(id) ON DELETE CASCADE,
    fecha_designacion           DATE,
    juzgado                     VARCHAR(255),
    nro_expediente              VARCHAR(100),
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 8. FORM_* — Formularios por tipo de documento
-- ============================================================

CREATE TABLE form_estatuto_sa (
    id                      SERIAL PRIMARY KEY,
    id_version              INTEGER NOT NULL REFERENCES documentos_versiones(id) ON DELETE CASCADE,
    sa_razon_social         VARCHAR(255),
    sa_cuit                 VARCHAR(20),
    sa_fecha_constitucion   DATE,
    sa_nro_inscripcion_igj  VARCHAR(100),
    sa_dom_legal            TEXT,
    sa_dom_real             TEXT,
    sa_objeto_social        TEXT,
    sa_capital_social       NUMERIC(18,2),
    sa_plazo_duracion       VARCHAR(100),
    sa_fecha_cierre_ejercicio DATE,
    sa_tipo_acciones        VARCHAR(100),
    sa_total_acciones       INTEGER,
    sa_valor_nominal_accion NUMERIC(10,4),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE form_estatuto_srl (
    id                      SERIAL PRIMARY KEY,
    id_version              INTEGER NOT NULL REFERENCES documentos_versiones(id) ON DELETE CASCADE,
    srl_razon_social        VARCHAR(255),
    srl_cuit                VARCHAR(20),
    srl_fecha_constitucion  DATE,
    srl_nro_inscripcion_igj VARCHAR(100),
    srl_dom_legal           TEXT,
    srl_dom_real            TEXT,
    srl_objeto_social       TEXT,
    srl_capital_social      NUMERIC(18,2),
    srl_total_cuotas        INTEGER,
    srl_valor_cuota         NUMERIC(10,4),
    srl_tipo_gerencia       VARCHAR(50),
    srl_tipo_firma          VARCHAR(50),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE form_estatuto_sh (
    id                      SERIAL PRIMARY KEY,
    id_version              INTEGER NOT NULL REFERENCES documentos_versiones(id) ON DELETE CASCADE,
    sh_denominacion         VARCHAR(255),
    sh_fecha_inicio         DATE,
    sh_domicilio            TEXT,
    sh_actividad_principal  VARCHAR(255),
    sh_objeto_social        TEXT,
    sh_cantidad_socios      INTEGER,
    sh_representante        VARCHAR(255),
    sh_cuit_representante   VARCHAR(20),
    sh_gestor_es_representante BOOLEAN,
    sh_tiene_apoderado      BOOLEAN,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE form_sucesion (
    id                          SERIAL PRIMARY KEY,
    id_version                  INTEGER NOT NULL REFERENCES documentos_versiones(id) ON DELETE CASCADE,
    suc_nombre_causante         VARCHAR(255),
    suc_cuit_causante           VARCHAR(20),
    suc_fecha_fallecimiento     DATE,
    suc_juzgado                 VARCHAR(255),
    suc_nro_expediente          VARCHAR(100),
    suc_fecha_declaratoria      DATE,
    suc_administrador           VARCHAR(255),
    suc_cuit_administrador      VARCHAR(20),
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE form_monotributista (
    id                          SERIAL PRIMARY KEY,
    id_version                  INTEGER NOT NULL REFERENCES documentos_versiones(id) ON DELETE CASCADE,
    mono_apellido               VARCHAR(100),
    mono_nombre                 VARCHAR(100),
    mono_dni                    VARCHAR(20),
    mono_cuit                   VARCHAR(20),
    mono_fecha_nacimiento       DATE,
    mono_nacionalidad           VARCHAR(100),
    mono_estado_civil           VARCHAR(50),
    mono_dom_real               TEXT,
    mono_dom_fiscal             TEXT,
    mono_telefono               VARCHAR(50),
    mono_email                  VARCHAR(255),
    mono_categoria              VARCHAR(5),
    mono_actividad_principal    VARCHAR(255),
    mono_fecha_inscripcion      DATE,
    mono_ingresos_anuales       NUMERIC(18,2),
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE form_complementarios (
    id                          SERIAL PRIMARY KEY,
    id_version                  INTEGER NOT NULL REFERENCES documentos_versiones(id) ON DELETE CASCADE,
    tipo_formulario             VARCHAR(100),  -- ddjj_pep / ddjj_beneficiarios_finales
    datos                       JSONB,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE form_ddjj_beneficiarios_finales (
    id                      SERIAL PRIMARY KEY,
    id_version              INTEGER NOT NULL REFERENCES documentos_versiones(id) ON DELETE CASCADE,
    ddjj_bf_fecha           DATE,
    ddjj_bf_observaciones   TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE form_ddjj_pep (
    id                      SERIAL PRIMARY KEY,
    id_version              INTEGER NOT NULL REFERENCES documentos_versiones(id) ON DELETE CASCADE,
    ddjj_pep_fecha          DATE,
    ddjj_pep_observaciones  TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 9. LOGS_ACCIONES
-- ============================================================
CREATE TABLE logs_acciones (
    id                      SERIAL PRIMARY KEY,
    id_sociedad             INTEGER REFERENCES sociedades_tag(id_sociedad),
    id_usuario_interno      INTEGER REFERENCES usuarios(id),
    id_usuario_sociedad     UUID REFERENCES usuarios_sociedad(id),
    id_documento            INTEGER REFERENCES documentos_cliente(id),
    tipo_accion             VARCHAR(50) NOT NULL CHECK (tipo_accion IN (
                                'alta_iniciada',
                                'alta_guardada_borrador',
                                'alta_avanzada_pendiente',
                                'alta_completada',
                                'alta_excepcion_docs',
                                'alta_psp',
                                'alta_psp_excepcion',
                                'documento_aprobado',
                                'documento_rechazado',
                                'documento_observado',
                                'documento_re_solicitado',
                                'datos_modificados',
                                'cvu_habilitado',
                                'cvu_bloqueado',
                                'cvu_excepcion',
                                'pep_detectado',
                                'comentario'
                            )),
    estado_anterior         VARCHAR(100),
    estado_nuevo            VARCHAR(100),
    motivo                  TEXT,
    genera_cvu              BOOLEAN DEFAULT FALSE,
    nro_cvu                 VARCHAR(100),
    cvu_generado_en         TIMESTAMPTZ,
    direccion_ip            VARCHAR(50),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 10. ALERTAS
-- ============================================================
CREATE TABLE alertas (
    id                      SERIAL PRIMARY KEY,
    id_sociedad             INTEGER NOT NULL REFERENCES sociedades_tag(id_sociedad) ON DELETE CASCADE,
    id_usuario_sociedad     UUID REFERENCES usuarios_sociedad(id),
    tipo_alerta             VARCHAR(60) NOT NULL CHECK (tipo_alerta IN (
                                'vencimiento_ddjj',
                                'informe_debida_diligencia',
                                'solicitud_informacion_pendiente',
                                'documentacion_pendiente',
                                'renovacion_documento'
                            )),
    mensaje                 TEXT,
    fecha_vencimiento       TIMESTAMPTZ,
    estado                  VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','enviada','resuelta','ignorada')),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX idx_ust_sociedad ON usuarios_sociedad_tag(id_sociedad);
CREATE INDEX idx_ust_usuario ON usuarios_sociedad_tag(id_usuario_sociedad);
CREATE INDEX idx_doc_sociedad ON documentos_cliente(id_sociedad);
CREATE INDEX idx_ver_documento ON documentos_versiones(id_documento);
CREATE INDEX idx_logs_sociedad ON logs_acciones(id_sociedad);
CREATE INDEX idx_logs_tipo ON logs_acciones(tipo_accion);
CREATE INDEX idx_alertas_sociedad ON alertas(id_sociedad);
CREATE INDEX idx_alertas_estado ON alertas(estado);

-- ============================================================
-- FIN DE MIGRACIÓN
-- ============================================================
