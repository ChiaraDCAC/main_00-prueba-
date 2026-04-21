# PRD - Herramienta Compliance PSP

| Campo | Valor |
|-------|-------|
| **Status** | En curso |
| **Author(s)** | Chiara Giralt · Lanfranco Bortolin · Jerónimo Rech |
| **Stakeholders** | Administración · Compliance · Atención al Cliente · Legal |
| **Team** | Producto · Operaciones · Tecnología |
| **Last Updated** | Abril 2026 — v3 |

---

## Resumen Ejecutivo

Se está desarrollando una herramienta interna de Compliance para deCampoPagos (dCP) que centraliza la gestión de onboarding de clientes, validación documental, monitoreo de operaciones y generación de reportes regulatorios. El sistema da respuesta a los requerimientos del BCRA y la UIF que deben cumplirse para operar como Proveedor de Servicios de Pago (PSP).

El producto reemplaza procesos manuales dispersos por un sistema estructurado que permite al equipo de Compliance gestionar legajos, aprobar o rechazar clientes con trazabilidad completa, detectar operaciones inusuales y emitir Reportes de Operaciones Sospechosas (ROS) ante la UIF, todo desde un único entorno centralizado.

Hay dos perfiles de usuario principales: **analista de Compliance** (revisión, aprobación, riesgo) y **analista de Atención al Cliente** (carga de documentación, seguimiento, comunicación con el cliente).

---

## Definición del Problema

### ¿Por qué?

**Problema del usuario:**
El equipo de Compliance no cuenta con un sistema centralizado. Documentación dispersa en emails, carpetas compartidas y hojas de cálculo genera:
- Falta de trazabilidad en decisiones de aprobación/rechazo de clientes.
- Riesgo de inconsistencias o errores en la información registrada.
- Dificultad para auditar el proceso ante BCRA o UIF.
- Dependencia de personas clave para operar el proceso.

**Problema del negocio:**
La expansión hacia lending y factoring requiere constituirse como PSP. BCRA y UIF exigen recolección, verificación y conservación de información KYC, así como gestión de prevención de lavado de activos y financiamiento del terrorismo (PLA/FT). Sin un sistema que respalde estos procesos, la empresa no puede operar bajo las nuevas líneas de negocio ni responder adecuadamente a auditorías regulatorias.

### ¿Para qué?

- **Para el equipo de Compliance**: Contar con un flujo estructurado que centralice datos, documentación y decisiones en un único lugar.
- **Para el equipo de Atención al Cliente**: Saber qué documentación está pendiente, rechazada o vencida para solicitarla al cliente con claridad y en tiempo.
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
| Operaciones inusuales registradas con evidencia adjunta | 0 | 100% de casos abiertos | Casos con evidencia en BD |

### Métricas de Negocio / Compliance

| Métrica | Baseline | Target | Cómo se mide |
|---------|----------|--------|--------------|
| Clientes aprobados por mes con trazabilidad completa en audit log | 0 | 100% | Audit log en BD |
| ROS emitidos a la UIF registrados en sistema | 0 | 100% | Tabla `suspicious_reports` |
| Tiempo de respuesta ante auditoría regulatoria (consulta de legajo) | No medido | < 2 hs | Manual |
| % de aprobaciones con observaciones (docs pendientes) | No medido | < 15% | Registros de aprobación con `pendingDocsCount > 0` |

---

## Discovery

### Casos de Uso Principales

**CU-00 — Alta de usuario y lectura de documentación**
El analista de Compliance revisa la documentación enviada por el cliente (específica según el tipo de sociedad), la aprueba o rechaza con motivo registrado, carga los datos del cliente en el sistema, asigna el nivel de riesgo y perfil transaccional, y da de alta al usuario. Si queda documentación o campos pendientes, el proceso queda en estado "Pendiente de Alta".

**CU-01 — Envío de reportes regulatorios**
El analista genera reportes regulatorios (Base Padrón, Apartado A/B/C, UIF) consolidando información del sistema. El proceso incluye validaciones automáticas, revisión manual y envío en plazo. El sistema guarda historial y comprobantes de envío.

**CU-02 — Definición de riesgo**
El analista evalúa el perfil del cliente en base a múltiples variables y asigna un nivel de riesgo (bajo, medio, alto). En función de esto determina el tipo de debida diligencia (simplificada, media o reforzada). La decisión queda registrada con justificación.

**CU-03 — Clasificación de operaciones inusuales**
El analista monitorea transacciones potencialmente inusuales, las analiza contra el perfil del cliente y toma una decisión: justificar, descartar o elevar a ROS. El sistema centraliza evidencia, comentarios y decisiones. El ROS se gestiona fuera de la herramienta (por normativa vigente).

**CU-04 — Gestión de clientes**
El analista accede al legajo completo del cliente: información, documentación, riesgo, estado de cuenta y alertas pendientes. Permite seguimiento integral, identificación de vencimientos y toma de decisiones.

**CU-05 — Gestión de alertas**
El sistema genera alertas automáticas por vencimientos de documentación, altas pendientes y observaciones. El analista las gestiona, registra acciones y puede escalarlas.

### Diagrama de Flujo — Onboarding

```
[1. Revisión de documentación]
    ↓ cliente seleccionado de bandeja de pendientes
[2. Carga de datos de la entidad]
    ↓ datos de la sociedad + personas vinculadas
[3. Riesgo y perfil transaccional]
    ↓ asignación de nivel de riesgo + due diligence
[4. Alta Final]
    ↓ resumen del legajo
    ┌──────────────────────────────────┐
    ↓                                  ↓
[Aprobar]                    [Rechazar / Solicitar Info]
[Aprobar con observaciones]
```

### Stack Técnico

| Capa | Tecnología | Estado |
|------|-----------|--------|
| Frontend | React + TypeScript + Vite + Tailwind | En desarrollo |
| Backend | Node.js + Express + Sequelize | Desarrollado |
| Base de datos (dev) | SQLite | Operativo en local |
| Base de datos (prod) | PostgreSQL | Pendiente migración |
| Lectura de DNI | API 4i (app del cliente) | Post-MVP |
| Hosting | Por definir (Vercel + Railway/Render) | Pendiente |

### Documentación relacionada
- Diagrama ER: `diagrama-er.html`
- Flujo de alta: `Flujos_Alta_Compliance.html`
- Flujo integral: `Flujo_Integral_Compliance.html`
- Campos por documento: `Campos_por_Documento_Compliance.docx`

---

## Requerimientos

---

### MÓDULO 1 — Alta de Usuario (KYC Onboarding)

---

**RF-00 / RF-01 · Como analista de Compliance**
quiero aprobar o rechazar la documentación recibida del cliente
para tener registro completo del estado de cada documento antes de avanzar con el alta

**Criterios de aceptación:**
- Cada documento tiene estado: `Pendiente de carga` / `Cargado — Pendiente revisión` / `Aprobado` / `Rechazado` / `Solicitado`
- Al aprobar un documento, el estado cambia a `Aprobado` y se registra usuario y fecha en el audit log
- El analista puede volver a rechazar un documento que ya fue aprobado (incluso cuando todos los docs están aprobados)
- Al rechazar, el campo motivo de rechazo es obligatorio (mínimo 10 caracteres)
- El legajo muestra el porcentaje de completitud documental en tiempo real

---

