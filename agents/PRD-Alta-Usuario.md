# PRD - Alta Usuario (KYC Onboarding)

| Campo | Valor |
|-------|-------|
| **Status** | En curso |
| **Author(s)** | Chiara Giralt |
| **Stakeholders** | Compliance, Legal, Operaciones, Tecnología |
| **Team** | Dev: Lanfranco Bortolin, Jero Rech |
| **Last Updated** | Abril 2026 |

---

## Resumen Ejecutivo

Este PRD documenta el módulo de Alta Usuario dentro del sistema de Compliance KYC/AML de deCampoPagos. El módulo permite al equipo de Compliance registrar, documentar y aprobar o rechazar el alta de nuevos clientes (personas humanas y jurídicas) desde un entorno centralizado, reemplazando el proceso manual disperso en emails y planillas.

El módulo es el punto de entrada del ciclo de vida de un cliente en la plataforma. Sin él, deCampoPagos no puede operar como PSP bajo los estándares del BCRA y la UIF.

---

## Definición del Problema

### ¿Por qué?

**Problema del usuario (equipo de Compliance):**
Hoy no existe un sistema centralizado para gestionar el onboarding de clientes. Los analistas operan de forma manual: documentación dispersa en emails, carpetas compartidas y hojas de cálculo. Esto genera:
- Falta de trazabilidad en las decisiones de aprobación/rechazo.
- Riesgo de inconsistencias o errores en la información registrada.
- Dificultad para auditar el proceso ante el BCRA o la UIF.
- Dependencia de personas clave para ejecutar el proceso.

**Problema del negocio:**
La operación como PSP requiere que cada cliente tenga un legajo KYC completo y verificable. Sin este módulo, no existe respaldo documental ni trazabilidad para responder ante una auditoría regulatoria.

### ¿Para qué?

- **Para el equipo de Compliance**: Contar con un flujo estructurado de onboarding que centralice datos, documentación y decisiones en un único lugar.
- **Para el negocio**: Habilitar la operación como PSP cumpliendo requerimientos del BCRA y la UIF, reduciendo el riesgo de sanciones.
- **Para la empresa**: Escalar el proceso de onboarding sin incrementar linealmente el equipo de Compliance.

---

## Medición - KPIs y Resultados Esperados

### Métricas de Adopción
| Métrica | Baseline | Target | Cómo se mide |
|---------|----------|--------|--------------|
| % de altas gestionadas en el sistema vs. total onboardeados | 0% | 100% | Clientes creados en sistema vs. total reportado por operaciones |
| % de documentación cargada en sistema vs. recibida por mail | 0% | 90% | Documentos en BD vs. flujo de mail |

### Métricas de Uso
| Métrica | Baseline | Target | Cómo se mide |
|---------|----------|--------|--------------|
| Tiempo promedio de revisión de legajo (pendiente → aprobado/rechazado) | No medido | < 48 hs | Diferencia de timestamps en BD |
| % de clientes con legajo completo al momento de aprobación | No medido | 100% | Documentos requeridos vs. presentes por cliente |

### Métricas de Negocio / Compliance
| Métrica | Baseline | Target | Cómo se mide |
|---------|----------|--------|--------------|
| Clientes aprobados por mes con trazabilidad completa en audit log | 0 | 100% | Audit log en BD |
| Tiempo de respuesta ante auditoría regulatoria (consulta de legajo) | No medido | < 2 hs | Manual |

---

## Discovery

### Diagrama de Flujo

```
[1. Crear legajo]
        |
        v
[2. Cargar datos del cliente]
   Persona Humana o Jurídica
        |
        v
[3. Cargar documentación requerida]
   Checklist según tipo de cliente
        |
        v
[4. Registrar beneficiarios finales]
   y firmantes (solo Persona Jurídica)
        |
        v
[5. Screening automático en listas]
   OFAC / ONU / BCRA inhabilitados
        |
   ¿Match encontrado?
   /            \
[Sí]          [No]
  |              |
[Alerta]    [Continúa]
  \              /
   \            /
    v          v
[6. Evaluación de riesgo automática]
   Bajo / Medio / Alto
        |
        v
[7. Revisión manual — analista Compliance]
        |
   ¿Decisión?
   /          \
[Aprueba]  [Rechaza / Pide más info]
    |               |
    v               v
[Cliente activo] [Legajo en espera o rechazado]
```

### Diseño
- **Web**: [Link a Figma — pendiente]

