# PRD - Reportes de Gestión Interna

| Campo | Valor |
|-------|-------|
| **Status** | En curso |
| **Author(s)** | Chiara Giralt |
| **Stakeholders** | Compliance, Operaciones, Dirección, Tecnología |
| **Team** | Dev: Lanfranco Bortolin, Jero Rech |
| **Last Updated** | Abril 2026 |

---

## Resumen Ejecutivo

Este PRD documenta el módulo de Reportes de Gestión Interna del sistema de Compliance KYC/AML de deCampoPagos. El módulo provee al equipo de Compliance y a Dirección visibilidad en tiempo real del estado del proceso mediante un dashboard centralizado y la posibilidad de exportar listados operativos en formato `.txt (CSV)`.

> **Nota:** El Reporte de Operaciones Sospechosas (ROS) ante la UIF se gestiona por fuera de esta herramienta. Los reportes regulatorios (ARCA F.8126, BCRA Base Padrón, UIF Apartados A/B/C) están documentados en `PRD-Reportes-Regulatorios.md`.

---

## Definición del Problema

### ¿Por qué?

**Problema del usuario (equipo de Compliance y Dirección):**
El Oficial de Cumplimiento y los analistas no tienen visibilidad en tiempo real del estado del proceso. Para conocer cuántos clientes están pendientes de revisión, cuántas alertas están abiertas o cuántos casos de operaciones inusuales están activos, deben consultar manualmente la base de datos o armar reportes ad-hoc en planillas. Esto genera:
- Demora en la detección de situaciones críticas (alertas vencidas, legajos trabados).
- Dificultad para presentar métricas ante Dirección o ante auditorías.
- Falta de trazabilidad sobre qué datos fueron exportados y por quién.

**Problema del negocio:**
Sin visibilidad consolidada del proceso, el equipo de Compliance no puede demostrar ante un auditor regulatorio que el proceso opera correctamente ni identificar cuellos de botella a tiempo.

### ¿Para qué?

- **Para el equipo de Compliance**: Contar con un dashboard que muestre el estado del proceso en tiempo real y permita exportar listados operativos sin intervención técnica.
- **Para Dirección**: Tener métricas del proceso disponibles en cualquier momento para la toma de decisiones.
- **Para el negocio**: Poder responder ante consultas de auditoría con información exportable en menos de 2 horas.

---

## Medición - KPIs y Resultados Esperados

### Métricas de Adopción
| Métrica | Baseline | Target | Cómo se mide |
|---------|----------|--------|--------------|
| % de analistas que consultan el dashboard al menos 1 vez por semana | 0% | 80% | Eventos en Matomo |
| % de exportaciones de listados realizadas desde el sistema vs. solicitudes manuales al equipo técnico | 0% | 100% | Eventos en Matomo |

### Métricas de Uso
| Métrica | Baseline | Target | Cómo se mide |
|---------|----------|--------|--------------|
| Tiempo promedio para obtener un reporte de clientes exportable | No medido | < 5 min | Timestamps en BD |
| Alertas no gestionadas visibles en el dashboard (> 48 hs) | No medido | 0 en todo momento | Conteo en dashboard |

### Métricas de Negocio / Compliance
| Métrica | Baseline | Target | Cómo se mide |
|---------|----------|--------|--------------|
| Tiempo de respuesta ante consulta de auditoría (legajos, OI) | No medido | < 2 hs | Manual |

---

## Discovery

### Diagrama de Flujo — Dashboard y Reportes de Gestión

```
[Analista / Oficial de Cumplimiento ingresa al Dashboard]
           |
           v
[Vista en tiempo real:]
  - Clientes por estado
  - Distribución por nivel de riesgo
  - Alertas activas no gestionadas
  - Casos de operaciones inusuales abiertos
           |
     ¿Necesita exportar?
     /              \
   [No]            [Sí]
    |                |
    v                v
[Solo visualiza] [Selecciona tipo de reporte y filtros]
                         |
                         v
               [Exporta a .txt (CSV)]
```

### Diseño
- **Web**: [Link a Figma — pendiente]

### Documentación Técnica
- PRD padre: `PRD-Sistema-Compliance.md`
- Sub-PRD Alta Usuario: `agents/PRD-Alta-Usuario.md`
- Sub-PRD Operaciones Inusuales: `agents/PRD-Operaciones-Inusuales.md`
- Sub-PRD Reportes Regulatorios: `agents/PRD-Reportes-Regulatorios.md`
- Diagrama ER: `diagrama-er.html`

