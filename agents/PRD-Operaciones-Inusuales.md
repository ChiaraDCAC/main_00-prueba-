# PRD - Operaciones Inusuales (Monitoreo AML)

| Campo | Valor |
|-------|-------|
| **Status** | En curso |
| **Author(s)** | Chiara Giralt |
| **Stakeholders** | Compliance, Legal, Operaciones, Tecnología |
| **Team** | Dev: Lanfranco Bortolin, Jero Rech |
| **Last Updated** | Abril 2026 |

---

## Resumen Ejecutivo

Este PRD documenta el módulo de Operaciones Inusuales dentro del sistema de Compliance KYC/AML de deCampoPagos. El módulo permite al equipo de Compliance detectar, analizar y resolver operaciones que presentan señales de alerta de lavado de activos o financiamiento del terrorismo (PLA/FT).

**Las Operaciones Inusuales (OI) son detectadas por un sistema externo y levantadas automáticamente por esta herramienta. El analista no puede crear OI de forma manual.** Cada OI tiene dos posibles cierres: `Justificada` (con comentario obligatorio) o `OS — Operación Sospechosa` (el ROS se emite fuera de la herramienta).

---

## Definición del Problema

### ¿Por qué?

**Problema del usuario (equipo de Compliance):**
Hoy no existe un sistema para gestionar operaciones inusuales detectadas automáticamente. Los analistas documentan estos casos de forma ad-hoc en emails o planillas, sin un flujo estructurado ni trazabilidad del proceso de análisis. Esto genera:
- Imposibilidad de demostrar ante la UIF que se siguió un proceso de análisis antes de emitir o descartar un ROS.
- Riesgo de que casos se pierdan o no se resuelvan a tiempo.
- Falta de visibilidad para el Oficial de Cumplimiento sobre el estado de los casos abiertos.

**Problema del negocio:**
La UIF exige que los sujetos obligados (como deCampoPagos como PSP) cuenten con un sistema de monitoreo de operaciones y un proceso documentado para la gestión de OI y la emisión de ROS. La ausencia de este módulo expone a la empresa a sanciones regulatorias.

### ¿Para qué?

- **Para el equipo de Compliance**: Tener un flujo estructurado para gestionar OI, con evidencia adjunta, comentarios de análisis y estados claramente definidos.
- **Para el negocio**: Cumplir con la obligación regulatoria de monitoreo de operaciones ante la UIF, reduciendo el riesgo de sanciones.
- **Para la empresa**: Generar evidencia documentada del proceso de compliance ante cualquier auditoría.

---

## Medición - KPIs y Resultados Esperados

### Métricas de Adopción
| Métrica | Baseline | Target | Cómo se mide |
|---------|----------|--------|--------------|
| % de OI generadas resueltas dentro de las 48 hs | No medido | 80% | Timestamps en BD |
| % de OI cerradas como OS vs. total de OI generadas | No medido | A definir con Compliance | Conteo en BD |

### Métricas de Uso
| Métrica | Baseline | Target | Cómo se mide |
|---------|----------|--------|--------------|
| Tiempo promedio de resolución de una OI (apertura → cierre) | No medido | < 48 hs | Diferencia de timestamps en BD |

### Métricas de Negocio / Compliance
| Métrica | Baseline | Target | Cómo se mide |
|---------|----------|--------|--------------|
| OI no resueltas visibles en el dashboard (> 48 hs) | No medido | 0 en todo momento | Conteo en dashboard |

---

## Discovery

### Diagrama de Flujo

```
[Sistema externo detecta operación inusual]
  (integración via API/JSON — pendiente definición técnica)
             |
             v
[Herramienta levanta la OI — estado: Nueva]
             |
             v
          [Revisión del analista]
          (Nivel 1 o Nivel 2)
             |
          ¿Qué decide?
          /                      \
   [Justificada]             [OS — Operación Sospechosa]
  (comentario obligatorio)    (comentario obligatorio)
         |                              |
         v                             v
  [OI cerrada — Justificada]   [OI cerrada — OS]
                               [ROS se emite fuera
                                de la herramienta]
```