**RF-02 · Como analista de Compliance**
quiero que al rechazar documentación se registre obligatoriamente el motivo
para que Atención al Cliente sepa qué comunicarle al cliente al solicitar la corrección

**Criterios de aceptación:**
- El campo "Motivo de rechazo" es obligatorio al marcar un documento como `Rechazado`
- El motivo queda visible en el historial del legajo y accesible para el rol de Atención al Cliente
- No es posible guardar el rechazo sin motivo; el sistema muestra error antes de confirmar

---

**RF-03 · Como analista de Compliance**
quiero poder volver a aprobar o rechazar documentación ya rechazada
para verificar si la nueva versión entregada por el cliente es correcta

**Criterios de aceptación:**
- Un documento en estado `Rechazado` puede pasar a `Aprobado` o a `Solicitado`
- Un documento en estado `Aprobado` puede pasar a `Rechazado` (con motivo obligatorio)
- Cada cambio de estado queda registrado en el historial del documento con usuario y fecha

---

**RF-04 · Como analista de Atención al Cliente**
quiero poder leer los motivos de rechazo de documentación
para solicitar correctamente la corrección al cliente

**Criterios de aceptación:**
- El rol Atención al Cliente puede ver el detalle del legajo con el motivo de rechazo de cada documento
- Los motivos son visibles en el listado de documentos del cliente sin necesidad de abrir el modal de rechazo
- No puede modificar ni aprobar/rechazar documentos; solo lectura

---

**RF-05 · Como analista de Atención al Cliente**
quiero poder cargar la documentación que fue solicitada
para avanzar con el proceso de alta una vez que el cliente la entregó

**Criterios de aceptación:**
- El rol Atención al Cliente puede subir archivos (PDF, JPG, PNG, máx. 10 MB) en los documentos en estado `Rechazado` o `Solicitado`
- Al cargar el archivo, el estado del documento pasa a `Cargado — Pendiente revisión`
- Se registra en el audit log: quién cargó el archivo y cuándo

---

**RF-06 · Como analista de Compliance**
quiero tener acceso a la documentación completa del cliente
para avanzar con la carga de datos en el proceso de alta

**Criterios de aceptación:**
- El sistema muestra el checklist de documentos requeridos según el tipo de entidad (SA, SRL, SH, Sucesión, Monotributista)
- Cada documento puede visualizarse inline (PDF viewer sin necesidad de descargar)
- El estado de cada documento es visible en el listado antes de abrirlo

---

**RF-07 · Como analista de Compliance**
quiero poder continuar con la carga de datos aunque no tenga toda la documentación
para no bloquear el proceso cuando el cliente aún no entregó ciertos documentos

**Criterios de aceptación:**
- El sistema **no bloquea** el avance al paso "Datos Entidad" por documentos faltantes
- Si hay documentos requeridos sin aprobar al momento de finalizar el alta, el botón cambia a **"Aprobar con observaciones (N)"** (color ámbar, N = cantidad de docs pendientes)
- El audit log registra explícitamente cuántos y cuáles documentos estaban pendientes al momento de la aprobación
- El sistema muestra una advertencia informativa (no bloqueante) al avanzar con docs incompletos

---

**RF-07b · Como analista de Compliance**
quiero poder solicitar información adicional al cliente sin rechazarlo
para darle la oportunidad de completar su legajo antes de tomar una decisión definitiva

**Criterios de aceptación:**
- El analista puede registrar una solicitud de información mediante el botón "Solicitar Info" en la pantalla de revisión
- El sistema actualiza el estado del cliente a `info_solicitada` y registra el motivo ingresado (obligatorio, mínimo 20 caracteres)
- La solicitud queda visible en el historial del legajo con fecha y usuario
- El cliente puede volver a estado `En Revisión` cuando el analista retoma el proceso

---

**RF-08 · Como analista de Compliance**
quiero poder guardar el progreso del alta mediante un botón de guardado
para no perder la información cargada y retomar el proceso en otro momento

**Criterios de aceptación:**
- El sistema expone un botón "Guardar borrador" visible en cada paso del flujo de alta
- Al guardar, los datos del formulario y los estados de revisión de documentos se persisten
- Al retomar el proceso, el sistema restaura el último estado guardado
- Al navegar entre pasos sin guardar, el sistema advierte si hay cambios no guardados antes de salir

---

**RF-08b · Como analista de Compliance**
quiero poder navegar libremente entre los pasos del flujo de alta
para revisar o corregir información de pasos anteriores sin perder lo cargado

**Criterios de aceptación:**
- El paso "Datos Entidad" (paso 2) muestra un botón "Volver a Revisión de Docs." visible en la parte superior del contenido
- Al volver al paso 1, los estados de revisión de documentos se conservan íntegros
- Cuando todos los documentos están aprobados (`readyForAlta`), la fila del cliente muestra el botón "Continuar" pero también un toggle para expandir y revisar documentos individuales
- Los documentos aprobados pueden re-rechazarse incluso en estado `readyForAlta`

---

### MÓDULO 2 — Personas Vinculadas

---

**RF-PV-01 · Como analista de Compliance**
quiero registrar todas las personas vinculadas a una entidad (socios, directores, apoderados, herederos, beneficiarios finales)
para cumplir con los requerimientos de la UIF sobre identificación de beneficiarios últimos

**Criterios de aceptación:**
- Para cada persona se pueden registrar: apellido, nombre, CUIT/CUIL, número de documento, tipo de documento, fecha de nacimiento, domicilio, email, teléfono, actividad laboral, condición PEP, REPET, porcentaje de participación, cargo, facultades, vigencia del poder
- Los roles disponibles varían según el tipo de entidad:

| Rol | SA | SRL | SH | Sucesión | Monotributista |
|-----|----|-----|----|----------|---------------|
| Beneficiario Final | ✓ | ✓ | ✓ | ✓ | ✓ |
| Accionista | ✓ | — | — | — | — |
| Socio | — | ✓ | ✓ | — | — |
| Presidente | ✓ | — | — | — | — |
| Director | ✓ | — | — | — | — |
| Gerente | ✓ | ✓ | — | — | — |
| Apoderado | ✓ | ✓ | ✓ | ✓ | — |
| Heredero | — | — | — | ✓ | — |
| Administrador | — | — | — | ✓ | — |

- Si se marca como PEP, el sistema solicita la declaración PEP antes de poder aprobar el alta
- La suma de porcentajes de participación de beneficiarios finales no puede superar 100%; el sistema valida en tiempo real

---

**RF-PV-02 · Como analista de Compliance**
quiero que los datos de identidad de cada persona se pre-carguen automáticamente desde la lectura de DNI realizada por la app del cliente (integración 4i)
para no tener que tipear manualmente datos que el cliente ya proporcionó

**Criterios de aceptación:**
- Cuando el objeto del cliente incluye datos de `4iDocumentDataExtraction`, el sistema mapea automáticamente:
  - `front.LastName` → apellido
  - `front.FirstName` → nombre
  - `front.DocumentNumber` (sin puntos) → número de documento
  - `front.Sex` → sexo
  - `front.Nationality` → nacionalidad
  - `front.DateOfBirth` → fecha de nacimiento *(si el valor es `01/01/0001`, el campo queda vacío y se marca como pendiente)*
  - `front.DocumentOptionalAdditionalNumber` → número de ejemplar del DNI
  - `front.DocumentAdditionalNumber` → número de trámite
  - `back.Address` (saltos de línea → espacio) → domicilio
  - `front.DateOfIssue` → fecha de emisión del DNI
  - `front.DateOfExpiry` → fecha de vencimiento del DNI