---

## Requerimientos

---

#### CU-01 — Ver dashboard de gestión del proceso de Compliance

| | |
|---|---|
| **Actor principal** | Oficial de Cumplimiento (Nivel 1) / Analista (Nivel 2) |
| **Precondiciones** | Sesión iniciada. Datos de clientes, alertas y casos disponibles en BD. |
| **Frecuencia** | Consulta diaria / en cualquier momento. |

**Flujo principal:**
1. El analista ingresa al sistema y accede al Dashboard desde el menú principal.
2. El sistema muestra todos los indicadores actualizados en tiempo real.
3. El analista hace click en un indicador para navegar al listado correspondiente con los filtros aplicados.

---

**Requerimientos:**

- **RF-01.1** El dashboard debe mostrar los siguientes indicadores en tiempo real:
  - Clientes por estado: `Pendiente` / `En Revisión` / `Pendiente de Documentación` / `Aprobado` / `Rechazado` (gráfico + conteo).
  - Distribución por nivel de riesgo: `Bajo` / `Medio` / `Alto` (gráfico + conteo).
  - Alertas activas no gestionadas: conteo total; destacadas en rojo las que superan 48 hs sin gestión.
  - Casos de operaciones inusuales abiertos: conteo por estado (`Nuevo` / `En Análisis` / `Escalado`).

- **RF-01.2** El dashboard debe ser visible para Nivel 1 y Nivel 2. Nivel 3 no tiene acceso.

- **RF-01.3** Cada indicador debe ser clickeable y navegar al listado correspondiente con los filtros ya aplicados.

**Criterios de Aceptación:**

- **CA-01.1** Los conteos del dashboard reflejan el estado actual de la BD sin necesidad de recargar la página manualmente (actualización en tiempo real o con refresh máximo de 1 minuto).
- **CA-01.2** Las alertas con más de 48 hs sin gestión aparecen con indicador visual rojo diferenciado.
- **CA-01.3** Al hacer click en "Clientes por estado — Pendiente", el sistema navega al listado de clientes filtrado por estado = `Pendiente`.
- **CA-01.4** El dashboard no es accesible para usuarios Nivel 3; al intentar ingresar se muestra mensaje de acceso restringido.

---

#### CU-02 — Exportar reporte de clientes

| | |
|---|---|
| **Actor principal** | Oficial de Cumplimiento (Nivel 1) / Analista (Nivel 2) |
| **Precondiciones** | Sesión iniciada. |
| **Frecuencia** | A demanda (para auditorías, revisiones de gestión, etc.) |

**Flujo principal:**
1. El analista navega a `Reportes > Clientes`.
2. Aplica los filtros deseados (estado, tipo, riesgo, rango de fechas).
3. Presiona "Exportar .txt".
4. El sistema genera el archivo y lo descarga automáticamente.
5. El sistema registra la exportación en el audit log.

---

**Requerimientos:**

- **RF-02.1** El reporte de clientes debe incluir las siguientes columnas: ID legajo, Nombre / Razón social, CUIT, Tipo (PH/PJ), Estado, Nivel de riesgo, Fecha de alta, Fecha de aprobación/rechazo, Analista responsable.

- **RF-02.2** Filtros disponibles: Estado (multiselect), Tipo de cliente (PH/PJ), Nivel de riesgo, Rango de fechas de creación, Analista responsable.

- **RF-02.3** El archivo exportado debe estar en formato `.txt` con separador de campos compatible con CSV.

- **RF-02.4** La exportación debe registrarse en el audit log: usuario, timestamp, filtros aplicados, cantidad de registros exportados.

**Criterios de Aceptación:**

- **CA-02.1** El archivo `.txt` exportado puede abrirse correctamente en Excel o cualquier editor de texto.
- **CA-02.2** Los datos del archivo coinciden exactamente con los registros visibles en el listado con los mismos filtros aplicados.
- **CA-02.3** La exportación queda registrada en el audit log con todos los metadatos requeridos.
- **CA-02.4** Si no hay registros que coincidan con los filtros, el sistema informa al analista antes de generar el archivo vacío.

---

#### CU-03 — Exportar reporte de operaciones inusuales

| | |
|---|---|
| **Actor principal** | Oficial de Cumplimiento (Nivel 1) / Analista (Nivel 2) |
| **Precondiciones** | Sesión iniciada. |
| **Frecuencia** | A demanda. |

