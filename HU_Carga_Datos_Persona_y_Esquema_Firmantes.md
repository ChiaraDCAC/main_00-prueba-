# Paso 2 — Carga de datos de personas

> Estas dos historias reemplazan la HU única que mezclaba datos de la persona con el esquema de firma.
> **HU-A** carga los datos de la persona. **HU-B** configura el esquema de firma. Son independientes y se ejecutan en ese orden.
> Redactadas en modo imperativo y con reglas condicionales (si A, entonces B), según lo acordado con Mari.

---

## HU-A — Cargar los datos de una persona vinculada

**Épica:** Paso 2 — Carga de datos de sociedad y personas.
**Depende de:** selección/creación de la persona en el directorio DCAC.
**Habilita:** HU-B (esquema de firmantes) y el cálculo de riesgo PEP/REPET del Paso 3.

**Como** administrador,
**quiero** cargar los datos personales, de contacto, de rol y los flags regulatorios de cada persona vinculada a la entidad,
**para** dejar registrada de forma auditable la información de la persona, sin definir todavía su capacidad de firma.

### Reglas generales

- El administrador selecciona personas existentes del directorio DCAC o crea nuevas.
- Cuando la persona proviene del directorio, los campos `apellido`, `nombre`, `email` y `telefono` se precargan desde el sistema y quedan marcados como “campo del sistema”.
- Una persona puede tener **uno o más roles** a la vez (los roles son checkboxes, no excluyentes).
- Esta HU **no** configura tipo de firma, alcance ni monto. Esa configuración se realiza en HU-B.

### Campos comunes (toda persona)

| Campo | Tipo | Requerido | Reglas |
|---|---|---|---|
| apellido | texto | Sí | Precargado si viene del directorio |
| nombre | texto | Sí | Precargado si viene del directorio |
| numero_documento (DNI) | texto | Sí | — |
| cuit | texto | Sí | — |
| email | texto | Sí | Precargado si viene del directorio |
| telefono | texto | Sí | Precargado si viene del directorio |
| domicilio_calle | texto | Sí | — |
| domicilio_altura | texto | Sí | — |
| domicilio_piso | texto | No | — |
| domicilio_localidad | texto | Sí | — |
| domicilio_provincia | texto | Sí | — |

### Roles (checkbox, no excluyentes)

`es_beneficiario_final`, `es_presidente`, `es_gerente`, `es_director`, `es_apoderado`, `es_accionista`, `es_socio_srl`, `es_socio_sh`, `es_heredero`, `es_administrador`.

Regla: **SI** `es_presidente = true`, **ENTONCES** el sistema verifica que no exista otro presidente en la entidad; si ya existe, bloquea la asignación y avisa “Solo puede haber un Presidente por entidad”.

### Campos condicionales por rol

- **SI** `es_accionista = true` **ENTONCES** pedir `porcentaje` (% de participación).
- **SI** `es_socio_sh = true` **ENTONCES** pedir `sh_porcentaje`, `sh_cargo_rol` (Socio | Socio Administrador | Socio Gerente | Otro) y `sh_firma_presente` (Sí | No).
  - **SI** `sh_cargo_rol = Otro` **ENTONCES** pedir `sh_cargo_otro` (texto libre).
- **SI** `es_apoderado = true` **ENTONCES** pedir los datos del poder: `fecha_otorgamiento` e `indica_fin_poder` (Sí | No).
  - **SI** `indica_fin_poder = Sí` **ENTONCES** pedir `fecha_vencimiento_poder`.
- **SI** `es_heredero = true` **ENTONCES** pedir `vinculo_causante` y `acepto_cargo`.
- **SI** `es_administrador = true` **ENTONCES** pedir `tipo_administrador` y `acepto_cargo`.

### Flags regulatorios y screening (toda persona, sea o no firmante)

- `figura_en_repet` (Sí | No) y `repet_notas` (texto, opcional).
- `es_pep` (Sí | No).
- Screening automático contra listas: **OFAC**, **ONU Sanciones**, **GAFI**, **UIF Argentina**. Por cada lista se guarda estado (`sin_coincidencias` | `coincidencia`), fecha y detalle.

### Criterios de aceptación (HU-A)

1. El administrador puede crear una persona nueva o seleccionar una del directorio DCAC.
2. Los campos comunes obligatorios deben estar completos para poder avanzar.
3. Los campos condicionales aparecen solo cuando el rol que los exige está activo.
4. REPET, PEP y screening se cargan para toda persona, tenga o no rol de firmante.
5. La HU finaliza con la persona guardada; el esquema de firma queda pendiente y se resuelve en HU-B.