### Diseño
- **Web**: [Link a Figma — pendiente]

### Documentación Técnica
- PRD padre: `PRD-Sistema-Compliance.md`
- Diagrama ER: `diagrama-er.html`
- Flujo monitoreo operacional: `Flujos_Alta_Compliance.html`

---

## Requerimientos

---

#### CU-01 — Levantamiento de Operaciones Inusuales desde sistema externo

| | |
|---|---|
| **Actor principal** | Sistema (integración con sistema externo) |
| **Precondiciones** | Integración con el sistema externo configurada y activa. |
| **Frecuencia** | Automática, según la frecuencia de sincronización definida (pendiente de definición técnica). |

**Flujo principal:**
1. El sistema externo detecta una operación inusual y la expone vía API/JSON.
2. La herramienta de Compliance levanta la OI y la registra con estado `Nueva`.
3. La OI queda vinculada al cliente correspondiente en el sistema.
4. La OI aparece en el dashboard y en el listado para gestión del analista.

---

**Requerimientos:**

- **RF-01.1** El sistema levanta automáticamente las OI expuestas por el sistema externo (integración via API/JSON — método a definir por el equipo técnico).
- **RF-01.2** Cada OI levantada recibe un ID único interno (ej. `OI-0001`) y queda vinculada al cliente correspondiente.
- **RF-01.3** La OI aparece en el dashboard (conteo de OI abiertas) y en el listado de gestión con estado `Nueva`.
- **RF-01.4** El analista no puede crear una OI de forma manual.

**Criterios de Aceptación:**

- **CA-01.1** Toda OI recibida del sistema externo queda registrada en la BD con estado `Nueva` y vinculada al cliente.
- **CA-01.2** El ID interno de OI es único e irrepetible.
- **CA-01.3** La OI aparece en el listado y en el dashboard dentro de los 5 minutos de recibida.
- **CA-01.4** El sistema no permite crear OI desde el formulario del analista.

---

#### CU-02 — Resolver una Operación Inusual

| | |
|---|---|
| **Actor principal** | Analista (Nivel 2) / Oficial de Cumplimiento (Nivel 1) |
| **Precondiciones** | OI en estado `Nueva`. Sesión iniciada. |
| **Frecuencia** | A demanda, al revisar cada OI generada por el sistema. |

**Flujo principal:**
1. El analista accede al detalle de la OI desde el listado o el dashboard.
2. Revisa la información de la transacción y el historial del cliente.
3. Adjunta evidencia relevante y registra comentarios de análisis.
4. Decide el cierre:
   - **Justificada**: ingresa comentario obligatorio explicando el motivo; la OI se cierra como `Justificada`.
   - **OS (Operación Sospechosa)**: ingresa comentario obligatorio; la OI se cierra como `OS`. El ROS se emite por fuera de la herramienta.
5. El sistema registra el cambio en el audit log.

---

**Requerimientos:**

- **RF-02.1** Los estados posibles de una OI son: `Nueva` → `Justificada` o `OS`.
- **RF-02.2** Tanto Nivel 1 como Nivel 2 pueden resolver una OI (cerrarla como `Justificada` o `OS`).
- **RF-02.3** El cierre de una OI (por cualquier vía) requiere comentario obligatorio.
- **RF-02.4** Una vez cerrada (`Justificada` u `OS`), la OI no puede reabrirse ni editarse.
- **RF-02.5** Cada cambio de estado queda registrado en el audit log: usuario, timestamp, estado anterior, estado nuevo, comentario.

**Criterios de Aceptación:**

- **CA-02.1** No es posible cerrar una OI sin ingresar un comentario; el sistema bloquea la acción y muestra mensaje de error.
- **CA-02.2** Al cerrar como `OS`, la OI queda marcada en la BD y el analista recibe confirmación de que el ROS debe emitirse fuera de la herramienta.
- **CA-02.3** Una OI cerrada no puede ser modificada ni reabierta desde la interfaz.
- **CA-02.4** El audit log refleja usuario, timestamp y comentario para cada cierre.

