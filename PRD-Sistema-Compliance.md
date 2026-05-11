# PRD - Sistema Interno de Compliance KYC/AML

| Campo | Valor |
|-------|-------|
| **Status** | En curso |
| **Author(s)** | [PM Responsable] |
| **Stakeholders** | Compliance, Legal, Operaciones, Producto, Tecnología |
| **Team** | Chiara Giralt, Lanfranco Bortolin, Jero Rech |
| **Last Updated** | Abril 2026 — rev. 2 |

---

## Resumen Ejecutivo

Se está desarrollando una herramienta interna de Compliance para deCampoPagos (dCP) que centraliza la gestión de onboarding de clientes, validación documental, monitoreo de operaciones y generación de reportes regulatorios. El sistema da respuesta a los requerimientos del BCRA y la UIF que deben cumplirse para operar como Proveedor de Servicios de Pago (PSP).

El producto reemplaza procesos manuales dispersos por un sistema estructurado que permite al equipo de Compliance gestionar legajos, aprobar o rechazar clientes con trazabilidad completa, detectar operaciones inusuales y emitir Reportes de Operaciones Sospechosas (ROS) ante la UIF, todo desde un único entorno centralizado.

---

## Definición del Problema

### ¿Por qué?

**Problema del usuario (equipo de Compliance):**
Hoy no existe un sistema centralizado para gestionar la documentación y los procesos de KYC/AML. Los analistas de Compliance deben operar de forma manual, con documentación dispersa en emails, carpetas compartidas y hojas de cálculo. Esto genera:
- Falta de trazabilidad en las decisiones de aprobación/rechazo de clientes.
- Riesgo de inconsistencias o errores en la información registrada.
- Dificultad para auditar el proceso de revisión documental ante organismos de control.
- Dependencia de personas clave para operar el proceso.

**Problema del negocio:**
La expansión hacia lending y factoring requiere constituirse formalmente como PSP. Los organismos reguladores (BCRA y UIF) exigen la recolección, verificación y conservación de información KYC de los clientes, así como la correcta gestión de procesos vinculados a prevención de lavado de activos y financiamiento del terrorismo (PLA/FT). Sin un sistema que respalde estos procesos, la empresa no puede operar bajo las nuevas líneas de negocio ni responder adecuadamente a auditorías regulatorias.

### ¿Para qué?

- **Para el equipo de Compliance**: Contar con una herramienta que estandarice el proceso de validación, centralice la documentación y registre todas las decisiones con fecha, usuario responsable y justificación.
- **Para el negocio**: Habilitar la operación como PSP cumpliendo los requerimientos regulatorios del BCRA y la UIF, reduciendo el riesgo de sanciones y facilitando auditorías.
- **Para la empresa**: Escalar el proceso de onboarding sin incrementar linealmente el equipo de Compliance.

---

## Medición - KPIs y Resultados Esperados

### Métricas de Adopción

| Métrica | Baseline | Target | Cómo se mide |
|---------|----------|--------|--------------|
| % de altas de clientes gestionadas en el sistema | 0% | 100% | Clientes creados en sistema vs. total onboardeados |
| % de documentación cargada en sistema vs. recibida por mail | 0% | 90% | Documentos en BD vs. flujo de mail |

### Métricas de Uso

| Métrica | Baseline | Target | Cómo se mide |
|---------|----------|--------|--------------|
| Tiempo promedio de revisión de legajo (desde pendiente hasta aprobado/rechazado) | No medido | < 48hs | Diferencia de timestamps en BD |
| % de clientes con legajo completo al momento de aprobación | No medido | 100% | Documentos requeridos vs. presentes por cliente |
| Operaciones inusuales registradas con evidencia adjunta | 0 | 100% de los casos abiertos | Casos con evidencia en BD |

### Métricas de Negocio / Compliance

| Métrica | Baseline | Target | Cómo se mide |
|---------|----------|--------|--------------|
| Clientes aprobados por mes con trazabilidad completa | 0 | 100% | Audit log en BD |
| ROS emitidos a la UIF registrados en sistema | 0 | 100% | Tabla `suspicious_reports` |
| Tiempo de respuesta ante auditoria regulatoria | No medido | < 2hs para consultas de legajo | Manual |

---

## Discovery

### Diagrama de Flujo Principal — Onboarding de Clientes

```
[Inicio de Proceso de Alta]
          |
          v
[Carga de datos del cliente]
  (persona humana o jurídica)
          |
          v
[Carga de documentación requerida]
  (según tipo de cliente: DNI, CUIT,
   estatuto, balance, poderes, etc.)
          |
          v
[Evaluación de riesgo automática]
  (matriz configurable: actividad,
   zona geográfica, tipo societario,
   exposición PEP)
          |
          v
[Screening en listas de sanciones]
  (OFAC, ONU, BCRA inhabilitados)
          |
          v
[Revisión manual por analista Compliance]
    /              \
[Aprueba]       [Rechaza / Solicita más info]
    |                     |
    v                     v
[Cliente activo]   [Notificación + legajo en espera]
```

### Diagrama de Flujo — Monitoreo Operacional

```
[Transacción registrada en sistema]
          |
          v
[Motor de alertas automáticas]
  (umbrales configurables por monto,
   frecuencia, tipo de operación)
          |
    [¿Supera umbral?]
    /            \
  [No]          [Sí]
   |              |
   v              v
[Pasa]    [Alerta generada]
               |
               v
     [Revisión analista Compliance]
        /              \
[Operación normal]  [Operación Inusual]
     |                    |
     v                    v
[Cierre sin acción]  [Apertura de caso]
                          |
                          v
               [Investigación interna]
                /                \
       [Se descarta]         [ROS a la UIF]
```

### Stack Técnico (actual)

| Capa | Tecnología | Estado |
|------|-----------|--------|
| Frontend | React + TypeScript + Vite + Tailwind | En desarrollo (DEMO_MODE) |
| Backend | Node.js + Express + Sequelize | Desarrollado |
| Base de datos (dev) | SQLite | Operativo en local |
| Base de datos (prod) | PostgreSQL | Pendiente migración |
| Hosting frontend | Por definir (Vercel/Netlify) | Pendiente |
| Hosting backend | Por definir (Railway/Render) | Pendiente |

### Documentación técnica relacionada
- Estructura de base de datos: `RESUMEN_BASE_DE_DATOS.md`
- Diagrama ER: `diagrama-er.html`
- Flujo de alta: `Flujos_Alta_Compliance.html`

---

## Requerimientos

### Módulo 1: Gestión de Clientes (KYC - Onboarding)

---

**1. Como analista de Compliance**
   quiero poder crear un nuevo cliente en el sistema (persona humana o jurídica)
   para iniciar el proceso de onboarding con toda la información registrada en un único lugar

