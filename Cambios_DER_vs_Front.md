# Cambios al DER para que refleje el front actual

> Base: DER v4.1 (chiaradcac.github.io) vs front real (`ClientOnboarding.jsx` + `config/documentRequirements.js`).
> Regla: el DER debe tener lo mismo que hoy pide el front. `ClientDataForm.jsx` es código muerto (no se usa) → ignorar.
> **No se modela screening OFAC / ONU / GAFI / UIF.** El único flag de riesgo de listas es **REPET (Sí/No)**.

---

## 1. Esquema de firma — Alcance: agregar "Alta CVU"

El front ofrece 4 alcances: **General / Crédito / Pagos / Alta CVU**. El DER solo tiene 3.

**Modificar `APODERADOS.alcance`:**
```
OPCIONES alcance "General / Credito / Pagos / Alta CVU"
```

**Modificar `FIRMA_CONJUNTA_ESQUEMAS.alcance_participante`:**
```
OPCIONES alcance_participante "General / Credito / Pagos / Alta CVU"
```

---

## 2. Esquema de firma conjunta — agregar monto por participante

En el front, cada participante de una firma conjunta tiene monto: **Sin monto / Mínimo / Máximo / Rango** (con valores desde/hasta). `FIRMA_CONJUNTA_ESQUEMAS` no lo tiene.

**`FIRMA_CONJUNTA_ESQUEMAS` queda así:**
```
FIRMA_CONJUNTA_ESQUEMAS {
    UUID uuid PK
    ID id_apoderado_origen FK
    UUID participante_uuid FK
    BOOLEANO es_optativo
    OPCIONES alcance_participante "General / Credito / Pagos / Alta CVU"
    OPCIONES monto_tipo "sin / minimo / maximo / rango"
    DECIMAL monto_desde
    DECIMAL monto_hasta
    ENTERO min_firmantes
}
```

---

## 3. APODERADOS — agregar monto, caducidad y facultades

El front del apoderado carga: ¿indica fecha de caducidad? (Sí/No), facultades, y —en su propia config de firma conjunta— monto.

**`APODERADOS` queda así:**
```
APODERADOS {
    ID id PK
    ID id_usuario_sociedad_tag FK
    OPCIONES tipo_firma "Individual / Conjunta"
    OPCIONES alcance "General / Credito / Pagos / Alta CVU"
    OPCIONES monto_tipo "sin / minimo / maximo / rango"
    DECIMAL monto_desde
    DECIMAL monto_hasta
    FECHA fecha_otorgamiento
    BOOLEANO indica_fin_poder
    FECHA fecha_vencimiento_poder
    TEXTOLARGO facultades
    BOOLEANO activo
}
```
Nota: `fecha_vencimiento_poder` solo aplica si `indica_fin_poder = true`.

---

## 4. USUARIOS_SOCIEDAD — limpiar campos legacy

Estos campos quedaron duplicados: ahora la firma/rol vive en las tablas dedicadas (`APODERADOS`, `AUTORIDADES`, `FIRMA_CONJUNTA_ESQUEMAS`, etc.). Además `alcance_actos` tiene valores que el front ya no usa (*compras*, *bancos*).

**Quitar de `USUARIOS_SOCIEDAD`:**
```
OPCIONES cargo_societario ...
JSON alcance_actos ...
OPCIONES limite_tipo ...
DECIMAL limite_monto_hasta
DECIMAL limite_monto_desde
OPCIONES tipo_firma ...
TEXTOLARGO tipo_firma_casos
```

**`USUARIOS_SOCIEDAD` queda así:**
```
USUARIOS_SOCIEDAD {
    UUID id PK "GET si existe / POST si nuevo"
    TEXTO apellido "GET"
    TEXTO nombre "GET"
    TEXTO nro_documento
    TEXTO cuit
    TEXTO correo_electronico "GET"
    TEXTO telefono "GET"
    TEXTO domicilio_calle
    TEXTO domicilio_altura
    TEXTO domicilio_piso "opcional"
    TEXTO domicilio_localidad
    TEXTO domicilio_provincia
    BOOLEANO es_pep
    BOOLEANO figura_en_repet
    BOOLEANO activo
    FECHAHORA fecha_creacion
    FECHAHORA fecha_actualizacion
}
```
(Se conservan `es_pep` y `figura_en_repet` — el REPET Sí/No. No se agrega screening de listas ni notas.)

---

## 5. Persona Humana — NO lleva documentos: pasa a datos generales

Cambio de fondo: para Persona Humana (Monotributista y Responsable Inscripto) **ya no se pide ningún documento**. La data llega vía 4i y se completa/confirma como **datos generales del titular**, no como formularios de documento.

**5.a — Eliminar del DER todo el modelo documental de PF:**
```
FORM_DNI_FRENTE        (eliminar)
FORM_DNI_DORSO         (eliminar)
FORM_DDJJ_PEP_MONOTRIBUTO   (eliminar)
```
Y eliminar la sección **"Campos por Documento — Monotributista"** completa (PF no tiene `DOCUMENTOS_CLIENTE` / `DOCUMENTOS_VERSIONES`).