---

#### CU-03 — Adjuntar evidencia a una OI

| | |
|---|---|
| **Actor principal** | Analista (Nivel 2) / Oficial de Cumplimiento (Nivel 1) |
| **Precondiciones** | OI en estado `Nueva`. Sesión iniciada. |
| **Frecuencia** | Durante el proceso de análisis, antes del cierre. |

**Flujo principal:**
1. El analista accede al detalle de la OI.
2. Selecciona el archivo a adjuntar desde su equipo.
3. El sistema valida formato y tamaño.
4. El archivo queda adjunto a la OI con registro de quién lo cargó y cuándo.

---

**Requerimientos:**

- **RF-03.1** El sistema permite adjuntar N archivos por OI.
- **RF-03.2** Formatos aceptados: PDF, JPG, PNG, XLSX, DOCX. Tamaño máximo: 20 MB por archivo.
- **RF-03.3** Cada adjunto registra: usuario que lo cargó y timestamp.
- **RF-03.4** Los adjuntos son visibles solo para usuarios con acceso al sistema.
- **RF-03.5** Solo se puede eliminar un adjunto mientras la OI está en estado `Nueva`. Una vez cerrada, los adjuntos no pueden eliminarse.

**Criterios de Aceptación:**

- **CA-03.1** Un archivo fuera de formato o que supera 20 MB es rechazado con mensaje de error claro.
- **CA-03.2** Cada adjunto muestra nombre, fecha de carga y usuario que lo subió.
- **CA-03.3** Intentar eliminar un adjunto de una OI cerrada devuelve error; la opción no está disponible en la UI.

---

#### CU-04 — Registrar comentarios de análisis

| | |
|---|---|
| **Actor principal** | Analista (Nivel 2) / Oficial de Cumplimiento (Nivel 1) |
| **Precondiciones** | OI en estado `Nueva`. Sesión iniciada. |
| **Frecuencia** | Durante el proceso de análisis. |

**Flujo principal:**
1. El analista accede al detalle de la OI.
2. Escribe un comentario en el hilo de análisis.
3. El sistema guarda el comentario con usuario y timestamp.

---

**Requerimientos:**

- **RF-04.1** La OI cuenta con un hilo de comentarios internos ordenado cronológicamente.
- **RF-04.2** Cada comentario registra: texto, usuario y timestamp.
- **RF-04.3** Los comentarios no pueden editarse ni eliminarse (inmutabilidad del historial).

**Criterios de Aceptación:**

- **CA-04.1** El hilo de comentarios muestra todos los registros ordenados de más antiguo a más reciente.
- **CA-04.2** No existe opción de editar o eliminar un comentario ya guardado.

---

#### CU-05 — Ver listado de OI con filtros y exportar

| | |
|---|---|
| **Actor principal** | Analista (Nivel 2) / Oficial de Cumplimiento (Nivel 1) |
| **Precondiciones** | Sesión iniciada. |
| **Frecuencia** | Consulta diaria / gestión de cola de trabajo. |

**Flujo principal:**
1. El analista navega a `Operaciones Inusuales`.
2. Aplica filtros según necesidad.
3. Visualiza el listado de OI.
4. Opcionalmente exporta el listado a `.txt (CSV)`.

---

**Requerimientos:**

- **RF-05.1** El listado muestra: ID OI, Cliente asociado, Monto, Fecha de la transacción, Estado, Analista asignado, Fecha de generación, Días abierto.
- **RF-05.2** Filtros disponibles: Estado (multiselect), Rango de fechas de generación, Analista asignado.
- **RF-05.3** Búsqueda por nombre/CUIT del cliente o ID de OI.
- **RF-05.4** Ordenamiento por días abierto (descendente por defecto).
- **RF-05.5** El listado puede exportarse a `.txt (CSV)`. La exportación queda registrada en el audit log.

**Criterios de Aceptación:**