- Los campos pre-cargados están marcados visualmente como "dato del cliente" pero son editables
- Campos que siempre requieren ingreso manual: CUIT, email, teléfono, roles, porcentaje de participación, cargo
- Si 4i no provee datos, el formulario funciona normalmente en modo manual sin ningún impacto

---

### MÓDULO 3 — Evaluación de Riesgo

---

**RF-09 / RF-14 · Como analista de Compliance**
quiero que el sistema calcule automáticamente el nivel de riesgo del cliente según la matriz definida
para cumplir con la normativa del manual de riesgo y determinar el tipo de debida diligencia a aplicar

**Criterios de aceptación:**
- El cálculo es automático al guardar el legajo y se recalcula ante cualquier cambio en los factores relevantes
- **Regla PEP:** si el cliente o cualquier persona vinculada es PEP → riesgo **Alto** de forma directa, sin calcular el score
- El resultado se clasifica en: `Bajo` (1.00–2.00) / `Medio` (2.01–3.00) / `Alto` (3.01–5.00)
- En función del riesgo se sugiere el tipo de debida diligencia: Simplificada (Bajo) / Media (Medio) / Reforzada (Alto)
- El analista puede sobrescribir el nivel calculado con justificación obligatoria; queda registrado en el audit log
- Solo Nivel 1 puede configurar los pesos y umbrales de la matriz

**Matriz de riesgo — Persona Humana (Monotributista / Resp. Inscripto):**

| Factor | Valores | Ponderación |
|--------|---------|-------------|
| PEP | Sí → Riesgo Alto directo | N/A |
| Residencia | 1 (Bajo) · 3 (Medio) · 5 (Alto) — basado en IP | 10% |
| Nacionalidad | 1 (Bajo) · 3 (Medio) · 5 (Alto) | 10% |
| Actividad | 1 (Bajo — actividad ganadera) · 5 (Alto — no relacionada) | 30% |
| Antigüedad PSP | >24 meses=1 · 12–24 meses=3 · <12 meses=5 | 20% |
| Materialidad | 1 (Bajo) · 3 (Medio) · 5 (Alto) — basado en ventas netas anuales | 30% |

**Matriz de riesgo — Persona Jurídica:**

| Factor | Valores | Ponderación |
|--------|---------|-------------|
| PEP | Si alguna persona vinculada es PEP → Riesgo Alto directo | N/A |
| Residencia | 1 (Bajo) · 3 (Medio) · 5 (Alto) — promedio de todas las personas vinculadas | 20% |
| Actividad | 1 (Bajo — actividad ganadera) · 5 (Alto — no relacionada) | 30% |
| Antigüedad PSP | >24 meses=1 · 12–24 meses=3 · <12 meses=5 | 20% |
| Materialidad | 1 (Bajo) · 3 (Medio) · 5 (Alto) — basado en ventas netas anuales | 30% |

> **Notas:**
> - **Residencia:** se determina por IP. En personas jurídicas, se promedia el score de residencia de todas las personas vinculadas.
> - **Actividad:** la ponderación puede ajustarse si la actividad ganadera deja de ser el core del negocio.
> - **Antigüedad:** se cuenta desde la fecha de alta en el PSP. A mayor antigüedad, menor riesgo.
> - **Materialidad:** se basa en las ventas netas anuales cargadas por el analista de Compliance dentro de la herramienta (dato obtenido del último balance o declarado por el cliente). Campo obligatorio para todos los clientes independientemente del nivel de riesgo.
> - ⚠️ *Pendiente:* confirmar si materialidad aplica desde el inicio del alta o solo cuando se dispone del balance.

---

**RF-15 · Como analista de Compliance**
quiero asignar el tipo de debida diligencia según el nivel de riesgo
para cumplir con lo requerido en el Manual de LA/FT/FP

**Criterios de aceptación:**
- El sistema sugiere automáticamente: Simplificada para riesgo Bajo, Media para riesgo Medio, Reforzada para riesgo Alto
- El analista puede modificar el tipo de DD con justificación registrada
- El tipo de DD queda visible en el legajo del cliente y en el listado general

---

**RF-16 · Como analista de Compliance**
quiero poder cargar el NSE (nivel socioeconómico) y las ventas netas anuales del cliente
para completar el perfil transaccional y alimentar el cálculo de riesgo (materialidad)

**Criterios de aceptación:**
- **NSE:** aplica únicamente a personas jurídicas. Opciones: ABC1 / C2 / C3 / D1 / D2E
- **Ventas netas anuales:** campo numérico obligatorio para todos los tipos de cliente (PH y PJ). Se carga en el **paso de Riesgo** por el analista de Compliance, obtenido del último balance o declaración del cliente
- Ambos campos son visibles en el legajo y se utilizan como input del cálculo de riesgo (factor Materialidad)
- Si ventas netas anuales no está cargado, el sistema muestra advertencia al intentar calcular el riesgo

---

### MÓDULO 4 — Operaciones Inusuales

---

**RF-17 · Como analista de Compliance**
quiero visualizar todas las operaciones inusuales detectadas
para tomar las medidas necesarias en tiempo y forma

**Criterios de aceptación:**
- Las OI son generadas automáticamente por el sistema de pagos y llegan al sistema de Compliance vía integración (no se crean manualmente)
- Al ingresar una OI, la cuenta del cliente se **bloquea automáticamente** de forma preventiva
- El listado muestra: cliente, tipo de operación, monto, fecha, estado, analista asignado
- Filtros disponibles: estado, tipo, rango de fechas, analista
- Las OI en estado `Por Analizar` se destacan visualmente como urgentes
- Cuando una OI pasa a estado `Justificada`, la cuenta del cliente se **reactiva automáticamente**
- Cuando una OI pasa a estado `Operación Sospechosa`, la cuenta permanece bloqueada
- El analista de Compliance puede desbloquear/bloquear la cuenta manualmente desde la gestión del cliente en cualquier momento, con motivo obligatorio
- **Asignación:** cualquier analista puede tomar y resolver una OI (no hay asignación fija)
- **Notificación:** al ingresar una OI nueva, el sistema envía un email automático a los usuarios de Nivel 2 avisando que hay una OI pendiente de resolución
- **SLA:** las OI deben resolverse dentro de las **48 horas** desde su ingreso. El sistema genera una alerta visual si una OI supera las 48 hs sin resolución
- **Visibilidad en legajo:** si un cliente tiene OI activas, se muestra un indicador visible en su ficha dentro de la vista de Gestión de Clientes

---

**RF-18 · Como analista de Compliance y como analista de Atención al Cliente**
quiero poder dejar comentarios en una OI
para comunicar internamente qué documentación solicitar, qué se recibió y qué decisiones se tomaron

**Criterios de aceptación:**
- Ambos roles (Compliance y Atención al Cliente) pueden escribir comentarios en cualquier OI
- El campo de texto libre está disponible en la sección de cada OI
- Cada comentario queda registrado con: usuario, rol, fecha y hora
- Los comentarios de Compliance y de Atención al Cliente se diferencian visualmente
- Los comentarios no pueden editarse ni eliminarse una vez guardados