**Criterios de aceptación:**
- El formulario debe permitir seleccionar el tipo de cliente: Persona Humana o Persona Jurídica
- Para Persona Humana: nombre completo, CUIT/CUIL, fecha de nacimiento, nacionalidad, actividad, domicilio
- Para Persona Jurídica: razón social, CUIT, fecha de constitución, actividad, objeto social, domicilio, datos del representante legal
- El sistema debe asignar automáticamente el estado inicial: `Pendiente`
- Se debe registrar fecha y usuario que creó el legajo en el audit log

---

**2. Como analista de Compliance**
   quiero cargar y gestionar los documentos requeridos para cada cliente
   para contar con el legajo completo antes de aprobar el alta

**Criterios de aceptación:**
- El sistema debe mostrar el checklist de documentos requeridos según el tipo de cliente
- Para Persona Humana: DNI (frente y dorso), CUIT, declaración PEP, comprobante de domicilio
- Para Persona Jurídica: estatuto, acta de designación de autoridades, poderes, CUIT, balance, declaración PEP de cada firmante y beneficiario final
- Cada documento debe poder cargarse en formato PDF, JPG o PNG
- El sistema debe registrar quién cargó el documento y cuándo
- El analista debe poder marcar cada documento como: Aprobado, Rechazado o Pendiente de revisión
- El legajo debe mostrar visualmente el porcentaje de completitud de la documentación

---

**3. Como analista de Compliance**
   quiero registrar los beneficiarios finales y firmantes de una persona jurídica
   para cumplir con los requerimientos de la UIF sobre identificación de beneficiarios últimos

**Criterios de aceptación:**
- El sistema debe permitir agregar N beneficiarios finales con: nombre, CUIT, porcentaje de participación, tipo de vínculo
- Debe permitir registrar firmantes/apoderados con: nombre, CUIT, tipo de poder, vencimiento
- Para cada persona vinculada, el sistema debe permitir indicar si es PEP (Persona Expuesta Políticamente)
- Si se marca como PEP, debe solicitarse la declaración correspondiente

---

**4. Como analista de Compliance**
   quiero aprobar el alta de un cliente con trazabilidad completa aunque haya documentos pendientes o rechazados
   para no bloquear el proceso cuando el cliente aún no cargó ciertos documentos no críticos

**Criterios de aceptación:**
- Solo el usuario con Nivel 1 (Oficial de Cumplimiento) puede cambiar el estado a Aprobado o Rechazado
- Los usuarios Nivel 2 pueden cambiar el estado a: En revisión, Pendiente de documentación
- Los usuarios Nivel 3 solo pueden ver el estado, sin posibilidad de modificarlo
- Cada cambio de estado debe requerir un comentario/justificación obligatoria
- El historial de cambios de estado debe ser visible en el detalle del cliente
- El sistema debe registrar el usuario responsable y la fecha/hora de cada cambio
- Si hay documentos requeridos que no fueron aprobados, el botón "Aprobar" cambia visualmente a **"Aprobar con observaciones (N)"** (color ámbar, N = cantidad de docs pendientes) y permite continuar igual
- El sistema debe registrar cuántos y cuáles documentos estaban pendientes al momento de la aprobación en el audit log
- La aprobación **no se bloquea** por documentos faltantes; la responsabilidad queda en el Oficial de Cumplimiento que firma la decisión

---

**4b. Como analista de Compliance**
   quiero poder solicitar información adicional al cliente sin rechazarlo
   para darle la posibilidad de completar o corregir su legajo antes de tomar una decisión definitiva

**Criterios de aceptación:**
- El analista puede registrar una solicitud de información mediante el botón "Solicitar Info" en la pantalla de revisión
- El sistema actualiza el estado del cliente a `info_solicitada` y registra el motivo ingresado
- El motivo de la solicitud es un campo texto libre obligatorio (mínimo 20 caracteres)
- Una vez enviada la solicitud, queda visible en el historial del legajo con fecha y usuario
- El cliente puede volver a estar en estado `En Revisión` cuando el analista retoma el proceso

---

**5. Como analista de Compliance**
   quiero ver el listado de clientes con filtros y búsqueda
   para gestionar eficientemente la cola de revisión

**Criterios de aceptación:**
- El listado debe mostrar: nombre, CUIT, tipo, estado, nivel de riesgo, fecha de alta y responsable asignado
- Debe ser posible filtrar por: estado, tipo de cliente, nivel de riesgo, fecha de creación
- Debe ser posible buscar por nombre o CUIT
- El listado debe poder exportarse a CSV

---

**5b. Como analista de Compliance**
   quiero que los datos de identidad de cada persona vinculada se pre-carguen automáticamente desde la extracción de DNI realizada por la app del cliente (4i)
   para no tener que tipear manualmente datos que el cliente ya proporcionó al registrarse

**Criterios de aceptación:**
- Cuando la app del cliente envía datos con el campo `4iDocumentDataExtraction`, el sistema debe mapearlos automáticamente a los campos de la persona en el formulario de Personas Vinculadas
- Campos que se pre-cargan desde `front`: apellido (`LastName`), nombre (`FirstName`), número de documento (`DocumentNumber` — sin puntos), sexo (`Sex`), nacionalidad (`Nationality`), fecha de nacimiento (`DateOfBirth`), número de ejemplar del DNI (`DocumentOptionalAdditionalNumber`), número de trámite (`DocumentAdditionalNumber`)
- Campos que se pre-cargan desde `back`: domicilio (`Address` — saltos de línea convertidos a espacio), fecha de emisión del DNI (`DateOfIssue`), fecha de vencimiento del DNI (`DateOfExpiry`)
- Los campos pre-cargados desde 4i deben estar visualmente marcados como "dato del cliente" (ej. ícono de origen) pero deben ser editables por el analista
- Si la fecha de nacimiento viene como `01/01/0001` (valor inválido de 4i), el campo debe quedar vacío y marcarse como pendiente de carga manual
- Los siguientes campos **no** se extraen de 4i y siempre requieren ingreso manual: CUIT, email, teléfono, roles (esPep, esBeneficiarioFinal, etc.), porcentaje de participación, cargo

---

### Módulo 2: Evaluación de Riesgo

---

**6. Como analista de Compliance**
   quiero ver la evaluación de riesgo calculada automáticamente para cada cliente
   para enfocar la revisión manual en los casos de mayor exposición

**Criterios de aceptación:**
- El riesgo debe calcularse en base a: actividad económica, zona geográfica, tipo societario, condición PEP, y volumen de operaciones declarado
- El resultado debe clasificarse en tres niveles: Bajo, Medio, Alto
- La metodología de cálculo debe estar documentada y visible
- El analista debe poder sobrescribir el riesgo calculado con justificación registrada en el audit log

---