- **CA-05.1** Los filtros reducen correctamente los resultados mostrados.
- **CA-05.2** El archivo `.txt` exportado contiene exactamente los registros visibles con los filtros aplicados.
- **CA-05.3** La exportación queda registrada en el audit log con usuario, timestamp y filtros aplicados.

---

## Fuera de Alcance (Out of Scope)

- **Detección de operaciones inusuales** — La detección y configuración de umbrales es responsabilidad del sistema externo, no de esta herramienta.
- **Configuración de umbrales de monitoreo** — Pertenece al sistema externo.
- **Notificaciones por email o WhatsApp al analista** — Se evaluará en V2.
- **Módulo de gestión de contrapartes sospechosas (listas negras internas)** — Se definirá en una fase posterior con Legal y Compliance.
- **Visualizaciones de red de vínculos entre clientes** — Fuera de alcance en V1.
- **Emisión del ROS** — Se gestiona fuera de la herramienta de Compliance.

---

## Riesgos

### Técnicos
- **La integración con el sistema externo es bloqueante para el módulo completo.**
  - Mitigación: Definir el contrato de integración (API/JSON, frecuencia de sincronización, formato de datos) antes del inicio del desarrollo.

- **La migración a PostgreSQL está pendiente; las tablas de OI deben soportar volúmenes transaccionales.**
  - Mitigación: Asegurar que las tablas de OI estén indexadas correctamente desde el diseño inicial.

### Regulatorios
- **La UIF puede emitir nuevas normativas que cambien los criterios de reporte.**
  - Mitigación: Los umbrales deben ser configurables por el Oficial de Cumplimiento sin requerir un deploy.

---

## Dependencias

| Dependencia | Estado | Impacto si no está lista |
|-------------|--------|--------------------------|
| Módulo de Clientes (Alta Usuario) | En desarrollo | Bloqueante — las OI deben asociarse a un cliente existente |
| Módulo de Audit Log | Desarrollado (parcial) | Bloqueante — registro de historial es requerimiento regulatorio |
| Integración con sistema externo (API/JSON) | Pendiente de definición técnica | Bloqueante — sin integración no se pueden levantar OI |
| Migración a PostgreSQL | Pendiente | Necesaria antes de salida a producción |

---

## Tracking / Eventos

| Evento | Dónde | Event Category | Event Action | Event Name | Negocio | Producto | Placement |
|--------|-------|----------------|--------------|------------|---------|----------|-----------|
| OI generada automáticamente | Sistema / Dashboard | Sistema | OIGenerada | OI generada automáticamente | dCP | Compliance | - |
| Ver detalle de OI | Listado OI | Navegación | VerDetalleOI | Ver detalle OI | dCP | Compliance | - |
| Cerrar OI como Justificada | Detalle OI | Interacción | CerrarOIJustificada | Cerrar OI justificada | dCP | Compliance | CTA General |
| Cerrar OI como OS | Detalle OI | Interacción | CerrarOIOS | Cerrar OI como OS | dCP | Compliance | CTA General |
| Adjuntar evidencia | Detalle OI | Interacción | AdjuntarEvidenciaOI | Adjuntar evidencia OI | dCP | Compliance | CTA Particular |
| Agregar comentario de análisis | Detalle OI | Interacción | AgregarComentarioOI | Agregar comentario OI | dCP | Compliance | CTA Particular |
| Exportar listado a .txt (CSV) | Listado OI | Interacción | ExportarTXTOI | Exportar OI .txt | dCP | Compliance | CTA General |

---

## Agenda / Plan de Desarrollo

| Instancia | Status | Fecha | Notas |
|-----------|--------|-------|-------|
| Kickoff | | | |
| Desarrollo experiencia (UX) | | | Pendiente diseño en Figma |
| Iteración experiencia | | | |
| Alineación con negocio | | | Definir umbrales iniciales con Compliance |
| Desarrollo | | | Depende del módulo Alta Usuario |
| Salida a PROD | | | Bloqueado por migración a PostgreSQL |