---

**RF-19 · Como analista de Compliance**
quiero dejar registro del análisis realizado y la decisión tomada respecto a una OI
para que quede constancia del razonamiento detrás de la resolución

**Criterios de aceptación:**
- **Motivo** y **descripción** son campos obligatorios al crear o cambiar el estado de una OI
- La carga de documentación de respaldo (PDF, imagen) es **opcional**
- El historial de análisis no es editable una vez guardado
- El historial es visible en el detalle de la OI con fecha y usuario

---

**RF-20 · Como analista de Compliance**
quiero visualizar la información completa del cliente asociado a una OI (riesgo, perfil transaccional, historial de operaciones, estado del legajo)
para ser más asertivo al solicitar documentación de respaldo

**Criterios de aceptación:**
- Desde el detalle de una OI, el analista puede acceder al legajo completo del cliente con un click
- Se muestran: nivel de riesgo, tipo de sociedad, perfil transaccional, operaciones anteriores, estado de documentación y alertas activas

---

**RF-24 · Como analista de Compliance**
quiero modificar el estado de una OI una vez finalizado el análisis
para cumplir con los requisitos del manual y de la UIF

**Criterios de aceptación:**
- Estados posibles: `Por Analizar` → `Justificada` / `Operación Sospechosa`
- Cada cambio de estado requiere comentario obligatorio
- Si el estado final es `Operación Sospechosa`, se registra que el ROS será gestionado y enviado por fuera de la herramienta (conforme normativa vigente)
- Un caso cerrado no puede reabrirse; si es necesario, el Nivel 1 debe crear un nuevo caso con referencia al anterior

---

**RF-21 / RF-22 / RF-23 · Como analista de Atención al Cliente**
quiero visualizar los comentarios de Compliance, cargar documentación solicitada y dejar respuestas
para colaborar en el proceso de análisis de OI y mejorar los tiempos de respuesta

**Criterios de aceptación:**
- El rol Atención al Cliente puede: ver comentarios de Compliance, cargar archivos de respaldo, dejar comentarios propios
- No puede modificar estados de la OI ni el análisis de Compliance
- Comentarios de AC quedan diferenciados visualmente de los de Compliance

---

### MÓDULO 5 — Reportes Regulatorios

---

**RF-11 · Como analista de Compliance**
quiero generar y enviar los reportes regulatorios exigidos por BCRA, UIF y ARCA
para cumplir con las obligaciones de reporte dentro de los plazos establecidos

**Criterios de aceptación:**
- El sistema consolida automáticamente la información del período seleccionado
- El sistema valida automáticamente formato, completitud y consistencia de los datos antes de habilitar el envío o descarga
- Cada generación queda registrada en el historial con: fecha, usuario, período y versión

**Reportes contemplados:**

| Reporte | Organismo | Mecanismo de envío | Periodicidad | Quién puede generar |
|---------|-----------|-------------------|--------------|---------------------|
| Base Padrón | BCRA | Exportación `.TXT` — envío manual | Mensual | Nivel 1 y Nivel 2 |
| Apartado A | BCRA | Exportación `.TXT` — envío manual vía MFT | Mensual | Nivel 1 y Nivel 2 |
| Apartado B | BCRA | Exportación `.TXT` — envío manual vía MFT | Mensual | Nivel 1 y Nivel 2 |
| F.8126 | ARCA (UIF) | Envío automático vía Web Service (WS) | Mensual | Nivel 1 y Nivel 2 |

> **Apartado C (INFESPECIAL.PDF):** requerimiento trimestral (enero, abril, julio, octubre). Se confecciona y envía **fuera de la herramienta** — proceso manual. No está contemplado en el sistema.

- Para los reportes `.TXT`: el archivo descargado respeta exactamente el formato de columnas y delimitadores requerido por el organismo
- Para el F.8126 ARCA: el sistema realiza el envío vía WS y registra la respuesta del organismo (éxito / error) en el historial
- En caso de error en el WS, el sistema muestra el detalle del error y permite reintentar el envío
- El analista puede adjuntar el comprobante de envío para los reportes manuales, dejando registro completo

---

#### Especificación técnica — Base Padrón (Régimen 71 · Sección 44 · Com. "A" 8209)

**Archivo:** `PADRON.TXT` · **Separador:** `;` · **Longitud variable**
**Estructura del zip:** `PADRON.TXT` + `detalle.xml` (régimen `71`, requerimiento `1`)
**Contenido:** primera presentación = base completa de clientes activos; presentaciones siguientes = solo novedades del mes (altas, bajas, cambios de PEP y CP)
**Si no hay novedades:** `OPERA=FALSE` en el `detalle.xml`

**Diseño de registro:**

| N° | Campo | Tipo | Long. | Valores / Reglas |
|----|-------|------|-------|-----------------|
| 1 | Tipo identificación tributaria | Num | 2 | `11` CUIT/CUIL/CDI · `55` FCI · `66` Fideicomiso · `97` sin CUIT · `98` PJ exterior · `99` PH exterior |
| 2 | Número identificación tributaria | Car | 11 | CUIT sin guiones. Si tipo=97 → valor nulo `;;` |
| 3 | Tipo identificación personal | Num | 2 | `01` DNI · `02` LE · `03` LC · `04` Pasaporte · `05` Cédula Mercosur · `06` Cédula Identidad · `07` Otro · `00` PJ (nulo) · `97` nulo PH |
| 4 | Número identificación personal | Car | 16 | DNI/LE/LC/Cédula: completar con `0` a la derecha y ceros a la izquierda hasta 16 posiciones. PJ → valor nulo `;;` |
| 5 | Denominación | Car | 80 | Mayúsculas, sin acento, sin puntos ni comas. Alineado a la izquierda, completar con blancos |
| 6 | Condición PEP | Num | 1 | `0` N/A · `1` Sí · `2` No. PSP puede informar siempre `0` |
| 7 | Código postal | Car | 8 | Nuevo CPA (Res. 1368/98). Domicilio en exterior: 2 letras SWIFT del país + ceros |
| 8 | Tipo de movimiento | Num | 2 | `10` Alta · `20` Baja · `30` Modificación. Primera presentación → siempre `10` |

> Alta (`10`): todos los campos obligatorios. Baja (`20`): solo campos 1–4. Modificación (`30`): todos los campos.

**Errores de validación (BCRA):**

| Código | Descripción |
|--------|-------------|
| 01 | Archivo PADRON.TXT no encontrado, vacío o mal formado |
| 02 | Longitud de registro errónea / campo fuera de diseño |
| 03 | Código de entidad (sujeto) incorrecto |
| 04 | Fecha inexistente, con blancos o período no habilitado |
| 05 | Tipo de identificación tributaria no válido |
| 06 | CUIT/CUIL/CDI con prefijo no reconocido o dígitos repetidos |
| 07 | Dígito verificador del CUIT/CUIL/CDI incorrecto |
| 08 | Tipo de identificación personal no válido o inconsistente con el tipo tributario |
| 09 | Número de identificación personal contiene caracteres no numéricos (tipos 01/02/03) |
| 10 | Tipo tributario 97 o 99 sin número de identificación personal informado |
| 11 | Inconsistencia entre tipo y número de identificación tributaria |
| 12 | Misma identificación tributaria con dos identificaciones personales distintas (o viceversa) |
| 13 | Campo Denominación vacío |
| 14 | Novedad duplicada (mismo tipo+número tributario y personal) |
| 15 | Información del período ya presentada y aceptada |
| 16 | Rectificativa de período no validado |
| 17 | Código en campo PEP o Tipo de movimiento no habilitado |
| 18 | PEP mal informado: PJ con PEP distinto de 0, o PH con PEP distinto de 1/2 |
| 19 | Alta o modificación sin campo PEP y/o CP informado |
| 20 | Código postal no válido según CPA o SWIFT |
| 21 | Alta con identificación ya existente, o baja/modificación sin identificación |