**7. Como responsable de Compliance**
   quiero poder configurar la matriz de riesgo (ponderaciones y umbrales)
   para adaptar el modelo de riesgo a los criterios internos y regulatorios vigentes

**Criterios de aceptación:**
- La configuración debe ser accesible solo para usuarios con Nivel 1 (Oficial de Cumplimiento)
- Los cambios en la matriz deben registrarse en el audit log con usuario y fecha
- El sistema debe permitir activar/desactivar factores de riesgo sin eliminarlos

---

**7b. Como analista de Compliance**
   quiero navegar libremente entre los pasos del flujo de onboarding (Revisión de Docs. → Datos Entidad → Riesgo → Alta Final)
   para poder volver a revisar o corregir información de pasos anteriores sin perder lo cargado

**Criterios de aceptación:**
- El paso "Datos Entidad" (paso 2) debe mostrar un botón "Volver a Revisión de Docs." visible en la parte superior del contenido
- Al hacer clic en "Volver", el sistema regresa al paso 1 (Revisión de Docs.) conservando todos los estados de aprobación/rechazo de documentos ya revisados
- En el paso 1, los documentos que fueron aprobados deben poder re-rechazarse: el botón de rechazar debe estar disponible independientemente de si todos los docs están aprobados (`readyForAlta`)
- Cuando todos los documentos están aprobados (`readyForAlta = true`), la fila del cliente muestra el botón "Continuar Carga de Datos" pero también un toggle para expandir y ver el detalle de los documentos ya revisados
- El navegador no debe perder el estado del formulario al retroceder entre pasos

---

### Módulo 3: Screening en Listas

---

**8. Como analista de Compliance**
   quiero que el sistema verifique automáticamente si un cliente figura en listas de sanciones internacionales
   para cumplir con las obligaciones de la UIF sobre prevención de lavado de activos

**Criterios de aceptación:**
- El screening debe ejecutarse automáticamente al crear un cliente y antes de aprobarlo
- Debe verificar contra: listas OFAC, ONU, y nómina de inhabilitados del BCRA
- El resultado debe registrarse con fecha, lista verificada y resultado (match / sin match)
- Si hay un match, el sistema debe bloquear la aprobación y generar una alerta para revisión manual
- El analista debe poder marcar un match como "falso positivo" con justificación

---

### Módulo 4: Monitoreo de Operaciones

---

**9. Como analista de Compliance**
   quiero registrar y gestionar operaciones inusuales detectadas
   para documentar el proceso de análisis y decisión antes de emitir o descartar un ROS

**Criterios de aceptación:**
- El analista debe poder crear una operación inusual asociada a un cliente, con: descripción, monto, fecha, tipo de operación y documentación de respaldo
- El caso debe tener estados: Nuevo → En Análisis → Escalado → Cerrado (sin ROS) / Cerrado (con ROS)
- El sistema debe permitir adjuntar evidencia (documentos, capturas, comunicaciones)
- El historial de análisis debe quedar registrado con fecha y usuario

---

**10. Como sistema de monitoreo**
    quiero generar alertas automáticas cuando una operación supera los umbrales configurados
    para que el equipo de Compliance no dependa exclusivamente de la detección manual

**Criterios de aceptación:**
- Los umbrales deben ser configurables (monto por operación, frecuencia, acumulado mensual)
- Las alertas deben asociarse al cliente y a la operación que la disparó
- El analista debe poder desestimar una alerta con justificación o escalarla como caso de operación inusual
- Las alertas no gestionadas deben destacarse visualmente en el dashboard

---

### Módulo 5: Reportes Regulatorios

---

**11. Como analista de Compliance**
    quiero generar y registrar un Reporte de Operaciones Sospechosas (ROS) ante la UIF
    para cumplir con la obligación de reporte ante el organismo regulador

**Criterios de aceptación:**
- El ROS debe poder crearse desde un caso de operación inusual o en forma independiente
- Debe registrar: cliente involucrado, descripción de la operación, monto, fecha, fundamento del reporte, y usuario responsable
- El estado del ROS debe ser: Borrador → Revisado → Enviado a UIF
- Una vez marcado como "Enviado a UIF", el reporte no debe poder editarse
- El sistema debe permitir exportar el reporte en formato PDF o para carga en el sistema de la UIF

---

**12. Como responsable de Compliance**
    quiero generar reportes de gestión internos (dashboard y exportaciones)
    para tener visibilidad del estado del proceso y presentar métricas ante dirección

**Criterios de aceptación:**
- El dashboard debe mostrar: clientes por estado, distribución de riesgo, alertas activas, operaciones inusuales abiertas, ROS emitidos en el período
- Debe ser posible exportar el listado de clientes con su estado de legajo y nivel de riesgo a CSV/Excel
- Los reportes deben poder filtrarse por período de tiempo

---

### Módulo 6: Infraestructura y Seguridad

---

**13. Como usuario del sistema**
    quiero autenticarme con usuario y contraseña
    para acceder solo a las funciones permitidas para mi rol

**Criterios de aceptación:**
- El sistema debe soportar 3 niveles de acceso:

| Nivel | Nombre | Usuario | Permisos |
|-------|--------|---------|----------|
| Nivel 1 — Oficial de Cumplimiento | Emilio Herz | Por definir | Ver + Editar + Aprobar |
| Nivel 2 — Administrativo | Por definir | Por definir | Ver + Editar (sin aprobar) |
| Nivel 3 — Solo lectura | Por definir | Por definir | Ver |

- Las contraseñas deben tener un mínimo de 8 caracteres, al menos una mayúscula y un número
- Las sesiones deben expirar tras 30 minutos de inactividad
- El sistema debe ofrecer un flujo de recuperación de contraseña por email
- Los intentos de login fallidos (más de 5) deben bloquear temporalmente la cuenta
- Todos los accesos deben quedar registrados en el audit log

---

**14. Como equipo de tecnología**
    quiero migrar la base de datos de SQLite a PostgreSQL en la nube
    para que el sistema pueda ser utilizado por múltiples usuarios en simultáneo desde cualquier ubicación

**Criterios de aceptación:**
- La migración debe realizarse sin pérdida de datos del entorno de desarrollo
- El backend debe funcionar correctamente contra PostgreSQL (Supabase o Neon)
- El frontend debe conectarse al backend en producción, eliminando el DEMO_MODE
- El sistema debe ser accesible desde una URL pública (frontend en Vercel/Netlify, backend en Railway/Render)

### Módulo 7: Gestión de Usuarios del Sistema

---

**15. Como Oficial de Cumplimiento (Nivel 1)**
    quiero crear, editar y desactivar usuarios del sistema
    para controlar quién tiene acceso y con qué nivel de permisos

**Criterios de aceptación:**

