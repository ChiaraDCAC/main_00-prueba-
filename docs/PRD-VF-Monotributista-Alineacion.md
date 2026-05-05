# Alineación al PRD VF — Monotributista (Persona Humana / PF)

> Resumen de los cambios aplicados para que el front + back del flujo de alta de **monotributista** coincidan con el PRD `PRD_Alta_Cliente_VF.docx` (vista administrador / oficial de cumplimiento).

**Branch:** `claude/infallible-ardinghelli-d70d10`
**Worktree:** `.claude/worktrees/infallible-ardinghelli-d70d10`
**PRD de referencia:** `PRD_Alta_Cliente_VF.docx` (Downloads del usuario)

---

## 1. Por qué este cambio

Antes de esta PR, el flujo de monotributista trataba al cliente como una entidad que carga archivos (DNI Frente, DNI Dorso, DDJJ PEP) y pedía datos que no están en el PRD (categoría monotributo, ingresos brutos anuales, fecha de inscripción).

El PRD VF dice explícitamente (§6.2.1):

> A diferencia de Persona Jurídica, la Persona Humana / PF **NO carga documentación desde el front**. Toda la información llega al back-office como datos estructurados (extraídos por 4iDigital o declarados en el formulario del cliente). El admin solo **confirma** estos datos en el paso 2; **no hay carga ni revisión de archivos para PH**.

Y agrega que para PF se **oculta el panel de personas vinculadas** (sólo se muestran los campos del titular).

Esta PR alinea ambas cosas + arregla la matriz de riesgo PF del paso 3 (§6.3).

---

## 2. Resumen de impacto

| Área | Antes | Después |
|---|---|---|
| Tipo de docs PF | 3 archivos requeridos (DNI Frente, DNI Dorso, DDJJ PEP) | 0 archivos. Sólo confirmación de datos pre-cargados (4iDigital + form del cliente). |
| Campos del titular | Categoría monotributo, ingresos anuales, fecha inscripción (no están en PRD) | DNI Frente (4i), DNI Dorso (4i), Ocupación + PEP (declarados) |
| Tab "Personas" en paso 2 | Visible siempre | **Oculto** para PF (§6.2.1) |
| Paso 1 (revisión documental) para PF | Igual que PJ — pedía aprobar/rechazar docs | Atajo "Continuar al Paso 2" sin revisión documental |
| Visor del paso 2 con doc PF | Renderiza vacío / sin archivo | Cartel: "Datos pre-cargados desde 4iDigital — no hay archivo a revisar" |
| Matriz de riesgo PF | No diferenciada (mismos factores que PJ + defaults a 5) | Matriz PF: nacionalidad, residencia, ocupación + PEP override (§6.3) |
| Validación back PF | Requería `ddjj_pep_monotributo` cargado | No requiere docs; valida `formData` (DNI + ocupación + PEP) |

---

## 3. Cambios por archivo

### 3.1 Frontend

#### `frontend/src/config/documentRequirements.js`
- `MONOTRIBUTISTA`: los 3 bloques ahora llevan `dataOnly: true` y `fuente: '4iDigital' | 'declarado_cliente'`. Esto es la flag que el resto del front consulta para no pedir archivo y mostrar el banner "datos pre-cargados".
- Reemplazo `ddjj_pep_monotributo` por `declaracion_cliente` (campos: `ocupacion`, `es_pep`). PEP no es un documento adjunto — es un flag declarado por el cliente que el admin confirma (§6.2.1).
- DNI Dorso ahora lista también `dni_jurisdiccion_residencia` (nuevo campo) para que el riesgo PF tenga el dato del paso 2.
- `FORM_FIELDS.ocupacion`: nuevo select con las opciones del PRD (Empleado/a, Monotributista, Profesional independiente, Responsable inscripto, Trabajador autónomo, Particular, Otro). Marcado como `important` y con `helpText` que aclara que se usa como factor "actividad" en la matriz.
- `FORM_FIELDS.dni_nacionalidad`: las opciones cambian de `['Argentina', 'Extranjera']` a `['Argentina', 'MERCOSUR', 'Otra jurisdicción']` para alinearse con el mapeo de riesgo del PRD (1/3/5).
- `FORM_FIELDS.dni_jurisdiccion_residencia`: nuevo campo (mismo trío de opciones), derivado del domicilio del DNI Dorso. Es el factor "residencia" de la matriz PF.