### Documentación Técnica
- Diagrama ER: `diagrama-er.html`
- Flujo de alta original: `Flujos_Alta_Compliance.html`
- Campos por documento: `Campos_por_Documento_Compliance.docx`

---

## Requerimientos

### 1. Como analista de Compliance
   quiero crear un nuevo cliente en el sistema (persona humana o jurídica)
   para iniciar el proceso de onboarding con toda la información registrada en un único lugar

**Criterios de aceptación:**
- El formulario permite seleccionar el tipo de cliente: Persona Humana o Persona Jurídica antes de cargar datos.
- Al crear el legajo, el sistema asigna automáticamente el estado `Pendiente`.
- El sistema genera un ID único de legajo (ej. `CLT-0001`).
- Se registra en el audit log: fecha de creación, usuario que creó el legajo, estado inicial.
- Si el CUIT ya existe en el sistema, se muestra error con link al legajo existente antes de guardar.

---

### 2. Como analista de Compliance
   quiero registrar los datos de una Persona Humana
   para identificarla correctamente y cumplir con los requerimientos KYC de la UIF

**Criterios de aceptación:**
- Campos obligatorios: nombre completo, CUIT/CUIL (11 dígitos, formato validado), fecha de nacimiento (no futura), nacionalidad, actividad económica, domicilio completo (calle, número, localidad, provincia).
- Campo obligatorio: ¿Es PEP? (Persona Expuesta Políticamente) — boolean.
- Si se marca como PEP, el sistema solicita la carga de la declaración PEP firmada antes de poder aprobar el legajo.
- Campos opcionales: teléfono, email de contacto, notas internas.
- No es posible guardar sin completar los campos obligatorios; el sistema indica cuáles faltan.

---

### 3. Como analista de Compliance
   quiero registrar los datos de una Persona Jurídica
   para identificarla correctamente y cumplir con los requerimientos KYC de la UIF

**Criterios de aceptación:**
- Campos obligatorios: razón social, CUIT (11 dígitos, validado), fecha de constitución, tipo societario (SA, SRL, SAS, Cooperativa, Otro), actividad/objeto social, domicilio legal.
- Campos obligatorios del representante legal: nombre completo y CUIT.
- Campo opcional: domicilio comercial si difiere del legal.
- No es posible guardar sin completar los campos obligatorios; el sistema indica cuáles faltan.

---

### 4. Como analista de Compliance
   quiero cargar y gestionar los documentos requeridos para cada cliente
   para contar con el legajo completo antes de aprobar el alta

**Criterios de aceptación:**
- El sistema muestra el checklist de documentos requeridos según el tipo de cliente:
  - **Persona Humana**: DNI frente, DNI dorso, constancia CUIT (AFIP), comprobante de domicilio (< 90 días), declaración PEP firmada, declaración de actividad económica.
  - **Persona Jurídica**: estatuto/contrato social, acta de designación de autoridades, poderes notariales (condicional), constancia CUIT, último balance cerrado, declaración PEP de cada firmante, declaración PEP de cada beneficiario final, comprobante de domicilio legal.
- Formatos aceptados: PDF, JPG, PNG. Tamaño máximo por archivo: 10 MB.
- Cada documento tiene estado: `Pendiente de carga` / `Cargado — Pendiente revisión` / `Aprobado` / `Rechazado`.
- Al rechazar un documento, el analista debe ingresar el motivo del rechazo (campo texto obligatorio).
- El legajo muestra el porcentaje de completitud documental en tiempo real.
- Se registra en el audit log: quién cargó cada documento y cuándo; quién cambió el estado y cuándo.
- No es posible aprobar el alta si hay documentos obligatorios en estado `Pendiente de carga` o `Rechazado` — el sistema muestra advertencia bloqueante.

---

### 5. Como analista de Compliance
   quiero registrar los beneficiarios finales y firmantes de una Persona Jurídica
   para cumplir con los requerimientos de la UIF sobre identificación de beneficiarios últimos

**Criterios de aceptación:**
- El sistema permite agregar N beneficiarios finales con: nombre completo, CUIT, porcentaje de participación (numérico), tipo de vínculo (socio, accionista, fideicomitente, otro), ¿es PEP? (boolean).
- La suma de porcentajes de participación no puede superar el 100%; el sistema valida en tiempo real.
- Si un beneficiario se marca como PEP, se bloquea la aprobación hasta cargar su declaración PEP.
- Mínimo 1 beneficiario final registrado para poder aprobar el legajo de una PJ.
- Para firmantes/apoderados: nombre completo, CUIT, tipo de poder (general, especial, limitado), fecha de vencimiento del poder (si aplica), ¿es PEP? (boolean).
- Si la fecha de vencimiento del poder es pasada, el sistema muestra advertencia (no bloqueante) y registra alerta en el legajo.