_Creación de usuarios:_
- Solo el Nivel 1 puede crear, editar y desactivar usuarios
- El formulario de creación debe requerir: nombre completo, email corporativo y nivel de acceso (1, 2 o 3)
- El email debe ser único en el sistema; si ya existe, mostrar error antes de guardar
- Al crear el usuario el sistema genera una contraseña temporal y la envía por email al usuario
- El usuario debe cambiar la contraseña en su primer ingreso

_Edición:_
- Se puede editar: nombre, email y nivel de acceso
- No se puede editar el propio usuario desde esta pantalla (para evitar auto-escalada de permisos)
- Cualquier cambio de nivel de acceso debe quedar registrado en el audit log con usuario responsable y fecha

_Desactivación:_
- Un usuario desactivado no puede iniciar sesión; si intenta hacerlo, recibe el mensaje: "Tu cuenta está desactivada. Contactá al Oficial de Cumplimiento."
- El historial de acciones del usuario desactivado se conserva íntegro en el audit log
- No debe ser posible eliminar usuarios del sistema bajo ninguna circunstancia

_Listado:_
- El listado debe mostrar: nombre, email, nivel de acceso, estado (activo/inactivo) y fecha del último acceso
- Debe poder filtrarse por nivel y por estado
- Los usuarios inactivos deben aparecer diferenciados visualmente (ej. fila atenuada)

---

### Módulo 8: Due Diligence (DDS)

---

**16. Como analista de Compliance**
    quiero ejecutar y registrar el proceso de Due Diligence de un cliente
    para documentar la verificación de identidad, PEP, listas de sanciones y fuentes externas en un único flujo estructurado

**Criterios de aceptación:**

_Acceso y apertura:_
- El proceso de DDS debe estar disponible desde el detalle del cliente, en una tab o sección dedicada
- Debe poder iniciarse solo sobre clientes con estado distinto a Rechazado
- El sistema debe indicar si el cliente ya tiene un DDS completado previamente y cuándo fue

_Verificación de Identidad:_
- El analista debe poder marcar cada ítem de forma independiente: identidad verificada, documento vigente, foto coincide
- Si algún ítem queda sin marcar, el sistema debe advertir al intentar avanzar pero no bloquear (puede guardarse como borrador)
- Debe haber un campo de observaciones libre para esta sección

_Verificación PEP:_
- El analista debe registrar si realizó la consulta (checkbox) y el resultado: No PEP / PEP Nacional / PEP Extranjero
- Si el resultado es PEP Nacional o PEP Extranjero, el campo "Cargo PEP" es obligatorio
- Si el cliente es PEP, el sistema debe actualizar automáticamente el nivel de riesgo a Alto (con posibilidad de sobrescribir con justificación)

_Verificación en Listas de Sanciones:_
- Debe registrarse la consulta en cada lista por separado: OFAC, ONU, UIF
- Resultado por lista: Sin coincidencias / Coincidencia parcial / Coincidencia total
- Si el resultado es Coincidencia total en cualquier lista, el sistema debe bloquear la aprobación del DDS y generar una alerta automática para el Nivel 1

_Verificación de Actividad:_
- Debe registrarse: actividad verificada, ingresos declarados concuerdan con perfil, origen de fondos validado
- Debe haber un campo de observaciones para detallar el origen de fondos cuando corresponda

_Fuentes Externas (Nosis / Veraz):_
- El analista debe poder registrar para cada fuente: si fue consultada, score obtenido, situación crediticia (Normal / Riesgo Bajo / Riesgo Medio / Riesgo Alto) y NSE (ABC1, C2, C3, D1, D2E)
- Debe ser posible adjuntar el informe externo en PDF para cada fuente
- Si no se consultó ninguna fuente, el sistema debe mostrar advertencia al intentar cerrar el DDS

_Evaluación de Riesgo del DDS:_
- El analista debe registrar riesgo inherente y riesgo residual de forma independiente (Bajo / Medio / Alto)
- El sistema debe sugerir el nivel de riesgo en base a los ítems completados, pero el analista puede modificarlo con justificación obligatoria

_Cierre y aprobación:_
- El DDS puede guardarse como borrador en cualquier momento sin perder información
- Solo el Nivel 1 puede cambiar el estado del DDS a: Aprobado / Rechazado / Pendiente de información adicional
- El resultado final debe quedar registrado en el legajo del cliente con: fecha, analista que lo completó, usuario Nivel 1 que lo aprobó/rechazó y estado
- El historial completo de DDS realizados sobre el cliente debe ser visible y no editable

---

### Módulo 9: Contratos

---

**17. Como analista de Compliance**
    quiero registrar y hacer seguimiento del estado del contrato de cada cliente
    para saber qué clientes tienen contrato firmado y cuáles tienen gestiones pendientes

**Criterios de aceptación:**

_Estados y transiciones:_
- Cada cliente puede tener un contrato asociado con los siguientes estados: Pendiente de envío → Enviado → Firmado / Vencido
- Las transiciones válidas son: Pendiente de envío → Enviado (Nivel 2 o superior), Enviado → Firmado (solo Nivel 1), cualquier estado → Vencido (automático por fecha o manual por Nivel 1)
- No debe ser posible marcar como Firmado un contrato sin haber adjuntado el documento PDF

_Registro de firma:_
- Al marcar como Firmado se debe registrar: fecha de firma, nombre del firmante (del lado del cliente) y usuario del sistema que lo registró
- Si el contrato tiene fecha de vencimiento, debe registrarse y el sistema debe alertar 30 días antes de su vencimiento

_Adjunto:_
- El contrato debe poder cargarse en formato PDF únicamente
- El sistema debe permitir reemplazar el PDF adjunto con justificación registrada en el audit log
- El PDF debe poder visualizarse desde el detalle del cliente sin necesidad de descargarlo

_Visibilidad:_
- El estado del contrato debe ser visible en el detalle del cliente y en el listado general de clientes
- El listado de clientes debe poder filtrarse por estado de contrato
- Los contratos próximos a vencer (menos de 30 días) deben destacarse visualmente en el listado

---

### Módulo 10: Casos de Investigación

---

**18. Como analista de Compliance**
    quiero abrir y gestionar un caso de investigación a partir de una alerta o sospecha
    para documentar el proceso completo de análisis hasta su resolución

**Criterios de aceptación:**

_Apertura del caso:_
- Un caso puede abrirse desde tres orígenes: una alerta automática, una operación inusual existente o de forma manual desde la sección de Casos
- Al abrir el caso se debe registrar obligatoriamente: cliente involucrado, descripción inicial de la situación, origen (alerta / operación inusual / manual), analista responsable y nivel de urgencia (Normal / Alto / Crítico)
- Si el caso se abre desde una alerta u operación inusual, debe quedar vinculado automáticamente al registro de origen