**5.b — Agregar una tabla de datos generales de la Persona Humana.**
Contiene lo que hoy pide el front en "Datos del Titular" + NSE + flags. NSE es un **campo más** acá (solo se completa para PH), no una tabla aparte.
```
DATOS_PERSONA_HUMANA {
    ID id PK
    ID id_sociedad FK
    TEXTO apellido
    TEXTO nombre
    TEXTO nro_documento
    TEXTO cuit_cuil
    OPCIONES sexo "F / M / X"
    TEXTO nacionalidad
    FECHA fecha_nacimiento
    TEXTO domicilio
    OPCIONES nse_nivel "ABC1 / C2 / C3 / D1 / D2 / E"
    TEXTOLARGO nse_notas
    BOOLEANO es_pep
    BOOLEANO figura_en_repet
    FECHAHORA fecha_creacion
    FECHAHORA fecha_actualizacion
}
SOCIEDADES_TAG ||--o| DATOS_PERSONA_HUMANA : "datos del titular (PF)"
```
Notas: ya no se piden ejemplar, nro de trámite, fecha de emisión/vencimiento ni "vigente". El PEP de PF es el flag `es_pep` (sin DDJJ documental); el REPET es `figura_en_repet` (Sí/No).

---

## 6. Agregar Responsable Inscripto como tipo de entidad

El front maneja `RESPONSABLE_INSCRIPTO` como PF (mismo flujo que monotributista). El DER no lo tiene.

**Modificar `DOCUMENTOS_CLIENTE.tipo_entidad`:**
```
OPCIONES tipo_entidad "SA / SRL / SH / sucesion / monotributista / responsable_inscripto"
```
(Aclaración: para monotributista y responsable_inscripto **no** habrá registros en `DOCUMENTOS_CLIENTE`; su data vive en `DATOS_PERSONA_HUMANA`.)

---

## 8. Sucesión — DNI de herederos y administrador vía 4i (no es documento)

El DNI del heredero y del administrador **lo trae 4i**, igual que en PH, así que **no se pide como documento cargado**. La sucesión sigue siendo documental para el resto (declaratoria, designación de administrador, solicitud AGJ, ficha de sucesión), pero el DNI no.

**8.a — Eliminar del DER:**
```
FORM_DNI_HEREDEROS   (eliminar — el DNI llega por 4i)
```
(Mantener `FORM_DECLARATORIA_HEREDEROS`, `FORM_DESIGNACION_ADMIN_JUDICIAL`, `FORM_SOLICITUD_AGJ`, `FORM_FICHA_SUCESION`.)

**8.b — Mover los atributos que no son del DNI a las tablas de rol.**
La identidad (apellido, nombre, DNI, sexo, nacionalidad, fecha nac., domicilio) llega por 4i a `USUARIOS_SOCIEDAD`. Lo específico de la sucesión va en `HEREDEROS`:
```
HEREDEROS {
    ID id PK
    ID id_usuario_sociedad_tag FK
    TEXTO vinculo_causante
    DECIMAL porcentaje
    BOOLEANO es_firmante
    BOOLEANO coincide_declaratoria
    BOOLEANO activo
}
```
(`es_firmante` y `coincide_declaratoria` venían de `FORM_DNI_HEREDEROS`.)

**8.c — Actualizar también el front:** en `config/documentRequirements.js`, `dni_herederos` sigue listado como documento obligatorio de la sucesión. Hay que sacarlo para que el front coincida con que el DNI viene por 4i.

---

## Decisiones de ubicación a confirmar con quien mantiene el DER

1. **Monto del apoderado:** lo puse en `APODERADOS` (su config individual) y en `FIRMA_CONJUNTA_ESQUEMAS` (por participante). Confirmar si el apoderado origen se modela como una fila más de `FIRMA_CONJUNTA_ESQUEMAS` o queda en `APODERADOS`.
2. **Datos PH:** modelé `DATOS_PERSONA_HUMANA` colgando 1:1 de `SOCIEDADES_TAG` (el cliente PF). Confirmar si prefieren ese vínculo u otro.
3. **DNI herederos/administrador (sucesión):** resuelto — viene por 4i, se elimina `FORM_DNI_HEREDEROS` (ver punto 8). Falta actualizar el front (`documentRequirements.js`).

## Lo que ya está bien (no tocar)

Tablas por rol (`BENEFICIARIOS_FINALES`, `ACCIONISTAS_SOCIOS`, `SOCIOS_SH`, `AUTORIDADES`, `HEREDEROS`, `ADMINISTRADOR_JUSTICIA`), `min_firmantes` y `es_optativo` en conjunta, y las reglas de firma de sucesión (`ficha_tipo_firma`, `dni_es_firmante`).
