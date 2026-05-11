-- ============================================================
-- MIGRACIÓN 003 — Tabla operaciones_inusuales
-- ============================================================

DROP TABLE IF EXISTS oi_adjuntos CASCADE;
DROP TABLE IF EXISTS oi_comentarios CASCADE;
DROP TABLE IF EXISTS operaciones_inusuales CASCADE;

CREATE TABLE operaciones_inusuales (
    id              SERIAL PRIMARY KEY,
    codigo          VARCHAR(20) NOT NULL UNIQUE,   -- OI-0001
    id_sociedad     INTEGER REFERENCES sociedades_tag(id_sociedad) ON DELETE SET NULL,
    monto           DECIMAL(18,2),
    moneda          VARCHAR(10) DEFAULT 'ARS',
    descripcion     TEXT,
    fecha_operacion DATE,
    estado          VARCHAR(20) NOT NULL DEFAULT 'nueva'
                        CHECK (estado IN ('nueva','justificada','os')),
    asignado_a      INTEGER REFERENCES usuarios(id),
    comentario_cierre TEXT,
    cerrado_por     INTEGER REFERENCES usuarios(id),
    cerrado_en      TIMESTAMPTZ,
    origen          VARCHAR(50) DEFAULT 'sistema_externo',
    datos_externos  JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE oi_comentarios (
    id              SERIAL PRIMARY KEY,
    id_oi           INTEGER NOT NULL REFERENCES operaciones_inusuales(id) ON DELETE CASCADE,
    id_usuario      INTEGER NOT NULL REFERENCES usuarios(id),
    texto           TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE oi_adjuntos (
    id              SERIAL PRIMARY KEY,
    id_oi           INTEGER NOT NULL REFERENCES operaciones_inusuales(id) ON DELETE CASCADE,
    id_usuario      INTEGER NOT NULL REFERENCES usuarios(id),
    nombre_archivo  VARCHAR(255) NOT NULL,
    url_archivo     VARCHAR(500) NOT NULL,
    mime_type       VARCHAR(100),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Secuencia para código OI-XXXX
CREATE SEQUENCE IF NOT EXISTS oi_codigo_seq START 1;

-- Índices
CREATE INDEX idx_oi_sociedad ON operaciones_inusuales(id_sociedad);
CREATE INDEX idx_oi_estado   ON operaciones_inusuales(estado);
CREATE INDEX idx_oi_asignado ON operaciones_inusuales(asignado_a);
CREATE INDEX idx_oi_com      ON oi_comentarios(id_oi);
CREATE INDEX idx_oi_adj      ON oi_adjuntos(id_oi);