_Estados y transiciones:_
- Los estados del caso son: Abierto → En Investigación → Escalado → Cerrado
- Los Nivel 2 pueden mover el caso entre Abierto, En Investigación y Escalado
- Solo el Nivel 1 puede mover el caso a Cerrado
- Cada cambio de estado requiere un comentario obligatorio

_Gestión de evidencia y actualizaciones:_
- El analista debe poder agregar actualizaciones al caso en cualquier momento, con: texto libre, fecha automática y archivos adjuntos (PDF, imágenes, capturas)
- Cada actualización queda firmada con el usuario y la fecha/hora
- Las actualizaciones no pueden editarse ni eliminarse una vez guardadas

_Cierre del caso:_
- Al cerrar el caso se debe registrar la resolución (una de las tres opciones): Descartado / Derivado a ROS / Archivado
- La justificación del cierre es obligatoria en los tres casos
- Si la resolución es "Derivado a ROS", el sistema debe requerir seleccionar o crear el ROS vinculado antes de poder cerrar
- Un caso cerrado no puede reabrirse; si es necesario, el Nivel 1 debe crear un nuevo caso con referencia al anterior

_Visibilidad:_
- Los casos abiertos con urgencia Alta o Crítica deben destacarse visualmente en el listado y en el dashboard
- El listado de casos debe poder filtrarse por: estado, nivel de urgencia, analista responsable y rango de fechas
- Desde el detalle de un cliente debe ser posible ver todos los casos de investigación asociados a él

---

### Módulo 11: Audit Log

---

**19. Como Oficial de Cumplimiento (Nivel 1)**
    quiero consultar el registro completo de acciones realizadas en el sistema
    para auditar cualquier acción ante un requerimiento regulatorio o una inconsistencia detectada

**Criterios de aceptación:**

_Registro automático:_
- El sistema debe registrar automáticamente en el audit log toda acción que modifique datos: creación, edición, cambio de estado y eliminación (si aplica) de cualquier entidad del sistema (clientes, documentos, DDS, casos, ROS, contratos, usuarios, configuración de riesgo)
- También debe registrarse: inicio de sesión, cierre de sesión e intentos de acceso fallidos
- Cada entrada del log debe incluir: fecha/hora exacta, usuario responsable, tipo de acción, entidad afectada (nombre/ID), valor anterior y valor nuevo (cuando aplique) e IP desde donde se realizó la acción

_Acceso:_
- Solo el Nivel 1 tiene acceso a la vista completa del audit log
- El Nivel 2 puede ver únicamente el historial de acciones sobre los clientes que tiene asignados
- El Nivel 3 no tiene acceso al audit log

_Consulta y filtros:_
- Debe poder filtrarse por: usuario, tipo de acción, entidad afectada, rango de fechas y IP
- La vista debe estar paginada (máximo 50 registros por página) para no degradar la performance
- Debe haber un buscador libre para buscar por nombre de cliente, usuario o descripción de la acción

_Inmutabilidad:_
- El audit log no puede editarse, eliminarse ni desactivarse bajo ninguna circunstancia, incluso para el Nivel 1
- Cualquier intento de modificación directa en base de datos debe quedar registrado como un evento de seguridad

_Exportación:_
- El log debe poder exportarse a CSV con los mismos filtros aplicados en pantalla
- La exportación debe incluir todas las columnas del registro (fecha, usuario, acción, entidad, IP)
- La acción de exportación debe quedar registrada en el propio audit log

---

## Especificación Funcional Detallada — Módulos Nuevos

---

### RF-07 | Gestión de Usuarios del Sistema

#### Reglas de negocio

| ID | Regla |
|----|-------|
| RN-07-01 | Solo existe un usuario de Nivel 1 activo a la vez. Si se necesita reemplazar al Nivel 1, el usuario saliente debe crear al entrante antes de desactivarse a sí mismo. |
| RN-07-02 | Un usuario no puede modificar su propio nivel de acceso. |
| RN-07-03 | Un usuario no puede desactivarse a sí mismo. |
| RN-07-04 | Al cambiar el nivel de acceso de un usuario, sus sesiones activas deben invalidarse inmediatamente para forzar un nuevo login con los permisos actualizados. |
| RN-07-05 | Las contraseñas temporales generadas al crear un usuario tienen una validez de 48hs. Si no se usa en ese plazo, el usuario debe solicitar reenvío al Nivel 1. |

#### Matriz de permisos por nivel

| Acción | Nivel 1 | Nivel 2 | Nivel 3 |
|--------|---------|---------|---------|
| Ver listado de clientes | ✓ | ✓ | ✓ |
| Crear cliente | ✓ | ✓ | ✗ |
| Editar cliente | ✓ | ✓ | ✗ |
| Aprobar / Rechazar cliente | ✓ | ✗ | ✗ |
| Cargar documentos | ✓ | ✓ | ✗ |
| Aprobar / Rechazar documentos | ✓ | ✓ | ✗ |
| Ejecutar screening | ✓ | ✓ | ✗ |
| Completar DDS | ✓ | ✓ | ✗ |
| Aprobar DDS | ✓ | ✗ | ✗ |
| Gestionar contratos | ✓ | ✓ | ✗ |
| Firmar contrato (registrar) | ✓ | ✗ | ✗ |
| Crear operación inusual | ✓ | ✓ | ✗ |
| Crear / gestionar casos | ✓ | ✓ | ✗ |
| Cerrar casos | ✓ | ✗ | ✗ |
| Crear ROS | ✓ | ✓ | ✗ |
| Marcar ROS como enviado | ✓ | ✗ | ✗ |
| Ver audit log completo | ✓ | ✗ | ✗ |
| Ver historial de sus clientes | ✓ | ✓ | ✗ |
| Crear / editar / desactivar usuarios | ✓ | ✗ | ✗ |
| Configurar matriz de riesgo | ✓ | ✗ | ✗ |
| Configurar umbrales de alertas | ✓ | ✗ | ✗ |

#### Validaciones

- El campo email debe validar formato válido (usuario@dominio.com)
- No se permite crear dos usuarios con el mismo email, independientemente del nivel o estado (activo/inactivo)
- El nombre completo debe tener al menos dos palabras

#### Flujos alternativos

- **Contraseña temporal vencida:** el usuario ve el mensaje "Tu enlace de acceso venció. Solicitá al Oficial de Cumplimiento que reenvíe tus credenciales." El Nivel 1 puede reenviar desde la pantalla de edición del usuario.
- **Intento de login de usuario inactivo:** el sistema muestra "Tu cuenta está desactivada. Contactá al Oficial de Cumplimiento." y registra el intento en el audit log.

---

### RF-08 | Due Diligence (DDS)

#### Reglas de negocio