---

### 6. Como sistema
   quiero verificar automáticamente si un cliente figura en listas de sanciones internacionales
   para alertar al equipo de Compliance y cumplir con las obligaciones PLA/FT de la UIF

**Criterios de aceptación:**
- El screening se ejecuta automáticamente al: (1) crear el legajo (primer guardado), (2) antes de cambiar el estado a `Aprobado`.
- Listas verificadas: OFAC, ONU, nómina de inhabilitados BCRA.
- El resultado queda registrado con: fecha de consulta, lista verificada, resultado (match / sin match).
- Si hay match: el sistema bloquea la aprobación y genera una alerta visible en el legajo y en el dashboard.
- El analista puede marcar un match como **"Falso positivo"** con justificación obligatoria; queda registrado en el audit log.
- Si el screening falla por error de conectividad, el sistema lo indica y bloquea la aprobación hasta que se complete exitosamente.

---

### 7. Como analista de Compliance
   quiero ver la evaluación de riesgo calculada automáticamente para cada cliente
   para enfocar la revisión manual en los casos de mayor exposición

**Criterios de aceptación:**
- El riesgo se calcula automáticamente al guardar el legajo y se recalcula si se modifican los datos relevantes.
- Variables: actividad económica (30%), zona geográfica (20%), tipo societario (15%), condición PEP (20%), volumen declarado de operaciones (15%).
- Resultado: `Bajo` / `Medio` / `Alto`.
- La metodología de cálculo es visible en el detalle del legajo (sección expandible o tooltip).
- El analista puede sobrescribir el nivel de riesgo calculado con justificación obligatoria; queda en el audit log.
- Solo Nivel 1 puede configurar los pesos y umbrales de la matriz desde la pantalla de configuración.

---

### 8. Como analista de Compliance (Nivel 1)
   quiero aprobar o rechazar el alta de un cliente con justificación
   para dejar trazabilidad completa de la decisión con fecha, responsable y motivo

**Criterios de aceptación:**
- Estados del legajo: `Pendiente` → `En Revisión` → `Pendiente de Documentación` → `Aprobado` / `Rechazado`.
- Solo Nivel 1 (Oficial de Cumplimiento) puede cambiar el estado a `Aprobado` o `Rechazado`.
- Nivel 2 puede cambiar a: `En Revisión`, `Pendiente de Documentación`.
- Nivel 3 solo puede visualizar, sin modificar estados.
- Cada cambio de estado requiere comentario/justificación obligatorio.
- El historial completo de estados es visible en el detalle del cliente (línea de tiempo).
- El sistema registra en el audit log: estado anterior, estado nuevo, usuario, timestamp, justificación.
- Bloqueos de aprobación: documentos obligatorios pendientes o rechazados / screening no ejecutado o con match sin resolver / PEP sin declaración cargada.

---

### 9. Como analista de Compliance
   quiero ver el listado de clientes con filtros y búsqueda
   para gestionar eficientemente la cola de revisión

**Criterios de aceptación:**
- Columnas: ID legajo, Nombre / Razón social, CUIT, Tipo (PH/PJ), Estado, Nivel de riesgo, Fecha de creación, Responsable asignado.
- Filtros disponibles: Estado (multiselect), Tipo de cliente, Nivel de riesgo, Rango de fechas de creación, Responsable asignado.
- Búsqueda por nombre/razón social o CUIT (búsqueda parcial).
- El listado filtrado puede exportarse a `.txt (CSV)`.
- Paginación: 20 registros por página por defecto, configurable a 50 o 100.

---

## Fuera de Alcance (Out of Scope)

- **Integración en tiempo real con API de la AFIP para validación de CUIT** — Se evaluará en V2; por ahora la validación es de formato.
- **Portal de autogestión para que el cliente cargue sus propios documentos** — Requiere diseño de flujo externo no contemplado en esta fase.
- **Notificaciones automáticas por email al cliente** — Se evaluará post-lanzamiento según feedback del equipo de Compliance.
- **Integración directa con base de datos de listas OFAC/ONU via API** — En V1 puede ser verificación manual o batch; la integración automática queda para V2.
- **Firma digital de documentos dentro de la plataforma** — Fuera de alcance regulatorio en esta fase.

