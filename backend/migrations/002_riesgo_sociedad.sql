-- ============================================================
-- MIGRACIÓN 002 — Tabla riesgo_sociedad
-- Matriz de riesgo por sociedad según modelo consultor
-- ============================================================

DROP TABLE IF EXISTS riesgo_sociedad CASCADE;

CREATE TABLE riesgo_sociedad (
    id                  SERIAL PRIMARY KEY,
    id_sociedad         INTEGER NOT NULL REFERENCES sociedades_tag(id_sociedad) ON DELETE CASCADE,
    -- Factores de la matriz
    es_pep              BOOLEAN NOT NULL DEFAULT FALSE,
    residencia          SMALLINT NOT NULL CHECK (residencia IN (1, 3, 5)),
    nacionalidad        SMALLINT NOT NULL CHECK (nacionalidad IN (1, 3, 5)),
    actividad           SMALLINT NOT NULL CHECK (actividad IN (1, 3, 5)),
    antiguedad          SMALLINT NOT NULL CHECK (antiguedad IN (1, 5)),
    materialidad        SMALLINT NOT NULL CHECK (materialidad IN (1, 3, 5)),
    -- Resultado calculado
    puntaje             DECIMAL(4,2) NOT NULL,
    nivel_riesgo        VARCHAR(10) NOT NULL CHECK (nivel_riesgo IN ('bajo', 'medio', 'alto')),
    -- Metadata
    evaluado_por        INTEGER REFERENCES usuarios(id),
    observaciones       TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Columna nivel_riesgo en sociedades_tag para acceso rápido
ALTER TABLE sociedades_tag
    ADD COLUMN IF NOT EXISTS nivel_riesgo VARCHAR(10) CHECK (nivel_riesgo IN ('bajo', 'medio', 'alto'));

-- Índices
CREATE INDEX idx_riesgo_sociedad ON riesgo_sociedad(id_sociedad);
CREATE INDEX idx_riesgo_nivel ON riesgo_sociedad(nivel_riesgo);

-- ============================================================
-- FIN MIGRACIÓN 002
-- ============================================================