| ID | Regla |
|----|-------|
| RN-08-01 | No puede iniciarse un DDS sobre un cliente con estado Rechazado. |
| RN-08-02 | Un cliente puede tener múltiples DDS a lo largo del tiempo (ej. renovación anual). El DDS vigente es siempre el último aprobado. |
| RN-08-03 | Si el resultado de PEP es Nacional o Extranjero, el nivel de riesgo del cliente se actualiza automáticamente a Alto, salvo que el Nivel 1 lo sobrescriba con justificación. |
| RN-08-04 | Si alguna lista de sanciones arroja Coincidencia Total, el DDS no puede aprobarse hasta que el Nivel 1 resuelva el caso manualmente y lo registre. |
| RN-08-05 | El DDS en estado Borrador no tiene efecto sobre el perfil de riesgo del cliente. Solo un DDS Aprobado actualiza el perfil. |
| RN-08-06 | El DDS debe revisarse y renovarse como máximo cada 12 meses para clientes de riesgo Alto, y cada 24 meses para clientes de riesgo Bajo o Medio. El sistema debe alertar 30 días antes del vencimiento. |

#### Flujo de estados del DDS

```
[Borrador]
    |
    v
[En revisión] ──────────────────────────┐
    |                                   |
    v                                   v
[Aprobado]                         [Rechazado]
    |
    v
[Vencido] (por plazo según nivel de riesgo)
```

#### Validaciones por sección

| Sección | Campo obligatorio | Condición |
|---------|------------------|-----------|
| Identidad | Al menos un ítem marcado | Siempre |
| PEP | Cargo PEP | Solo si resultado es PEP Nacional o Extranjero |
| Listas | Resultado de cada lista | Siempre |
| Actividad | Origen de fondos (observaciones) | Si el origen de fondos no se pudo verificar |
| Fuentes externas | Al menos una fuente consultada | Para avanzar a "En revisión" |
| Evaluación de riesgo | Riesgo inherente y residual | Siempre |

#### Casos borde

- Si se carga un nuevo DDS para un cliente que ya tiene uno Aprobado, el sistema advierte: "Este cliente ya tiene un DDS aprobado vigente. ¿Querés iniciar uno nuevo de todas formas?" — el DDS anterior pasa a estado Histórico.
- Si el analista sale sin guardar, el sistema pregunta si desea guardar como borrador.
- Si se adjunta un archivo externo de Nosis o Veraz y luego se reemplaza, el archivo anterior debe quedar en el historial de versiones del DDS.

---

### RF-09 | Contratos

#### Reglas de negocio

| ID | Regla |
|----|-------|
| RN-09-01 | Un cliente solo puede tener un contrato activo a la vez. Para generar uno nuevo, el anterior debe estar en estado Vencido o Rechazado. |
| RN-09-02 | Un contrato no puede marcarse como Firmado si no tiene un PDF adjunto. |
| RN-09-03 | La fecha de firma no puede ser anterior a la fecha de creación del contrato en el sistema. |
| RN-09-04 | Los contratos Firmados no pueden editarse. Si se necesita hacer una corrección, se debe crear un nuevo contrato con referencia al anterior. |
| RN-09-05 | El sistema debe generar una alerta automática al Nivel 1 cuando un contrato esté a 30 días de vencer. |

#### Flujo de estados del contrato

```
[Pendiente de envío]
         |
         v
     [Enviado]
         |
    ┌────┴────┐
    v         v
[Firmado]  [Vencido]
```

#### Validaciones

- La fecha de vencimiento debe ser posterior a la fecha de firma
- El archivo adjunto debe ser PDF (validar por tipo MIME, no solo por extensión)
- El nombre del firmante del lado del cliente es obligatorio al marcar como Firmado

#### Casos borde

- **Contrato enviado sin respuesta:** si el contrato lleva más de 15 días en estado Enviado sin pasar a Firmado, el sistema debe generar una alerta para el analista responsable del cliente.
- **Reemplazo de PDF:** si se reemplaza el PDF de un contrato en estado Enviado, el sistema debe registrar la versión anterior con fecha y usuario que la reemplazó.
- **Cliente rechazado con contrato activo:** si un cliente pasa a estado Rechazado y tiene un contrato en estado Enviado o Pendiente, el contrato debe pasar automáticamente a Vencido y registrarse en el audit log.

---

### RF-10 | Casos de Investigación

#### Reglas de negocio

| ID | Regla |
|----|-------|
| RN-10-01 | Un cliente puede tener múltiples casos de investigación simultáneos. |
| RN-10-02 | Un caso con urgencia Crítica debe notificar automáticamente al Nivel 1 al momento de su apertura. |
| RN-10-03 | Solo el Nivel 1 puede cambiar la urgencia de un caso a Crítico una vez abierto. |
| RN-10-04 | Si la resolución del cierre es "Derivado a ROS", el ROS vinculado debe existir en el sistema antes de poder cerrar el caso. No puede dejarse como referencia pendiente. |
| RN-10-05 | Un caso no puede cerrarse si tiene evidencia cargada en las últimas 24hs sin una justificación explícita de que fue revisada. |
| RN-10-06 | Los casos en estado Escalado deben aparecer siempre en la parte superior del listado y en el dashboard, independientemente de los filtros aplicados. |

#### Flujo de estados del caso

```
[Abierto]
    |
    v
[En Investigación]
    |
    v
[Escalado] ──────────────────────────────────┐
    |                                        |
    v                                        v
[Cerrado — Descartado]            [Cerrado — Derivado a ROS]
[Cerrado — Archivado]
```

#### Validaciones

- La descripción inicial del caso debe tener al menos 50 caracteres
- Los archivos de evidencia admitidos: PDF, JPG, PNG, MP4 (videos de hasta 50MB)
- El campo de justificación de cierre debe tener al menos 100 caracteres
- Si la resolución es "Derivado a ROS", el campo de ROS vinculado es obligatorio

#### Casos borde

- **Alerta origen cerrada:** si la alerta que originó el caso es cerrada por otro analista mientras el caso está abierto, el caso debe mantenerse abierto y el sistema debe notificar al analista responsable.
- **Cliente aprobado con caso abierto:** si un cliente pasa a estado Aprobado pero tiene un caso en estado Escalado, el sistema debe mostrar una advertencia al Nivel 1 antes de confirmar la aprobación.
- **Caso sin actividad:** si un caso lleva más de 7 días en estado Abierto o En Investigación sin actualizaciones, el sistema debe generar una alerta para el analista responsable y para el Nivel 1.

---

### RF-11 | Audit Log

#### Reglas de negocio

| ID | Regla |
|----|-------|
| RN-11-01 | El audit log es de solo escritura. Ningún usuario, incluyendo el Nivel 1, puede editar o eliminar registros. |
| RN-11-02 | La retención mínima de registros es de 5 años, en cumplimiento con los requerimientos de la UIF. |
| RN-11-03 | El audit log debe continuar funcionando aunque otras partes del sistema fallen. Su escritura tiene prioridad máxima. |
| RN-11-04 | Toda exportación del audit log queda registrada en el propio log (quién exportó, qué filtros aplicó, fecha y hora). |