---

## Riesgos

### Técnicos
- **El almacenamiento de documentos en producción (S3/Supabase Storage) no está configurado.**
  - Mitigación: Definir proveedor de storage antes de iniciar el módulo documental. Bloquea la carga de archivos.

- **La migración de SQLite a PostgreSQL está pendiente.**
  - Mitigación: El módulo debe desarrollarse compatible con Sequelize/PostgreSQL desde el inicio; no asumir SQLite como destino final.

### De Adopción
- **El equipo de Compliance puede seguir usando el proceso manual en paralelo.**
  - Mitigación: Definir fecha de corte oficial donde el proceso manual deja de ser la fuente de verdad.

### Regulatorios
- **Los requerimientos documentales de la UIF pueden cambiar.**
  - Mitigación: El checklist de documentos debe ser configurable por el Oficial de Cumplimiento sin requerir un deploy.

### De Timeline
- **La definición del proveedor de hosting (Railway/Render, Vercel/Netlify) no está resuelta.**
  - Mitigación: Resolver antes del inicio de desarrollo del módulo para no bloquear el ambiente productivo.

---

## Dependencias

| Dependencia | Estado | Impacto si no está lista |
|-------------|--------|--------------------------|
| Módulo de autenticación y roles (Nivel 1, 2, 3) | Desarrollado | Bloqueante — sin roles no se pueden aplicar restricciones de aprobación |
| Módulo de Audit Log | Desarrollado (parcial) | Bloqueante — el registro de trazabilidad es requerimiento regulatorio |
| Almacenamiento de archivos (S3 / Supabase Storage) | Pendiente | Bloqueante para carga documental |
| Servicio de screening (OFAC/ONU/BCRA) | Pendiente | Bloqueante para aprobación de legajos |
| Migración a PostgreSQL | Pendiente | Necesaria antes de salida a producción |

---

## Tracking / Eventos

| Evento | Dónde | Event Category | Event Action | Event Name | Negocio | Producto | Placement |
|--------|-------|----------------|--------------|------------|---------|----------|-----------|
| Inicio de creación de legajo | `/clientes/nuevo` | Interacción | IniciarAltaCliente | Iniciar alta cliente | dCP | Compliance | CTA General |
| Selección tipo de cliente (PH/PJ) | Formulario alta | Interacción | SeleccionTipoCliente | Seleccionar tipo cliente | dCP | Compliance | CTA Particular |
| Guardado de datos del cliente | Formulario alta | Interacción | GuardarDatosCliente | Guardar datos cliente | dCP | Compliance | CTA General |
| Carga de documento | Checklist documental | Interacción | CargarDocumento | Cargar documento | dCP | Compliance | CTA Particular |
| Cambio de estado de documento | Checklist documental | Interacción | CambiarEstadoDocumento | Cambiar estado documento | dCP | Compliance | CTA Particular |
| Ejecución de screening | Detalle legajo | Interacción | EjecutarScreening | Ejecutar screening | dCP | Compliance | CTA Particular |
| Match encontrado en screening | Detalle legajo | Navegación | MatchScreening | Match en lista de sanciones | dCP | Compliance | - |
| Cambio de estado del legajo | Detalle legajo | Interacción | CambiarEstadoLegajo | Cambiar estado legajo | dCP | Compliance | CTA General |
| Legajo aprobado | Detalle legajo | Interacción | AprobarLegajo | Aprobar legajo | dCP | Compliance | CTA General |
| Legajo rechazado | Detalle legajo | Interacción | RechazarLegajo | Rechazar legajo | dCP | Compliance | CTA General |
| Exportar listado a .txt (CSV) | Listado clientes | Interacción | ExportarTXTClientes | Exportar clientes .txt | dCP | Compliance | CTA General |

---

## Agenda / Plan de Desarrollo

| Instancia | Status | Fecha | Notas |
|-----------|--------|-------|-------|
| Kickoff | | | |
| Desarrollo experiencia (UX) | | | Pendiente diseño en Figma |
| Iteración experiencia | | | |
| Alineación con negocio | | | |
| Desarrollo | En curso | | Frontend en DEMO_MODE, backend base desarrollado |
| Salida a PROD | | | Bloqueado por migración a PostgreSQL y storage |