---

#### Especificación técnica — Apartado A (Régimen 100 · Req. 1 · Sección 69.1 · Com. "A" 8382)

**Archivos:** `CUENTASCLIENTES.TXT` + `DATOSFONDOS.TXT` (solo si operan con FCI) · **Separador:** `;`
**Estructura del zip:** ambos TXT + `detalle.xml` (régimen `100`, requerimiento `1`) + `INFESTADISTICA.TXT` (req. `3`)
**Si no hay novedades:** `OPERA=FALSE` en el `detalle.xml`

**Diseño de registro — `CUENTASCLIENTES.TXT`:**

| N° | Campo | Tipo | Long. | Reglas |
|----|-------|------|-------|--------|
| 1 | Código de partida | Num | 7 | Partidas según modelo II.2 de las NP. Formato: `XXXXXdd` (dd = día del mes) |
| 2 | Saldo | Num | 11 | Admite nulo `;;` · No admite signo negativo |
| 3 | Cantidad | Num | 11 | Admite nulo `;;` · No admite signo negativo |
| 4 | CBU / Nro. Fondo de Dinero | Num | 22 | Partida 20000dd: CBU válida. Partida 40000dd: código FCI válido. Resto: nulo |

> Se graba un registro por día del mes (hábiles e inhábiles). Si no se operan FCI: solo se graban las partidas `30000dd` y `40000dd` del último día del mes con todos los campos nulos, sin incluir `DATOSFONDOS.TXT`.

**Diseño de registro — `DATOSFONDOS.TXT`** *(solo si opera con FCI):*

| N° | Campo | Tipo | Long. |
|----|-------|------|-------|
| 1 | Nro. Fondo de Dinero | Num | 5 |
| 2 | Denominación/razón social del Fondo | Car | 50 |
| 3 | Agente involucrado | Num | 1 | `1` Soc. Gerente · `2` Soc. Depositaria · `3` Agente colocación |
| 4 | Denominación/razón social del Agente | Car | 50 |
| 5 | CUIT del agente | Num | 11 |

**Errores de validación (BCRA):**

| Código | Descripción |
|--------|-------------|
| 01 | Archivo TXT/PDF no encontrado, vacío o mal formado; o inconsistencia OPERA entre req. 1 y req. 3 |
| 02 | Código de sujeto no habilitado para este régimen |
| 03 | Fecha inexistente o período anterior no validado |
| 04 | Error de formato: código de partida inválido, campo con signo negativo o valor no numérico |
| 05 | CUIT inválido en `DATOSFONDOS.TXT` |
| 06 | Campos obligatorios sin informar |
| 07 | Partida `XXXXXdd` faltante para uno o más días del período |
| 08 | Inconsistencia entre `DATOSFONDOS.TXT` y `CUENTASCLIENTES.TXT`: fondo informado en uno y no en el otro |
| 09 | Falta informar tipo de agente para un número de fondo |
| 10 | Novedad duplicada (misma combinación de partida + CBU/fondo) |
| 11 | Período ya presentado y aceptado |
| 12 | Rectificativa de período no validado |
| 13 | Cantidad en partida 10000 mayor a partida 50000, o 60000 mayor a 50000 |
| 14 | Día `dd` en partida no corresponde a día existente del período |
| 15 | CBU inválida en partida 20000dd; o código FCI inválido en partida 40000dd |
| 16 | Inconsistencia Saldo/Cantidad en partidas 10000dd y 30000dd (uno en 0 y el otro no) |
| 17 | Partida 50000dd con Cantidad = 0 en día no exceptuado |
| 18 | Partidas 30000dd/40000dd del último día no respetan instrucción de valor nulo |

---

#### Especificación técnica — Apartado B (Régimen 100 · Req. 3 · Sección 69.2 · Com. "A" 8285)

**Archivo:** `INFESTADISTICA.TXT` · **Separador:** `;` · Va en el mismo zip que Apartado A
**Si no hay novedades:** `OPERA=FALSE` debe ser consistente con Apartado A (ambos TRUE o ambos FALSE)

**Diseño de registro:**

| N° | Campo | Tipo | Long. | Reglas |
|----|-------|------|-------|--------|
| 1 | Código de partida | Num | 7 | Según modelo III.2 del apartado B de las NP |
| 2 | Medio de pago | Num | 3 | Tabla 1 del punto III.3. Solo se graban partidas con Cantidad > 0 |
| 3 | Esquema de pago | Num | 5 | Tabla 2 del punto III.3. Combinaciones válidas según medio de pago |
| 4 | Cantidad | Num | 11 | No admite cero |
| 5 | Monto total | Num | 11 | Si monto < 1 (en miles) → informar `0` |

**Errores de validación (BCRA):**

| Código | Descripción |
|--------|-------------|
| 01 | Archivo no encontrado, vacío, o inconsistencia OPERA entre req. 1 y req. 3 |
| 02 | Código de sujeto no habilitado |
| 03 | Fecha inexistente o período anterior no validado |
| 04 | Error de formato: código de partida, medio/esquema de pago o cantidad inválidos |
| 05 | Campos obligatorios sin informar |
| 06 | Combinación medio de pago / esquema de pago no admitida |
| 07 | Novedad duplicada (misma combinación de campos 1 a 3) |
| 08 | Período ya presentado y aceptado |
| 09 | Rectificativa de período no validado |
| 10 | Inconsistencia entre partidas de transferencias (500X000 vs. suma de 10XXXXX/20XXXXX) |
| 11 | Suma de clientes en transferencias mayor a clientes en transacciones |
| 12 | Suma de cuentas en transferencias mayor a cuentas en transacciones |
| 13 | Faltan partidas de clientes/cuentas (603X0XX o 604X0XX) |
| 14 | Medio de pago 5 informado en partidas incorrectas (o viceversa) |
| 15 | Falta informar partida total de clientes/cuentas de pago |
| 16 | Inconsistencia entre total de cuentas del Apartado B y partida 50000dd del Apartado A |

> ⚠️ **Alerta de consistencia entre A y B:** el BCRA valida que para el último día del mes, la suma de partidas `60410XX` + `60420XX` (Apartado B) coincida con la partida `50000dd` (Apartado A). Si se presenta una rectificativa que impacta estas partidas, deben re-presentarse también los períodos posteriores.

---

**RF-12 · Como analista de Compliance**
quiero recibir alertas de vencimiento de reportes regulatorios
para presentarlos en tiempo y forma ante el organismo correspondiente

**Criterios de aceptación:**
- El sistema genera alertas automáticas X días antes del vencimiento de cada reporte (configurable por el Nivel 1)
- Las alertas son visibles en el dashboard y pueden enviarse por email al analista responsable
- El sistema distingue entre "próximo a vencer" (alerta amarilla) y "vencido" (alerta roja)