---

## HU-B — Definir el esquema de firma de cada persona

**Épica:** Paso 2 — Carga de datos de sociedad y personas.
**Depende de:** HU-A (datos de la persona ya cargados).
**Habilita:** el contrato de adhesión (PJ) y el cálculo de firmantes obligatorios.

**Como** administrador,
**quiero** definir, según el rol de cada persona, el tipo de firma, el alcance, el monto y —si la firma es conjunta— el esquema de participantes,
**para** dejar registrada de forma auditable la capacidad de obligar a la entidad frente a terceros.

### Regla central

El esquema de firma se determina a partir del **rol**. **Solo el Presidente y el Apoderado firman**; el resto de los roles (Gerente, Director, Socio, Accionista, Heredero, Beneficiario Final) **no** tienen configuración de firma.

### Lógica condicional

**1) SI el rol = Presidente:**
- `tipo_firma = Individual` (fijo, no editable).
- `alcance = General` (fijo, no editable).
- No se configura monto. (En la UI ambos campos se muestran deshabilitados con la leyenda “El presidente siempre firma en forma individual con alcance general”.)

**2) SI el rol = Apoderado:**
- `tipo_firma` es seleccionable: **Individual** | **Conjunta**. Por defecto Individual.

  **2.a) SI `tipo_firma = Individual`:**
  - Configurar únicamente `alcance` ∈ { General | Crédito | Pagos | Alta CVU }.

  **2.b) SI `tipo_firma = Conjunta`:**
  - Definir `minimo_firmantes` (1 a 5; por defecto 2).
  - Configurar la **propia** participación del apoderado: `obligatorio` (Sí | No, por defecto Sí), `alcance` ∈ { General | Crédito | Pagos | Alta CVU } y `monto` (ver tabla de monto).
  - Seleccionar los **participantes** del esquema entre las personas de la sociedad y el directorio DCAC (no puede seleccionarse a sí mismo). Por cada participante seleccionado configurar: `obligatorio` (Sí | No), `alcance` y `monto`.
  - Al guardar, el sistema **propaga** el esquema una sola vez a todas las personas participantes: les fija `tipo_firma = Conjunta`, el mismo `minimo_firmantes` y la lista de participantes, y marca el esquema como propagado.
  - Un esquema propagado se muestra en modo lectura; el administrador puede elegir “Editar este esquema” para ajustarlo de forma independiente en una persona.

**3) SI la entidad es Monotributista:**
- No se muestra el esquema de firma: la firma es siempre `Individual` + `alcance = General`.

### Tabla de monto autorizado (`monto`)

| Opción | Campos que pide | Lectura |
|---|---|---|
| Sin monto | — | (sin límite) |
| Mínimo | monto_min | “Desde $X” |
| Máximo | monto_max | “Hasta $X” |
| Rango | monto_min y monto_max | “$X – $Y” |

### Criterios de aceptación (HU-B)

1. Solo se muestra configuración de firma cuando el rol es Presidente o Apoderado.
2. Presidente queda con Individual + General fijos y no editables.
3. Apoderado puede elegir Individual o Conjunta.
4. En firma Conjunta es obligatorio definir el mínimo de firmantes y al menos un participante.
5. Cada participante (incluido el apoderado) tiene obligatorio/optativo, alcance y monto.
6. Al propagar, todas las personas del grupo quedan con el mismo esquema; cada una puede editarse de forma independiente.
7. Monotributista no expone configuración: firma Individual + General por defecto.

### Valores de referencia

- **alcance:** General | Crédito | Pagos | Alta CVU
- **tipo_firma:** Individual | Conjunta
- **monto:** Sin monto | Mínimo (desde) | Máximo (hasta) | Rango (desde–hasta)

---

## Qué quedó en cada HU (separación)

- **HU-A (carga de datos):** identidad, contacto, domicilio, roles, datos condicionales por rol (poder, % participación, vínculo, etc.) y flags regulatorios (REPET, PEP, screening).
- **HU-B (esquema de firma):** tipo de firma, alcance, monto, mínimo de firmantes, selección de participantes, obligatoriedad y propagación.
- **Dependencia:** HU-B no puede ejecutarse hasta que la persona esté cargada en HU-A.