**Flujo principal:**
1. El analista navega a `Reportes > Operaciones Inusuales`.
2. Aplica filtros (estado, rango de fechas, analista).
3. Presiona "Exportar .txt".
4. El sistema genera y descarga el archivo.
5. Registra la exportación en el audit log.

---

**Requerimientos:**

- **RF-03.1** El reporte de operaciones inusuales debe incluir: ID caso, Cliente asociado, Tipo de operación, Monto, Fecha de operación, Estado, Analista asignado, Fecha de apertura, Fecha de cierre (si aplica).

- **RF-03.2** Filtros disponibles: Estado (multiselect), Rango de fechas de apertura, Analista asignado.

- **RF-03.3** El archivo exportado en formato `.txt` con separador compatible con CSV.

- **RF-03.4** Registrar la exportación en el audit log.

**Criterios de Aceptación:**

- **CA-03.1** El archivo `.txt` refleja exactamente los casos visibles con los filtros aplicados.
- **CA-03.2** La exportación queda registrada en el audit log con usuario, timestamp y filtros.
- **CA-03.3** Los campos de fecha están en formato legible (YYYY-MM-DD).

---

## Fuera de Alcance (Out of Scope)

- **ROS (Reporte de Operaciones Sospechosas)** — Se gestiona por fuera de la herramienta de Compliance.
- **Reportes regulatorios (ARCA, BCRA, UIF)** — Documentados en `PRD-Reportes-Regulatorios.md`.
- **Análisis comparativo histórico en el dashboard (tendencias mes a mes)** — Fuera de alcance en V1; el dashboard muestra estado actual.
- **Envío automático de reportes por email a Dirección** — Se evaluará en V2.
- **Reportes en formato Excel (.xlsx)** — En V1 solo `.txt (CSV)`.

---

## Riesgos

### Técnicos
- **Los reportes de exportación con filtros sobre grandes volúmenes de datos pueden ser lentos.**
  - Mitigación: Implementar generación en background con descarga asíncrona para no bloquear la UI.

### De Adopción
- **El Oficial de Cumplimiento puede no consultar el dashboard diariamente si no hay un disparador visual.**
  - Mitigación: Mostrar el conteo de alertas no gestionadas y casos vencidos en el header del sistema, visible en todas las pantallas.

---

## Dependencias

| Dependencia | Estado | Impacto si no está lista |
|-------------|--------|--------------------------|
| Módulo de Clientes (Alta Usuario) | En desarrollo | Bloqueante — el dashboard y el reporte de clientes dependen de los datos de legajos |
| Módulo de Operaciones Inusuales | Pendiente | Bloqueante — el dashboard y el reporte de OI dependen de los casos registrados |
| Módulo de Audit Log | Desarrollado (parcial) | Bloqueante — el registro de exportaciones es requerimiento de trazabilidad |
| Migración a PostgreSQL | Pendiente | Necesaria antes de salida a producción |

---

## Tracking / Eventos

| Evento | Dónde | Event Category | Event Action | Event Name | Negocio | Producto | Placement |
|--------|-------|----------------|--------------|------------|---------|----------|-----------|
| Vista del dashboard | `/dashboard` | Navegación | VerDashboard | Ver dashboard Compliance | dCP | Compliance | - |
| Click en indicador del dashboard | Dashboard | Interacción | ClickIndicadorDashboard | Click indicador dashboard | dCP | Compliance | CTA Particular |
| Exportar reporte de clientes | Sección reportes | Interacción | ExportarReporteClientes | Exportar reporte clientes .txt | dCP | Compliance | CTA General |
| Exportar reporte de OI | Sección reportes | Interacción | ExportarReporteOI | Exportar reporte OI .txt | dCP | Compliance | CTA General |

---

## Agenda / Plan de Desarrollo

| Instancia | Status | Fecha | Notas |
|-----------|--------|-------|-------|
| Kickoff | | | |
| Desarrollo experiencia (UX) | | | Pendiente diseño dashboard en Figma |
| Iteración experiencia | | | |
| Alineación con negocio | | | Confirmar indicadores clave con Compliance y Dirección |
| Desarrollo — Dashboard | | | Depende de módulos Alta Usuario y OI |
| Desarrollo — Exportaciones .txt | | | |
| Salida a PROD | | | Bloqueado por migración a PostgreSQL |