---

**RF-13 · Como analista de Compliance**
quiero descargar los reportes en formato .TXT
para cumplir con la formalidad de entrega exigida por los entes reguladores

**Criterios de aceptación:**
- El botón "Descargar .TXT" está disponible en el detalle de cada reporte generado
- El archivo descargado respeta exactamente el formato de columnas y delimitadores requerido por BCRA/UIF
- El sistema permite adjuntar el comprobante de envío una vez presentado el reporte, para dejar registro completo

---

### MÓDULO 9 — Gestión de Usuarios Internos

---

**RF-GU-01 · Como Oficial de Cumplimiento (Nivel 1)**
quiero poder crear, editar y desactivar los usuarios internos de la herramienta
para controlar quién tiene acceso al sistema y con qué nivel de permisos

**Criterios de aceptación:**
- Solo Nivel 1 puede acceder al módulo de gestión de usuarios internos
- Al crear un usuario se ingresan: nombre, apellido, email, contraseña inicial y rol (Nivel 1 / Nivel 2 / Nivel 3)
- El email debe ser único en el sistema; si ya existe, el sistema muestra error antes de guardar
- La contraseña inicial debe cumplir la política de seguridad (mínimo 8 caracteres, una mayúscula, un número)
- El usuario creado recibe un email automático con sus credenciales de acceso
- El Nivel 1 puede editar nombre, apellido, email y rol de cualquier usuario
- El Nivel 1 puede desactivar un usuario sin eliminarlo — el usuario desactivado no puede iniciar sesión pero su historial de acciones queda intacto en el audit log
- Un usuario desactivado puede reactivarse en cualquier momento por el Nivel 1
- El listado de usuarios muestra: nombre, apellido, email, rol, estado (activo/inactivo), fecha de creación y último acceso
- Todas las altas, ediciones y desactivaciones quedan registradas en el audit log con usuario responsable y fecha

---

### MÓDULO 6 — Gestión de Clientes

---

**RF-25 · Como analista de Compliance o Atención al Cliente**
quiero consultar el estado de cada cliente
para saber si puede o no operar con el PSP

**Criterios de aceptación:**
- El listado muestra: nombre/razón social, CUIT, tipo, estado, nivel de riesgo, fecha de alta, responsable asignado
- Estados visibles: `Pendiente` / `En Revisión` / `Pendiente de Documentación` / `Info Solicitada` / `Aprobado` / `Rechazado`
- El listado puede filtrarse por estado, tipo de cliente, nivel de riesgo, responsable y rango de fechas
- Si el cliente tiene OI activas, se muestra un indicador visual en su fila del listado

---

**RF-26 · Como analista de Compliance (Nivel 1 o Nivel 2)**
quiero poder editar cualquier información del cliente
para mantener el legajo actualizado

**Criterios de aceptación:**
- Nivel 1 y Nivel 2 pueden editar los datos del cliente desde el detalle del legajo
- Cada edición queda registrada en el audit log con: valor anterior, valor nuevo, usuario y fecha
- Los documentos aprobados pueden ser re-rechazados con motivo; el audit log registra la acción
- Atención al Cliente puede ver el legajo completo pero no puede editar ningún dato

---

**RF-37 · Como analista de Compliance (Nivel 1 o Nivel 2)**
quiero poder bloquear o desbloquear la cuenta de un cliente
para proteger las operaciones ante situaciones de riesgo o irregularidades detectadas

**Criterios de aceptación:**
- Nivel 1 y Nivel 2 pueden bloquear o desbloquear manualmente una cuenta desde el detalle del cliente
- El bloqueo y desbloqueo requieren motivo obligatorio
- El sistema registra en el audit log: quién bloqueó/desbloqueó, cuándo y por qué
- Un cliente bloqueado aparece con badge visual diferenciado en el listado y en el dashboard
- El desbloqueo automático ocurre cuando una OI pasa a estado `Justificada`

---

**RF-40 · Como analista de Compliance**
quiero ver separados los clientes dados de alta de los que están en estado pendiente
para gestionar eficientemente la cola de revisión

**Criterios de aceptación:**
- La vista principal tiene dos secciones claramente diferenciadas: "Clientes Activos" y "Pendientes de Alta"
- Los pendientes se ordenan por fecha de ingreso (más antiguos primero)
- El listado puede exportarse a CSV

---


---

**RF-35 · Como analista de Compliance**
quiero registrar observaciones sobre un cliente
para dejar constancia de cambios, incidencias o información relevante

**Criterios de aceptación:**
- El campo de observaciones está disponible en el detalle de cada cliente, en cada paso del alta y en el resumen final
- Las observaciones quedan registradas con usuario, fecha y hora
- No pueden editarse ni eliminarse una vez guardadas

---

### MÓDULO 7 — Alertas *(Post-MVP)*

> El módulo de alertas completo queda fuera del alcance del MVP. Ver sección Post-MVP para el detalle.

---

### MÓDULO 8 — Autenticación y Roles

---

**Como usuario del sistema**
quiero autenticarme con usuario y contraseña
para acceder solo a las funciones permitidas para mi rol

**Criterios de aceptación:**
- El sistema soporta 3 niveles de acceso:

| Nivel | Nombre | Permisos clave |
|-------|--------|----------------|
| Nivel 1 | Oficial de Cumplimiento | Ver todo + Editar + Aprobar altas + Bloquear/desbloquear cuentas + Gestión usuarios internos + Audit Log |
| Nivel 2 | Analista / Atención al Cliente | Ver todo + Editar clientes + Cargar docs + Bloquear/desbloquear cuentas |
| Nivel 3 | Solo lectura | Ver todo — sin acciones |

- Las contraseñas requieren mínimo 8 caracteres, una mayúscula y un número
- Las sesiones expiran tras 30 minutos de inactividad
- Más de 5 intentos de login fallidos bloquean la cuenta temporalmente
- Todos los accesos quedan registrados en el audit log
- El usuario puede solicitar el reseteo de su contraseña por email desde la pantalla de login — recibe un link de reseteo con expiración de 1 hora
- Si el reset por email no está disponible en MVP, el Nivel 1 puede asignar una nueva contraseña desde el ABM de usuarios internos (Módulo 9)

---

## Fuera de Alcance (Out of Scope)

- **Lectura automática de DNI (OCR / 4i) desde el sistema de Compliance** — La lectura la realiza la app del cliente; el sistema de Compliance recibe el resultado ya procesado. La integración directa de 4i queda para Post-MVP.
- **Envío del ROS directamente desde el sistema** — Por normativa vigente, el ROS se gestiona y envía por fuera de la herramienta. El sistema registra el caso y documenta la decisión.
- **Integración en tiempo real con API de AFIP** — Validación de CUIT es de formato en V1. La consulta en tiempo real a AFIP se evaluará en V2.
- **Portal de autogestión para clientes** — El onboarding V1 es 100% operado por el equipo interno. El portal de cliente se evaluará en V2.
- **Integración automática con el core transaccional de dCP** — El monitoreo de OI en V1 requiere carga manual por el analista. La ingesta automática desde el sistema de pagos se planificará en V2.
- **Aplicación mobile** — Sistema exclusivamente web desktop en V1.

---

## Riesgos

### Regulatorios