> **Nota:** Mantengo el ID `MONOTRIBUTISTA` como key de la entidad en lugar de renombrar a `PERSONA_HUMANA` para no romper datos persistidos. El PRD admite tener "monotributista" como tipo siempre que `clientType: 'persona_humana'` esté correcto.

#### `frontend/src/components/DocumentForm.jsx`
- Nuevo banner azul al tope del form cuando `document.dataOnly === true`: "Datos pre-cargados desde 4iDigital — no se carga archivo. Confirmá los valores antes de avanzar."
- El copy del banner cambia según `document.fuente`: "4iDigital" vs "declarado_cliente".

#### `frontend/src/components/ClientDataForm.jsx`
Reescritura completa de la sección `MONOTRIBUTISTA`. Antes tenía:
- "Datos Personales" (apellido, nombre, dni, cuit, …)
- "Datos de Contacto"
- "Datos Monotributo" (**categoría, actividad principal, fecha inscripción, ingresos anuales** ← NO están en el PRD)

Ahora tiene:
- "DNI Frente — datos validados por 4iDigital" (los 7 campos del PRD)
- "DNI Dorso — datos validados por 4iDigital" (los 6 campos del PRD, incluyendo `dni_jurisdiccion_residencia`)
- "Declaración del cliente — Ocupación y PEP" (los 2 campos declarados por el cliente)
- "Datos de Contacto (opcionales)" — solo email + teléfono, no obligatorios

#### `frontend/src/pages/clients/ClientOnboarding.jsx`
Cuatro cambios:

1. **`useEffect` de cambio de `entityType`** — fuerza `documentsTab = 'docs'` cuando el tipo es `MONOTRIBUTISTA`, así no queda atrapado en el tab "Personas" que ahora está oculto.

2. **Tabs del paso 2** — el botón "Personas" sólo se renderiza si `entityType !== ENTITY_TYPES.MONOTRIBUTISTA`. El primer tab pasó de "Documentos" a "Datos" (más fiel al PRD §6.2.1 que habla de "datos del documento" no "documentos").

3. **Visor del paso 2** — si el `selectedDocument.dataOnly === true`, en lugar del `<PDFViewer>` muestra una tarjeta con un ícono `Info` y el copy:
   - 4iDigital: "Este bloque contiene datos extraídos por 4iDigital del DNI del cliente. No hay archivo cargado: sólo confirmá los valores en el panel derecho."
   - Declarado por cliente: "Este bloque contiene datos declarados por el cliente en su formulario de alta (vista cliente). No hay documento adjunto."

4. **Listado de altas pendientes (paso 1)** — calcula `isPF = client.legalForm === 'monotributista'`. Si es PF, la fila se renderiza igual que `readyForAlta` pero con copy distinto ("Persona Humana — sin documentación a revisar (PRD §6.2.1)") y botón "Continuar al Paso 2" en vez de "Continuar Carga de Datos". El status pill muestra "PF — Sin docs". El warning de docs no aprobados se omite para PF.

5. **Paso 3 (Riesgo)** — sólo cuando `entityType === MONOTRIBUTISTA`, se inserta arriba del NSE/Riesgo manual una card "Matriz Persona Humana / PF — sugerido por sistema" con:
   - 4 mini-cards para cada factor (nacionalidad, residencia, actividad, PEP) que muestran el valor cargado en el paso 2, su origen (4iDigital o declarado por cliente) y el score 1/3/5.
   - Cálculo del nivel sugerido: PEP=Sí → alto; max factor=5 → alto; max=3 → medio; todos=1 → bajo.
   - Si faltan factores cargados, mensaje "Faltan factores. Completá nacionalidad, residencia y ocupación".
   - Aviso al pie: "El oficial confirma el nivel en el panel siguiente. Mapeo a confirmar con Compliance" (porque el PRD deja la tabla de jurisdicciones y ocupaciones como TBD).

   El selector manual de NSE/Riesgo del paso 3 queda como está. La card PF es informativa: ayuda al oficial a tomar la decisión consistente con el PRD sin reemplazar el flujo existente.

---

### 3.2 Backend