#### Eventos que deben registrarse obligatoriamente

| Categoría | Eventos |
|-----------|---------|
| Sesiones | Login exitoso, logout, intento de login fallido, sesión expirada por inactividad |
| Clientes | Creación, edición de datos, cambio de estado, asignación de responsable |
| Documentos | Carga, reemplazo, aprobación, rechazo |
| DDS | Inicio, guardado como borrador, cambio de estado, aprobación, rechazo |
| Contratos | Creación, cambio de estado, carga de PDF, reemplazo de PDF, firma registrada |
| Screening | Ejecución, resultado, marcado como falso positivo |
| Alertas | Generación automática, desestimación, escalado a caso |
| Operaciones inusuales | Creación, cambio de estado, adjunto de evidencia |
| Casos de investigación | Apertura, cambio de estado, actualización, cierre, vinculación a ROS |
| ROS | Creación, cambio de estado, marcado como enviado |
| Usuarios | Creación, edición, cambio de nivel, desactivación, reenvío de credenciales |
| Configuración | Cambio en matriz de riesgo, cambio en umbrales de alertas |
| Audit log | Consulta con filtros, exportación a CSV |

#### Validaciones

- Cada entrada del log debe generarse en el momento exacto de la acción, no de forma diferida
- El log debe incluir el valor anterior y el valor nuevo en todo cambio de campo o estado
- Si una acción falla (ej. el usuario intenta aprobar sin permisos), el intento fallido también debe registrarse

#### Casos borde

- **Pérdida de conexión durante una acción:** si el sistema pierde conexión antes de confirmar una acción, el log debe registrar el intento como "Inconcluso" con la información disponible hasta ese momento.
- **Exportación de volumen alto:** si el rango de fechas seleccionado supera los 10.000 registros, el sistema debe advertir al usuario y ofrecer la exportación de forma asincrónica (notificación cuando esté lista), en lugar de bloquear la pantalla.

---

## Fuera de Alcance (Out of Scope)

- **Integración automática con sistemas de la UIF para envío de ROS** — Requiere habilitación formal como sujeto obligado ante la UIF. Se evaluará en una segunda fase.
- **Integración con APIs externas de screening en tiempo real** (Refinitiv, LexisNexis) — El costo y la integración técnica quedan fuera del alcance inicial. La primera versión usará listas descargadas localmente.
- **Portal de autogestión para clientes** — El onboarding de la primera versión es 100% operado por el equipo de Compliance. El portal de cliente se evaluará en V2.
- **Integración con el core transaccional de deCampoPagos** — El monitoreo de operaciones en V1 es manual (carga de operaciones por el analista). La ingesta automática desde el sistema de pagos se planificará en V2.
- **Firma digital de contratos con validez legal** (firma electrónica avanzada) — V1 registra el estado del contrato. La firma electrónica certificada queda para una fase posterior.
- **Aplicación mobile** — El sistema es exclusivamente web en V1. El equipo de Compliance opera desde desktop.

---

## Riesgos

### Regulatorios
- **Los requerimientos de la UIF o el BCRA pueden actualizarse durante el desarrollo**
  Mitigación: Mantener contacto activo con el área Legal. El sistema debe ser lo suficientemente flexible para incorporar nuevos campos o documentos requeridos sin rediseño.

- **Los documentos requeridos difieren entre tipos de clientes y pueden ser ambiguos**
  Mitigación: Validar el checklist de documentación requerida con el equipo Legal antes del desarrollo del módulo de documentos.

### Técnicos
- **El frontend en DEMO_MODE tiene lógica que asume localStorage; la migración al backend real puede introducir inconsistencias**
  Mitigación: Definir contrato de API claro antes de conectar frontend y backend. Priorizar las pantallas más críticas (alta de clientes, revisión de legajo) para la primera integración.

- **La migración de SQLite a PostgreSQL puede revelar problemas en las migraciones o modelos**
  Mitigación: Ejecutar la migración en un entorno de staging antes de producción.

### De Adopción
- **El equipo de Compliance puede resistir el cambio si el sistema es más lento que el proceso manual actual**
  Mitigación: Involucrar al equipo de Compliance en las revisiones de UX. Priorizar velocidad y claridad en los flujos más frecuentes (revisión de legajos, cambio de estado).

### De Timeline
- **La definición del checklist de documentación por tipo de cliente puede demorar si depende de Legal**
  Mitigación: Usar una versión provisional del checklist para comenzar el desarrollo, con capacidad de configuración posterior.

- **El hosting y dominio en producción puede requerir aprobaciones internas**
  Mitigación: Iniciar el proceso de aprobación y provisión de infraestructura en paralelo con el desarrollo.

### De Integración con App del Cliente
- **El formato del objeto cliente enviado por la app puede no incluir `4iDocumentDataExtraction` o tener campos nulos/inválidos**
  Mitigación: El sistema debe tratar todos los campos de 4i como opcionales y hacer fallback a entrada manual. Nunca bloquear el flujo si 4i no entrega datos. Validar el campo `DateOfBirth` — 4i devuelve `01/01/0001` como valor inválido cuando no pudo leer la fecha.

- **El schema de la app del cliente puede no estar alineado con el schema del sistema de compliance**
  Mitigación: Definir un contrato de API documentado entre ambos sistemas antes de conectarlos. Validar con un cliente de prueba end-to-end.

- **La app del cliente puede enviar personas vinculadas sin datos de 4i (escaneado manual o carga de texto)**
  Mitigación: El sistema debe funcionar correctamente con y sin datos de 4i. El prefill es una mejora de UX, no un requerimiento bloqueante.

### De Decisión (Compliance)
- **Permitir "Aprobar con observaciones" puede usarse para aprobar clientes con documentación incompleta de forma sistemática**
  Mitigación: El audit log debe registrar explícitamente cuántos y cuáles documentos estaban pendientes al momento de la aprobación. El Oficial de Cumplimiento debe firmar la decisión con justificación. Los reportes internos deben incluir el porcentaje de aprobaciones con observaciones.

---

## Dependencias

| Dependencia | Estado | Impacto si no está lista |
|-------------|--------|--------------------------|
| Definición final del checklist documental (con Legal) | Pendiente | Bloquea desarrollo del módulo de documentos |
| Cuenta en Supabase / Neon (PostgreSQL en la nube) | Pendiente | Bloquea despliegue a producción |
| Hosting backend (Railway / Render) | Pendiente | Bloquea despliegue a producción |
| Hosting frontend (Vercel / Netlify) | Pendiente | Bloquea despliegue a producción |
| Definición de roles y permisos por parte de Compliance Manager | Resuelto — 3 niveles definidos (Oficial de Cumplimiento, Administrativo, Solo lectura) | - |
| Listas de sanciones para screening (OFAC, ONU, BCRA) | Pendiente | Bloquea módulo de screening |
| Contrato de API con app del cliente (schema del objeto cliente + formato de `4iDocumentDataExtraction`) | Pendiente | Bloquea prefill de personas desde 4i |
| Definición de campos mínimos que la app del cliente envía por persona vinculada | Pendiente | Bloquea mapeo de datos de personas al onboarding interno |