- **Los requerimientos de la UIF o el BCRA pueden actualizarse durante el desarrollo**
  Mitigación: Mantener contacto activo con el área Legal. El checklist de documentos y los campos de reportes deben ser configurables sin necesidad de un deploy.

- **Los documentos requeridos difieren entre tipos de clientes y pueden tener interpretaciones ambiguas**
  Mitigación: Validar el checklist con el equipo Legal antes del desarrollo del módulo de documentos. Usar una versión provisional para no bloquear el desarrollo.

### Técnicos

- **La migración de SQLite a PostgreSQL puede revelar inconsistencias en modelos o migraciones**
  Mitigación: Ejecutar la migración en un entorno de staging antes de producción.

- **El frontend puede tener lógica acoplada al modo demo que introduzca inconsistencias al conectar con el backend real**
  Mitigación: Definir contrato de API claro antes de la integración. Priorizar las pantallas más críticas (alta de clientes, revisión de legajo) para la primera integración.

### De Integración con App del Cliente

- **El objeto del cliente enviado por la app puede no incluir `4iDocumentDataExtraction` o tener campos nulos/inválidos**
  Mitigación: Todos los campos de 4i son opcionales. El sistema nunca bloquea el flujo si 4i no entrega datos. Validar el campo `DateOfBirth` — 4i devuelve `01/01/0001` como valor inválido.

- **El schema de la app del cliente puede no estar alineado con el schema del sistema de Compliance**
  Mitigación: Definir un contrato de API documentado antes de conectar ambos sistemas. Validar con un cliente de prueba end-to-end.

### De Decisión (Compliance)

- **Permitir "Aprobar con observaciones" puede usarse para aprobar clientes con documentación incompleta de forma sistemática**
  Mitigación: El audit log registra cuántos y cuáles documentos estaban pendientes al momento de la aprobación. Los reportes internos deben incluir el porcentaje de aprobaciones con observaciones. La métrica target es < 15%.

### De Adopción

- **El equipo puede resistir el cambio si el sistema es más lento que el proceso manual**
  Mitigación: Involucrar al equipo de Compliance en revisiones de UX. Priorizar velocidad y claridad en los flujos más frecuentes.

### De Timeline

- **La definición del hosting y dominio en producción puede requerir aprobaciones internas**
  Mitigación: Iniciar el proceso de aprobación e infraestructura en paralelo con el desarrollo.

---

## Dependencias

| Dependencia | Estado | Impacto si no está lista |
|-------------|--------|--------------------------|
| Definición final del checklist documental (con Legal) | Pendiente | Bloquea desarrollo del módulo de documentos |
| Cuenta en Supabase / Neon (PostgreSQL en la nube) | Pendiente | Bloquea despliegue a producción |
| Hosting backend (Railway / Render) | Pendiente | Bloquea despliegue a producción |
| Hosting frontend (Vercel / Netlify) | Pendiente | Bloquea despliegue a producción |
| Definición de roles y permisos | Resuelto — 3 niveles definidos | — |
| Listas de sanciones para screening (OFAC, ONU, BCRA) | Pendiente | Bloquea módulo de screening |
| Contrato de API con app del cliente (schema + formato `4iDocumentDataExtraction`) | Pendiente | Bloquea prefill de personas desde 4i |
| Definición de campos mínimos enviados por persona vinculada desde la app | Pendiente | Bloquea mapeo de datos de personas al onboarding |

---

## Tracking / Eventos

> Sistema interno de backoffice. Los eventos miden el uso del equipo de Compliance y la eficiencia de los flujos.

| Evento | Dónde | Event Action | Event Name |
|--------|-------|--------------|------------|
| Inicio de alta de cliente | Bandeja de pendientes | IniciarAlta | Iniciar alta de cliente |
| Documento aprobado | Revisión Docs. | DocumentoAprobado | Aprobar documento |
| Documento rechazado | Revisión Docs. | DocumentoRechazado | Rechazar documento |
| Documento re-rechazado (estaba aprobado) | Revisión Docs. | DocumentoReRechazado | Re-rechazar doc aprobado |
| Volver a Revisión de Docs. desde Datos Entidad | Onboarding paso 2 | VolverARevisionDocs | Volver al paso anterior |
| Datos de persona pre-cargados desde 4i | Formulario personas | DatosPersonaPrecargados4i | Prefill desde 4i (automático) |
| Datos de persona editados manualmente sobre 4i | Formulario personas | DatosPersonaEditadosManualmente | Editar datos prefillados de 4i |
| Cliente aprobado | Revisión legajo | ClienteAprobado | Aprobar cliente |
| Cliente aprobado con observaciones | Revisión legajo | ClienteAprobadoConObs | Aprobar con docs pendientes |
| Solicitud de info enviada | Revisión legajo | InfoSolicitada | Solicitar info al cliente |
| Cliente rechazado | Revisión legajo | ClienteRechazado | Rechazar cliente |
| Riesgo calculado automáticamente | Alta — paso Riesgo | RiesgoCalculado | Cálculo automático de riesgo |
| Riesgo sobrescrito manualmente | Alta — paso Riesgo | RiesgoSobrescrito | Editar nivel de riesgo |
| OI creada | Módulo OI | OICreada | Crear operación inusual |
| Estado OI modificado | Detalle OI | OIEstadoModificado | Cambiar estado OI |
| Reporte regulatorio generado | Módulo Reportes | ReporteGenerado | Generar reporte regulatorio |
| Reporte descargado en .TXT | Módulo Reportes | ReporteDescargado | Descargar reporte .TXT |
| Alerta gestionada | Dashboard / Alertas | AlertaGestionada | Gestionar alerta |
| Cuenta bloqueada | Detalle cliente | CuentaBloqueada | Bloquear cuenta |
| Cuenta desbloqueada | Detalle cliente | CuentaDesbloqueada | Desbloquear cuenta |
| Screening ejecutado | Alta / Detalle cliente | ScreeningEjecutado | Ejecutar screening |
| Audit log exportado | Vista audit log | AuditLogExportado | Exportar audit log |

---

## Post-MVP

### Automatización

- **RF-OCR** *(fuera de scope MVP)*: Lectura automática de documentos con tecnología OCR — integración directa de la API 4i desde el sistema de Compliance para leer documentos subidos manualmente, sin necesidad de la app del cliente.
- **RF-DD-RIESGO**: Alinear el tipo de Due Diligence directamente con el nivel de riesgo calculado automáticamente (Simplificada = Bajo / Media = Medio / Reforzada = Alto).
- **RF-WS**: Integración con Web Service externo (a definir con el equipo técnico — consultar con Adrián).
- **RF-INGESTA**: Ingesta automática de operaciones desde el core transaccional de dCP para el módulo de monitoreo de OI.

### Alertas de Vencimiento de Documentación por Riesgo *(propuesto por Maxi)*