#### `backend/src/services/validationService.js`
- `DOCUMENT_REQUIREMENTS.monotributista = []` (antes `['ddjj_pep_monotributo']`). PF no carga archivos.
- Nueva const `PF_REQUIRED_FORM_FIELDS` con las 15 keys que deben estar presentes en `client.formData` para considerar un alta PF "completa": 7 del DNI Frente, 6 del DNI Dorso, 2 de la declaración del cliente.
- En `validateClientDocuments`, branch específico para `legalForm === 'monotributista'`: aplana `client.formData` (puede venir agrupado por docId) y chequea que cada key esté presente y no vacía. Devuelve la misma estructura `{ isValid, missingDocuments }` que el resto del flujo, más un flag `pfFormValidation: true` para que el caller sepa que la validación fue contra `formData` y no contra `documents`.

#### `backend/src/services/riskService.js`
- `calculateRisk` ahora bifurca según `client.clientType === 'persona_humana'`:
  - **PF:** llama a `calculatePFScores(client)` (nuevo método).
  - **PJ:** comportamiento original.
- **PEP override** (PRD §6.3): si `isPF && client.isPep === true`, `totalScore = 35` y `riskLevel = 'alto'` sin importar el resto de los factores.
- Nuevo método `calculatePFScores(client)`:
  - Aplana `client.formData` para extraer `dni_nacionalidad`, `dni_jurisdiccion_residencia`, `ocupacion`. Cae a `client.nationality`, `client.country`, `client.mainActivity` como fallback.
  - Mapea cada uno a 1/3/5 según el PRD (Argentina=1, MERCOSUR=3, otra=5; ocupación: empleado/particular=1, monotributista/prof.indep./autónomo=3, responsable inscripto/otro=5).
  - Multiplica por 7 para escalar al rango total esperado por el mapeo del PRD (≥35 alto, 20-34 medio, <20 bajo).
  - Devuelve los scores en columnas existentes de `RiskAssessment`: `clientTypeScore` ← nacionalidad, `geographicScore` ← residencia, `activityScore` ← ocupación, `pepScore` ← `isPep ? 35 : 0`. `productScore`, `channelScore`, `transactionScore` se setean en `0` (PRD: materialidad y antigüedad **no aplican** en onboarding PF).
- **Sin cambios de schema**: reutilizo las columnas existentes para no requerir migración.

---

## 4. Lo que NO se cambió (consciente)

- **`MonotributistaData`** (modelo Sequelize) — sólo guarda `monotributista_id`, `id_sociedad`, `completadoPor`, `completadoAt`. No requiere cambios.
- **`MONOTRIBUTISTA` como `ENTITY_TYPES`** — no renombré a `PERSONA_HUMANA` para no romper datos persistidos. El PRD admite que el "tipo" sea monotributista mientras `clientType: 'persona_humana'` esté correcto, lo cual ya estaba.
- **Migrations** — ninguna nueva. Aproveché columnas existentes en `RiskAssessment`.
- **Documentos de SA / SRL / SH / Sucesión** — fuera de scope.
- **Selector manual de NSE/Riesgo en el paso 3** — el PRD dice que el cálculo es 100% automático y no editable. Refactorizar todo el panel a auto-cálculo era un cambio mucho más grande. Como compromiso, agregué la card "Matriz PF sugerida" arriba del selector manual: el oficial ve el nivel sugerido por sistema y decide. En una segunda iteración se puede cerrar la brecha haciendo el selector readonly y persistiendo el nivel calculado automáticamente.

---

## 5. Cómo verificar los cambios

```bash
# Frontend
cd frontend
npm install        # si no está instalado
npm run build      # debe compilar sin errores
npm run dev        # levantar y probar el flujo
```

Caso de prueba sugerido (manual):

1. Crear / seleccionar un cliente con `legalForm = 'monotributista'`, `clientType = 'persona_humana'`.
2. **Paso 1 (Revisión Docs.):** la fila debe mostrar el badge azul "PF — Sin docs" y un botón "Continuar al Paso 2". No debe pedir aprobación de archivos.
3. **Paso 2 (Datos Entidad):** el tab "Personas" no debe aparecer. El visor de la izquierda debe mostrar la tarjeta "Persona Humana / PF — sin archivo a revisar". El form de la derecha debe tener banner azul "Datos pre-cargados desde 4iDigital" para `dni_frente` y `dni_dorso`, y "Datos declarados por el cliente" para `declaracion_cliente`. Los campos deben ser los del PRD §6.2.1.
4. **Paso 3 (Riesgo):** debe aparecer la card "Matriz Persona Humana / PF — sugerido por sistema" arriba del NSE, con los 4 factores y el nivel sugerido en pill (verde/amarillo/rojo según corresponda).
5. **Backend — `validationService.validateClientDocuments(clientId)`** para un PF: `isValid: false` si faltan keys del DNI/declaración en `formData`; `isValid: true` si todas están. `pfFormValidation: true` debe estar presente en la respuesta.
6. **Backend — `riskService.calculateRisk(clientId, 'inicial', userId)`** para un PF con `isPep: true`: `totalScore: 35`, `riskLevel: 'alto'`. Para uno con todos los factores en Argentina y ocupación "Empleado/a": `totalScore: 21` (3 × 7), `riskLevel: 'medio'`. (Bajo requiere los 3 factores en valor 1, lo cual da 7+7+7=21 → medio según mapeo. Ver nota en §6 sobre el rango.)