---

## Tracking / Eventos

> El sistema es una herramienta interna de backoffice. Los eventos de tracking se orientan a medir el uso del equipo de Compliance y la eficiencia de los flujos, no a medir conversión de usuarios externos.

| Evento | Dónde | Event Category | Event Action | Event Name | Negocio | Producto | Placement |
|--------|-------|----------------|--------------|------------|---------|----------|-----------|
| Alta de cliente iniciada | Formulario de nuevo cliente | Interacción | NuevoCliente | Iniciar alta de cliente | dCP | Compliance | CTA General |
| Alta de cliente completada | Formulario de nuevo cliente | Interacción | ClienteCreado | Completar alta de cliente | dCP | Compliance | CTA General |
| Documento cargado | Detalle de cliente - tab Documentos | Interacción | DocumentoCargado | Cargar documento | dCP | Compliance | CTA Particular |
| Documento aprobado | Detalle de cliente - tab Documentos | Interacción | DocumentoAprobado | Aprobar documento | dCP | Compliance | CTA Particular |
| Documento rechazado | Detalle de cliente - tab Documentos | Interacción | DocumentoRechazado | Rechazar documento | dCP | Compliance | CTA Particular |
| Cliente aprobado | Detalle de cliente | Interacción | ClienteAprobado | Aprobar cliente | dCP | Compliance | CTA General |
| Cliente rechazado | Detalle de cliente | Interacción | ClienteRechazado | Rechazar cliente | dCP | Compliance | CTA General |
| Screening ejecutado | Detalle de cliente | Interacción | ScreeningEjecutado | Ejecutar screening | dCP | Compliance | CTA Particular |
| Alerta generada | Dashboard / Lista de alertas | Navegación | AlertaGenerada | Nueva alerta automática | dCP | Compliance | - |
| Operación inusual creada | Formulario operación inusual | Interacción | OperacionInusualCreada | Crear operación inusual | dCP | Compliance | CTA General |
| ROS creado | Formulario ROS | Interacción | ROSCreado | Crear ROS | dCP | Compliance | CTA General |
| ROS marcado como enviado | Detalle ROS | Interacción | ROSEnviado | Marcar ROS como enviado | dCP | Compliance | CTA Particular |
| Usuario creado | Gestión de usuarios | Interacción | UsuarioCreado | Crear usuario del sistema | dCP | Compliance | CTA General |
| Usuario desactivado | Gestión de usuarios | Interacción | UsuarioDesactivado | Desactivar usuario | dCP | Compliance | CTA Particular |
| DDS iniciado | Detalle de cliente - DDS | Interacción | DDSIniciado | Iniciar due diligence | dCP | Compliance | CTA General |
| DDS aprobado | Detalle de cliente - DDS | Interacción | DDSAprobado | Aprobar due diligence | dCP | Compliance | CTA General |
| DDS rechazado | Detalle de cliente - DDS | Interacción | DDSRechazado | Rechazar due diligence | dCP | Compliance | CTA General |
| Contrato cargado | Detalle de cliente - Contratos | Interacción | ContratoCargado | Cargar contrato | dCP | Compliance | CTA Particular |
| Contrato firmado | Detalle de cliente - Contratos | Interacción | ContratoFirmado | Marcar contrato como firmado | dCP | Compliance | CTA Particular |
| Caso de investigación abierto | Lista de casos | Interacción | CasoAbierto | Abrir caso de investigación | dCP | Compliance | CTA General |
| Caso de investigación cerrado | Detalle de caso | Interacción | CasoCerrado | Cerrar caso de investigación | dCP | Compliance | CTA General |
| Audit log exportado | Vista audit log | Interacción | AuditLogExportado | Exportar audit log | dCP | Compliance | CTA General |
| Cliente aprobado con observaciones | Revisión de legajo | Interacción | ClienteAprobadoConObservaciones | Aprobar cliente con docs pendientes | dCP | Compliance | CTA General |
| Solicitud de info enviada | Revisión de legajo | Interacción | InfoSolicitada | Solicitar información al cliente | dCP | Compliance | CTA Particular |
| Datos de persona pre-cargados desde 4i | Formulario de personas | Sistema | DatosPersonaPrecargados4i | Prefill desde extracción 4i | dCP | Compliance | Automático |
| Persona con datos 4i editada manualmente | Formulario de personas | Interacción | DatosPersonaEditadosManualmente | Editar datos prefillados de 4i | dCP | Compliance | CTA Particular |
| Documento re-rechazado (estaba aprobado) | Onboarding — Revisión Docs. | Interacción | DocumentoReRechazado | Re-rechazar documento aprobado | dCP | Compliance | CTA Particular |
| Volver a Revisión de Docs. desde Datos Entidad | Onboarding paso 2 | Navegación | VolverARevisionDocs | Volver al paso anterior en onboarding | dCP | Compliance | CTA Particular |

---

## Agenda / Plan de Desarrollo

| Instancia | Status | Fecha | Notas |
|-----------|--------|-------|-------|
| Kickoff + alineación con Compliance y Legal | | | Validar checklist documental y roles |
| Diseño UX — flujos principales (alta, revisión, DDS, operaciones) | | | Priorizar mobile-last (backoffice desktop) |
| Iteración UX con equipo de Compliance | | | |
| Desarrollo — Módulo 1: Gestión de Clientes + Documentos | | | Backend ya parcialmente desarrollado |
| Desarrollo — Módulo 2 y 3: Riesgo + Screening | | | |
| Desarrollo — Módulo 4: Monitoreo de Operaciones | | | |
| Desarrollo — Módulo 5: Reportes (ROS + dashboard) | | | |
| Desarrollo — Módulo 6: Infraestructura + Auth + Migración BD | | | SQLite → PostgreSQL (Supabase) |
| Desarrollo — Módulo 7: Gestión de Usuarios | | | |
| Desarrollo — Módulo 8: Due Diligence (DDS) | | | |
| Desarrollo — Módulo 9: Contratos | | | |
| Desarrollo — Módulo 10 y 11: Casos de Investigación + Audit Log | | | |
| Integración frontend ↔ backend (eliminar DEMO_MODE) | | | Empezar por alta y revisión de clientes |
| Deploy a producción (Vercel + Railway) | | | |
| UAT con equipo de Compliance | | | |
| Salida a PROD | | | |