- **RF-ALERTA-DOC**: Implementar lógica de periodicidad de re-solicitud de documentos basada en el nivel de riesgo del cliente y en el tipo de documento — no todos los documentos se re-solicitan con la misma frecuencia ni por el mismo motivo.

  **Reglas por tipo de documento:**
  - **Estatuto**: se solicita 1 sola vez. Se vuelve a pedir únicamente ante un cambio societario.
  - **Libro de Accionistas**: se solicita 1 vez; se re-solicita anualmente o ante cambio de composición accionaria.
  - **Designación de Autoridades**: tiene fecha de inicio y fecha de fin de mandato. El sistema debe alertar próximo al vencimiento. Si el estatuto no define el plazo del mandato, la periodicidad de re-solicitud se define por riesgo:
    - Riesgo Alto → re-solicitar cada **1 año**
    - Riesgo Bajo/Medio → re-solicitar cada **3 años**
  - Para el resto de documentos con fecha de vencimiento: alertar X días antes (configurable).

  **Criterio general:** los documentos se vuelven a pedir cuando hay un **cambio** (no por periodicidad fija), salvo aquellos que tienen fecha de vencimiento explícita o mandato definido.

  > ⚠️ *Pendiente de validación*: consultar con Adrián si es viable definir la lógica de periodicidad documento por documento.

### Personas

- **RF-ESTADO-CIVIL**: Agregar campo "Estado civil" a la ficha de cada persona vinculada. Opciones: Soltero / Casado / Viudo. Si el valor seleccionado es **Casado**, el sistema solicita obligatoriamente los datos del cónyuge: nombre, apellido y DNI.
- **RF-ACCIONES-ACCIONISTA**: Al cargar el Libro de Accionistas, además del número total de acciones emitidas, permitir registrar el porcentaje de acciones individual de cada accionista en su ficha de persona vinculada.
- **RF-CONTACTO-INICIAL**: Solicitar teléfono y email de contacto al inicio del proceso de alta (no necesariamente del titular — puede ser de un referente o responsable del trámite) para poder comunicarse ante cualquier consulta o pedido de documentación.

### Flujo

- **RF-FLUJO-INVERSO**: Evaluar cambio de orden en el flujo de alta: **1° carga de datos → 2° aprobación de documentación** (inverso al flujo actual). A definir con el equipo de Compliance y UX.

### Permisos y Archivos

- **RF-PERMISOS**: Revisión y ajuste fino de la matriz de permisos por rol — definir casos borde y accesos granulares no contemplados en MVP.
- **RF-ARCHIVOS-RECHAZADOS**: Mejorar el manejo de archivos rechazados — historial de versiones por documento, visualización de la versión rechazada junto a la nueva, trazabilidad completa del ciclo de vida de cada archivo.

### Alertas

- **RF-ALERTA-DOCS**: Alertas automáticas cuando la documentación de un cliente está próxima a vencer (configurable, default 30 días) o ya venció. Visibles en dashboard y detalle del cliente. El analista puede marcarlas como "gestionadas" con comentario opcional.
- **RF-ALERTA-DASHBOARD**: Dashboard centralizado con: alertas activas, altas pendientes por antigüedad, OI abiertas y reportes próximos a vencer. Navegación directa desde cada alerta al legajo o caso asociado.
- **RF-ALERTA-URGENTES**: Cuentas bloqueadas y altas pendientes con más de 72 hs destacadas como "Urgentes". Notificación por email ante nuevos bloqueos.
- **RF-ALERTA-REPORTES**: Alertas de vencimiento de reportes regulatorios con X días de anticipación (configurable por Nivel 1). Distinción visual entre "próximo a vencer" (amarillo) y "vencido" (rojo).

### Exportación de Legajo

- **RF-LEGAJO-PDF**: Exportar el legajo completo de un cliente en formato PDF desde el detalle del cliente. Incluye: datos del cliente, personas vinculadas, documentación (estados e historial), nivel de riesgo, historial de OI y audit log del legajo. La exportación queda registrada con usuario y fecha.

### Integraciones

- **RF-REPET**: Integración con el listado REPET (Registro de Personas Expuestas Políticamente) para screening automático de personas vinculadas durante el onboarding. El sistema consultaría el listado y marcaría automáticamente las coincidencias para revisión del analista.
- **RF-AFIP**: Integración en tiempo real con API de AFIP para validación de CUIT y consulta de datos fiscales.
- **RF-PORTAL**: Portal de autogestión para que el cliente cargue directamente su documentación sin intervención del equipo interno.

---

## Anexo — Documentación requerida por tipo de entidad

### SA (Sociedad Anónima)
**Documentos obligatorios:** Estatuto · Acta de designación de autoridades · Última página del Libro de Registro de Accionistas · Poder
**Campos a completar:** Duración societaria · Capital suscripto · Mandato vigente · Año inicio/fin mandato · Total acciones emitidas · Fecha última anotación libro · Denominación social coincide · Poder verificado y vigente · Observaciones poder · Fecha DDJJ beneficiarios finales

### SRL (Sociedad de Responsabilidad Limitada)
**Documentos obligatorios:** Contrato Social · Última Acta de Asamblea o Reunión de Socios · Libro de Registro de Socios (última hoja) · Poder
**Campos a completar:** Plazo · Capital social · Fecha de asamblea · Mandato vigente · Inicio/fin mandato · Total cuotas emitidas · Fecha última anotación · Los datos coinciden con ARCA · Poder verificado y vigente · Observaciones poder · Fecha DDJJ beneficiarios finales · Fecha DDJJ PEP

### SH (Sociedad de Hecho)
**Documentos obligatorios:** Contrato Social Privado o Acuerdo de Constitución · DNI de todos los socios · DDJJ de Designación de Representante/Apoderado (si aplica)
**Campos a completar:** Fecha de constitución · Domicilio completo (calle, número, piso, depto, localidad, provincia, CP) · Objeto social · Duración · Capital · Fecha DDJJ beneficiarios finales · Observaciones BF · Fecha DDJJ PEP

### Sucesión / Sucesión Indivisa
**Documentos obligatorios:** Declaratoria de Herederos o Testamento Protocolizado · Designación de Administrador (si corresponde) · DNI de todos los herederos/administrador · Poder (opcional)
**Campos a completar:** Juzgado · N° de expediente · Carátula · Tipo de sucesión · Estado del trámite · ¿Existe administrador? · Fecha de designación del administrador · Estado de aceptación del cargo

### Monotributista
**Documentos obligatorios:** Constancia de actividad/inscripción · Declaración PEP · DNI frente · DNI dorso
**Campos a completar (desde DNI):** Nacionalidad · Sexo · Fecha de emisión del DNI · Fecha de vencimiento del DNI · N° de trámite · DNI vigente

### Complementarios (todos los casos)
- Declaración Jurada de Beneficiarios Finales
- Declaración Jurada de Persona Expuesta Políticamente (PEP)

### Campos de Personas (todos los tipos de entidad)

| Campo | Origen |
|-------|--------|
| Nombre | GET (app del cliente / 4i) |
| Apellido | GET (app del cliente / 4i) |
| Email | GET (app del cliente) |
| Teléfono | GET (app del cliente) |
| Tipo de documento | POST (carga manual) |
| N° de documento | GET/POST (4i o manual) |
| CUIT/CUIL | POST (carga manual) |
| Fecha de nacimiento | GET/POST (4i o manual) |
| Domicilio | GET/POST (4i o manual) |
| Actividad laboral | GET (app del cliente) |
| Firmante | POST (decisión del analista) |
| Condición PEP | POST (declaración) |
| REPET | POST (carga manual) |
| Sexo | GET (4i) |
| Nacionalidad | GET (4i) |
| N° de trámite DNI | GET (4i) |
| N° de ejemplar DNI | GET (4i) |