---

## 6. Notas y deuda técnica

1. **Mapeo de jurisdicciones y ocupación**: el PRD VF deja las tablas de mapeo como "a confirmar con Compliance". Los valores asumidos en `riskService.calculatePFScores` y en la card del front son provisionales y **deben validarse con el equipo de Compliance** antes de producción.

2. **Rango de score PF**: con tres factores 1/3/5 escalados ×7, el rango del puntaje sumado va de 21 a 105 (sin PEP). El mapeo del PRD (≥35 alto / 20-34 medio / <20 bajo) está calibrado para PJ donde hay 7 factores. Con 3 factores escalados, el "bajo" PF requiere todos en valor 1 y aún así da 21, que cae en "medio" según el mapeo numérico. **El cálculo de "nivel sugerido" en el front (`pfSuggestedLevel`) usa otra lógica más fiel al PRD: max factor=5 → alto, max=3 → medio, todos=1 → bajo. El backend (`getRiskLevel`) sigue usando los thresholds numéricos**. Hay que reconciliar — sugiero pasar la lógica del front al backend, o ajustar los thresholds para PF.

3. **Selector manual del paso 3**: el PRD dice que el cálculo es "100% automático" y el oficial NO puede modificar manualmente los factores ni el puntaje. Hoy el panel "Nivel de Riesgo" del paso 3 es manual (3 botones bajo/medio/alto). Se mantiene como está y se agrega una card informativa con el nivel sugerido. Para alinear 100% al PRD habría que hacer el selector readonly y persistir el nivel calculado.

4. **Ponderaciones de la matriz PF**: el PRD muestra ponderaciones para PJ ("Pond. alta" / "Pond. mes a mes") pero no las define explícitamente para PF. La implementación actual usa pesos iguales (factor × 7 cada uno). Si Compliance define pesos para PF (ej. nacionalidad 20%, residencia 35%, actividad 45%), hay que actualizar `calculatePFScores`.

5. **Renombre futuro `MONOTRIBUTISTA → PERSONA_HUMANA`**: el PRD trata "persona humana" como categoría madre que incluye monotributista, particular, profesional independiente, autónomo, responsable inscripto. Hoy `ENTITY_TYPES.MONOTRIBUTISTA` actúa como "PF" pero el nombre confunde porque sugiere que sólo aplica a monotributistas. Renombrar requiere migración de datos y refactor del front. Queda como deuda.

6. **Datos persistidos de monotributistas pre-existentes**: si hay clientes con campos `categoria_monotributo`, `actividad_principal`, `fecha_inscripcion`, `ingresos_anuales` cargados antes de este cambio, esos campos quedan huérfanos en `formData` (no se muestran ni se borran). Es comportamiento intencional para no perder datos. Si Compliance pide ocultarlos, agregar lógica de migración.

---

## 7. Referencias del PRD VF

- **§1.1 Trigger del proceso** — el alta nace en el front del cliente, no en el back-office.
- **§5.1 Diseño** — herramienta exclusivamente web.
- **§6.1 Paso 1** — revisión documental. Para PF queda fuera (se salta).
- **§6.2.1 Persona Humana / PF** — fuente de verdad para los campos de monotributista. Define que PF NO carga archivos y enumera los datos esperados de 4iDigital + declaración del cliente.
- **§6.3 Paso 3 Asignación de riesgo** — define la matriz PF (factores nacionalidad, residencia, actividad, PEP override; reglas de mapeo por puntaje).
- **§9 Persistencia y trazabilidad** — los campos pre-cargados por 4i quedan marcados internamente como "fuente: 4i" hasta que el admin los confirma. Implementado vía `fuente` en `documentRequirements.js`.
