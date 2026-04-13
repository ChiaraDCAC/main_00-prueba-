# PRD - Reportes Regulatorios (ARCA F.8126 / BCRA Base Padrón / UIF Apartados A-B-C)

| Campo | Valor |
|-------|-------|
| **Status** | En curso |
| **Author(s)** | Chiara Giralt |
| **Stakeholders** | Compliance, Legal, Finanzas, Tecnología, Dirección |
| **Team** | Dev: Lanfranco Bortolin, Jero Rech |
| **Last Updated** | Abril 2026 |

---

## Resumen Ejecutivo

Este PRD documenta el módulo de Reportes Regulatorios del sistema de Compliance de deCampoPagos. Como PSP (Proveedor de Servicios de Pago), la empresa debe presentar información periódica ante tres organismos: **ARCA** (F.8126 mensual, vía Web Services), **BCRA** (Base Padrón mensual, vía RUNOR) y **UIF** (Apartados A y B mensuales, Apartado C trimestral).

El módulo centraliza la generación, validación y envío de estos reportes desde la herramienta, eliminando la construcción manual de archivos y garantizando que la información enviada sea consistente con los datos del sistema. Para ARCA, el envío se realiza automáticamente vía WSM (Web Services ARCA). Para BCRA y UIF, el analista puede exportar el reporte en `.txt` y enviarlo manualmente desde la herramienta.

---

## Definición del Problema

### ¿Por qué?

**Problema del usuario (equipo de Compliance y Finanzas):**
Hoy los reportes regulatorios se construyen manualmente, extrayendo datos de distintas fuentes (planillas, sistemas, emails) y armando los archivos según los formatos exigidos por cada organismo. Esto genera:
- Alto riesgo de errores humanos en la construcción del archivo (campos mal formateados, datos inconsistentes, totales incorrectos).
- Tiempo operativo elevado cada cierre de mes.
- Falta de trazabilidad sobre qué versión fue enviada, cuándo y por quién.
- Dificultad para realizar rectificativas si se detecta un error post-envío.

**Problema del negocio:**
El incumplimiento en los plazos de presentación o la presentación de información errónea ante ARCA, BCRA o la UIF expone a deCampoPagos a sanciones regulatorias y al riesgo de revocación del certificado como PSP.

### ¿Para qué?

- **Para el equipo de Compliance**: Generar los reportes regulatorios directamente desde el sistema, con los datos ya validados, sin construcción manual de archivos.
- **Para el negocio**: Cumplir en tiempo y forma con las obligaciones de presentación ante ARCA, BCRA y UIF.
- **Para reducir el riesgo operativo**: Tener trazabilidad de cada presentación (versión, fecha de envío, usuario responsable) y poder generar rectificativas cuando sea necesario.

---

## Medición - KPIs y Resultados Esperados

### Métricas de Adopción
| Métrica | Baseline | Target | Cómo se mide |
|---------|----------|--------|--------------|
| % de presentaciones regulatorias generadas desde el sistema vs. de forma manual | 0% | 100% | Registros de presentación en BD |
| % de presentaciones enviadas dentro del plazo regulatorio | No medido | 100% | Fecha de envío vs. fecha límite por tipo de reporte |

### Métricas de Uso
| Métrica | Baseline | Target | Cómo se mide |
|---------|----------|--------|--------------|
| Tiempo de generación del reporte F.8126 (desde inicio hasta archivo listo) | No medido | < 30 min | Timestamps en BD |
| Cantidad de rectificativas por errores detectados post-envío | No medido | 0 por trimestre | Registros de secuencia > "00" en BD |

### Métricas de Negocio / Compliance
| Métrica | Baseline | Target | Cómo se mide |
|---------|----------|--------|--------------|
| Presentaciones vencidas (enviadas fuera del plazo) | No medido | 0 | Fecha de envío vs. fecha límite |
| Control de razonabilidad UIF Apartado B aprobado sin ajuste manual | No medido | 100% de los cierres | Flag validación en BD |

---

## Discovery

### Diagrama de Flujo — ARCA F.8126 (WSM)

```
[Cierre del mes]
       |
       v
[El analista inicia la generación del F.8126]
  Selecciona período (AAAAMM)
       |
       v
[El sistema construye el archivo automáticamente]
  - Registro 01: Cabecera
  - Registro 02: Cuentas (CVU/cuentas de pago)
  - Registro 03: Integrantes (titulares por cuenta)
  - Registro 04: Movimientos mensuales agregados
  - Registro 05: Detalle de transferencias (si aplica)
       |
       v
[Vista previa del archivo generado]
  El analista puede revisar registros
       |
   ¿Errores de validación?
   /              \
 [Sí]           [No]
   |               |
   v               v
[Detalle de      [Confirmar envío]
 errores a            |
 corregir]            v
                [Envío automático vía WSM a ARCA]
                      |
                  ¿Respuesta ARCA?
                  /           \
              [OK]          [Error]
                |               |
                v               v
        [Registro exitoso]  [Alerta + log]
        [en el sistema]    [para reintento]
```

### Diagrama de Flujo — BCRA Base Padrón (RUNOR)

```
[Durante el mes]
       |
       v
[El sistema registra novedades de clientes]
  Alta (10) / Baja (20) / Modificación (30)
  - Cambio condición PEP
  - Cambio código postal
       |
       v
[Al cierre del mes: generar reporte Base Padrón]
       |
       v
[El sistema consolida novedades del período]
  (Primera presentación: base completa de activos)
       |
       v
[Vista previa del reporte]
       |
       v
[Exportar a .txt]
       |
       v
[Analista envía manualmente al BCRA vía RUNOR]
       |
       v
[Registra la presentación en el sistema]
  (fecha de envío, usuario, período, estado)
```

### Diagrama de Flujo — UIF Apartados A / B / C

```
[Cierre del mes (o trimestre para Apartado C)]
       |
       v
[Analista selecciona tipo de apartado a generar]
  Apartado A / Apartado B / Apartado C
       |
       v
[El sistema consolida los datos del período]
  Apartado A: saldos de cuentas, fondos comunes, saldos a liquidar
  Apartado B: transacciones, transferencias, clientes, préstamos
  Apartado C: (generación de template para auditor externo)
       |
       v
[Control de razonabilidad automático]
  (solo Apartado B)
  Saldo nuevo = Saldo anterior + Créditos − Débitos
       |
   ¿Razonabilidad OK?
   /             \
 [No]           [Sí]
   |               |
   v               v
[Alerta con      [Vista previa del reporte]
 diferencia              |
 detectada]              v
                  [Exportar a .txt]
                         |
                         v
             [Analista envía al BCRA / UIF]
             (vía plataforma del organismo)
                         |
                         v
             [Registra la presentación en el sistema]
```

### Diseño
- **Web**: [Link a Figma — pendiente]

### Documentación Técnica
- PRD padre: `PRD-Sistema-Compliance.md`
- Documento fuente regulatorio: `agents/Reportes.pdf`
- Diagrama ER: `diagrama-er.html`
- Documentación WSM ARCA: [Link a documentación oficial ARCA — pendiente]
- Sistema RUNOR BCRA: [Link a documentación BCRA — pendiente]

---

## Requerimientos

---

### Módulo A: ARCA — F.8126

---

#### CU-01 — Generar archivo F.8126

| | |
|---|---|
| **Actor principal** | Analista de Compliance (Nivel 1 o Nivel 2) |
| **Precondiciones** | Sesión iniciada. Datos de cuentas, titulares y movimientos del período disponibles en BD. Tablas de códigos ARCA cargadas. |
| **Frecuencia** | Mensual (cierre de mes) |

**Flujo principal:**
1. El analista navega a `Reportes Regulatorios > ARCA F.8126`.
2. Selecciona el período a informar (AAAAMM) y confirma la generación.
3. El sistema construye el archivo con los 5 tipos de registros y muestra vista previa con conteo por tipo.
4. El analista revisa y presiona "Validar" (continúa en CU-02).
5. Sin errores, el botón "Enviar a ARCA (WSM)" se habilita.
6. El analista confirma el envío (continúa en CU-03).

**Flujo alternativo A — Rectificativa:**
- Si el período ya tiene una presentación exitosa, el sistema pregunta si se desea rectificar. Si se confirma, la secuencia se incrementa automáticamente (01, 02…).

**Flujo alternativo B — Errores de validación:**
- Si el paso 4 devuelve errores, el envío queda bloqueado. El analista corrige los datos y regenera.

---

**Requerimientos:**

- **RF-01.1** Generar Registro 01 (Cabecera, 1 línea, 261 caracteres):

  | Campo | Valor / Fuente |
  |-------|---------------|
  | Tipo de registro | `01` (fijo) |
  | CUIT informante | CUIT de deCampoPagos (configuración del sistema) |
  | Período informado | AAAAMM seleccionado |
  | Secuencia | `00` original; incremento automático para rectificativas |
  | Denominación | Razón social de deCampoPagos (configuración) |
  | Hora | Timestamp HHMMSS de generación |
  | Código de impuesto | `0103` (fijo) |
  | Código de concepto | `812` (fijo) |
  | Número de formulario | `8126` (fijo) |
  | Versión del aplicativo | `00200` (configurable sin deploy) |
  | Establecimiento | `00` (fijo) |
  | Cantidad total de líneas | Calculado al cerrar el archivo |
  | Cantidad de registros de detalle | Calculado al cerrar el archivo |

- **RF-01.2** Generar Registro 02 (Cuenta) por cada cuenta activa o con movimientos en el período:

  | Campo | Valor / Fuente |
  |-------|---------------|
  | Tipo de registro | `02` |
  | Tipo de cuenta | `01` billetera virtual / `02` otra |
  | Identificador de cuenta | CVU o ID interno |
  | Cantidad de integrantes | Conteo de registros 03 vinculados |
  | Fecha de alta | AAAAMMDD de creación |
  | Tipo de operación | `01` apertura / `02` cierre / `03` modificación / `04` sin modificación con movimientos |
  | Fecha del evento | AAAAMMDD |
  | Signo saldo ARS | `0` positivo / `1` negativo |
  | Saldo en pesos | Saldo al cierre del período, sin decimales |
  | Saldo moneda extranjera | Si aplica |
  | Saldo moneda digital | Si aplica (cripto) |
  | CVU | 22 dígitos (obligatorio si tipo cuenta = `01`) |

- **RF-01.3** Generar Registro 03 (Integrante) por cada persona asociada a cada cuenta:

  | Campo | Valor / Fuente |
  |-------|---------------|
  | Tipo de registro | `03` |
  | Tipo de documento | `80` CUIT / `86` CUIL / `96` DNI / según tabla ARCA |
  | Número de documento | Sin guiones |
  | NIF | Si aplica (no residente) |
  | Apellido y nombre / Denominación | Nombre completo o razón social |
  | Tipo de persona | `1` Persona Humana / `2` Persona Jurídica |
  | Residencia | `0` residente / `1` no residente |
  | País de residencia | Código según tabla (si no residente) |
  | Carácter | `1` Titular / `2` Cotitular / `3` Apoderado / `4` Rep. Legal / `5` Firmante |

- **RF-01.4** Generar Registros 04 (Movimientos mensuales) agrupados por: tipo de operación + tipo de movimiento + moneda:

  | Campo | Valor / Fuente |
  |-------|---------------|
  | Tipo de registro | `04` |
  | Tipo de operación | `01` Ingreso / `02` Egreso |
  | Tipo de movimiento | `01` Efectivo / `02` Transf. bancaria / `03` Transf. virtual |
  | Moneda original | `1` ARS / `2` USD / `14` Bitcoin / según tabla ARCA |
  | Monto mensual en moneda original | Suma total del grupo, sin decimales |
  | Monto mensual en pesos | Equivalente en ARS |

- **RF-01.5** Generar Registro 05 (Detalle de transferencias) solo cuando el tipo de movimiento del Registro 04 asociado sea `02` o `03`. No se genera para efectivo:

  | Campo | Valor / Fuente |
  |-------|---------------|
  | Tipo de registro | `05` |
  | CBU o CVU destino | 22 dígitos de la cuenta contraparte |
  | Monto en pesos | Importe individual, sin decimales |

- **RF-01.6** Mostrar vista previa con conteo de registros por tipo antes de habilitar el envío.
- **RF-01.7** El nombre del archivo debe seguir el formato definido por ARCA.

**Criterios de Aceptación:**

- **CA-01.1** El Registro 01 aparece una sola vez y es la primera línea del archivo.
- **CA-01.2** Los campos de longitud fija cumplen exactamente el largo especificado; los cortos se rellenan con espacios o ceros según la especificación ARCA.
- **CA-01.3** El campo "cantidad total de líneas" coincide con el número real de líneas del archivo.
- **CA-01.4** El campo "cantidad de registros de detalle" coincide con el conteo real de registros 02+03+04+05.
- **CA-01.5** El CVU está presente en todos los registros 02 con tipo de cuenta = `01`.
- **CA-01.6** Para una rectificativa, la secuencia del Registro 01 es mayor en 1 respecto a la última presentación exitosa del mismo período.
- **CA-01.7** La vista previa muestra el conteo correcto por tipo de registro antes de confirmar el envío.

---

#### CU-02 — Validar integridad del archivo F.8126

| | |
|---|---|
| **Actor principal** | Sistema (automático) |
| **Precondiciones** | Archivo F.8126 generado en CU-01. |
| **Disparador** | El analista presiona "Validar" en la vista previa. |

**Flujo principal:**
1. El sistema ejecuta el conjunto completo de validaciones de integridad.
2. Si no hay errores: habilita el botón "Enviar a ARCA (WSM)" con indicador verde.
3. Si hay errores: muestra listado con descripción y registro afectado. El botón de envío permanece deshabilitado.

**Flujo alternativo — Corrección y revalidación:**
- El analista corrige los datos en el módulo correspondiente, regenera el archivo y ejecuta la validación nuevamente.

---

**Requerimientos:**

- **RF-02.1** Ejecutar automáticamente las siguientes validaciones:
  - Registro 01 presente y único.
  - Cantidad total de líneas del Registro 01 coincide con el conteo real del archivo.
  - Cantidad de registros de detalle coincide con el conteo de 02+03+04+05.
  - Cada Registro 02 tiene al menos 1 Registro 03 vinculado.
  - La cantidad de integrantes declarada en el 02 coincide con los registros 03 asociados.
  - Solo 1 integrante con carácter = `1` (titular) por cuenta.
  - CVU presente en todas las cuentas de tipo `01`.
  - Registros 05 solo presentes cuando el tipo de movimiento del 04 asociado es `02` o `03`.
  - Todos los campos de longitud fija cumplen el largo especificado.

- **RF-02.2** Mostrar listado de errores con: tipo de error, número de registro afectado y descripción accionable.
- **RF-02.3** El botón "Enviar a ARCA (WSM)" debe permanecer deshabilitado mientras existan errores sin resolver.

**Criterios de Aceptación:**

- **CA-02.1** Sin errores → indicador verde y botón de envío habilitado.
- **CA-02.2** Con errores → listado visible con número de línea o registro afectado y descripción clara.
- **CA-02.3** El envío no puede forzarse si la última validación tuvo errores.
- **CA-02.4** Tras corregir y regenerar, la validación puede ejecutarse nuevamente sin restricciones.

---

#### CU-03 — Enviar F.8126 vía WSM a ARCA

| | |
|---|---|
| **Actor principal** | Analista de Compliance (Nivel 1) |
| **Precondiciones** | Archivo validado sin errores (CU-02). Credenciales WSM ARCA configuradas y homologadas. |
| **Disparador** | El analista presiona "Enviar a ARCA (WSM)" y confirma el diálogo. |

**Flujo principal:**
1. El sistema establece la conexión WSM con ARCA usando las credenciales configuradas.
2. Envía el archivo y espera la respuesta.
3. ARCA devuelve código de respuesta y mensaje.
4. El sistema registra la presentación como `Enviada` con la respuesta completa y notifica al analista.

**Flujo alternativo — Fallo de conexión o rechazo:**
- El sistema reintenta automáticamente hasta 3 veces (intervalo: 5 minutos).
- Si persiste el error, el estado queda como `Error en envío — pendiente reintento` con el detalle técnico.
- El analista puede reintentar manualmente desde el historial.

---

**Requerimientos:**

- **RF-03.1** El envío debe realizarse vía WSM con las credenciales configuradas en el backoffice.
- **RF-03.2** Registrar la respuesta completa de ARCA: código, mensaje, timestamp de envío y de respuesta.
- **RF-03.3** Reintentar automáticamente hasta 3 veces ante fallos de conexión (intervalo: 5 min).
- **RF-03.4** El historial de presentaciones debe incluir: período, secuencia, fecha/hora, usuario, estado y respuesta de ARCA.
- **RF-03.5** Un archivo enviado exitosamente no puede reenviarse como original; solo puede generarse una rectificativa.

**Criterios de Aceptación:**

- **CA-03.1** Envío exitoso → estado `Enviada` con respuesta de confirmación de ARCA visible en el historial.
- **CA-03.2** Envío fallido → estado `Error en envío` con detalle técnico visible para el analista.
- **CA-03.3** El analista puede reintentar desde el historial sin necesidad de regenerar el archivo.
- **CA-03.4** Para rectificativa, el sistema incrementa la secuencia automáticamente en el Registro 01.
- **CA-03.5** El historial es de solo lectura; no puede modificarse ni eliminarse.
- **CA-03.6** El archivo enviado puede descargarse desde cada entrada del historial.

---

### Módulo B: BCRA — Base Padrón

---

#### CU-04 — Capturar novedades de clientes para Base Padrón

| | |
|---|---|
| **Actor principal** | Sistema (automático) |
| **Precondiciones** | Módulo de Clientes operativo. |
| **Disparador** | Cualquier evento de alta, baja o modificación de cliente. |

**Flujo principal:**
1. Cliente aprobado por primera vez → sistema registra Alta `(10)` en la cola del Base Padrón.
2. Cliente desactivado → sistema registra Baja `(20)`.
3. Cambio de condición PEP o código postal → sistema registra Modificación `(30)`.
4. Al cierre del mes la cola contiene todas las novedades del período, listas para el reporte.

**Caso especial — Primera presentación:**
- El sistema informa la base completa de clientes activos, no solo novedades.

---

**Requerimientos:**

- **RF-04.1** Registrar automáticamente en la cola los eventos:
  - `Alta (10)`: cliente cambia a estado `Aprobado` por primera vez.
  - `Baja (20)`: cliente desactivado o dado de baja.
  - `Modificación (30)`: cambio de condición PEP o cambio de código postal.

- **RF-04.2** Cada registro en la cola debe incluir:

  | Campo | Opciones |
  |-------|---------|
  | Tipo de movimiento | `10` Alta / `20` Baja / `30` Modificación |
  | Tipo de persona | Jurídica (SA, SRL, SH) / Humana |
  | Nacionalidad | Extranjera / Nacional |
  | Identificación tributaria | CUIT / CUIL / CDI |
  | Número de ident. tributaria | `11` / `97` / `98` / `99` |
  | Identificación personal | DNI / LE / LC / Cédula / Cédula Mercosur / Pasaporte / DNI Exterior |
  | Número de ident. personal | `00` a `07` |
  | Condición PEP | SI / NO |
  | Código postal | Formato resolución BCRA |

- **RF-04.3** En la primera presentación, incluir la base completa de clientes activos independientemente de novedades del mes.

**Criterios de Aceptación:**

- **CA-04.1** Cada aprobación nueva genera automáticamente un Alta (10) en la cola, sin intervención manual.
- **CA-04.2** Cada desactivación genera automáticamente una Baja (20).
- **CA-04.3** Cambio de condición PEP genera Modificación (30) con el campo actualizado.
- **CA-04.4** Cambio de código postal genera Modificación (30) con el nuevo valor.
- **CA-04.5** Si un cliente tuvo múltiples modificaciones en el mismo mes, se conserva solo la más reciente de cada campo.
- **CA-04.6** En la primera presentación, la cola contiene todos los clientes activos aunque no hayan tenido novedades.

---

#### CU-05 — Generar y exportar reporte Base Padrón

| | |
|---|---|
| **Actor principal** | Analista de Compliance (Nivel 1 o Nivel 2) |
| **Precondiciones** | Cola de novedades del período disponible. |
| **Frecuencia** | Mensual. Envío al BCRA vía RUNOR. |

**Flujo principal:**
1. El analista navega a `Reportes Regulatorios > BCRA Base Padrón`.
2. Selecciona el período y presiona "Generar reporte".
3. El sistema consolida novedades y muestra vista previa con totales (altas, bajas, modificaciones) y detalle de cada registro.
4. El analista revisa y presiona "Exportar .txt".
5. El sistema genera el archivo `.txt` con el formato requerido por el BCRA.
6. El analista envía el `.txt` al BCRA vía RUNOR y regresa al sistema.
7. El analista marca la presentación como `Enviada al BCRA` con la fecha de envío.

---

**Requerimientos:**

- **RF-05.1** Consolidar las novedades del período (altas, bajas, modificaciones) al generar el reporte.
- **RF-05.2** Mostrar en la vista previa: totales por tipo de movimiento y detalle de cada registro con todos sus campos.
- **RF-05.3** Permitir exportar a `.txt` con un botón "Exportar .txt" claramente visible.
- **RF-05.4** El `.txt` debe incluir todos los campos exigidos por el BCRA en el formato de presentación vigente.
- **RF-05.5** Permitir marcar la presentación como `Enviada al BCRA` con fecha de envío ingresada manualmente.
- **RF-05.6** Registrar en el audit log: quién generó, cuándo, quién marcó el envío y con qué fecha.

**Criterios de Aceptación:**

- **CA-05.1** El reporte incluye únicamente las novedades del período seleccionado.
- **CA-05.2** Los totales de la vista previa coinciden con el conteo real de registros en el detalle.
- **CA-05.3** El `.txt` se genera correctamente con todos los campos del BCRA y puede abrirse sin errores.
- **CA-05.4** Al marcar como `Enviada`, el sistema registra usuario, fecha del marcado y fecha de envío informada.
- **CA-05.5** Un reporte marcado como `Enviado` no puede regenerarse para el mismo período sin confirmación explícita.

---

### Módulo C: UIF — Apartados A, B y C

---

#### CU-06 — Generar Apartado A (Supervisión BCRA)

| | |
|---|---|
| **Actor principal** | Analista de Compliance (Nivel 1 o Nivel 2) |
| **Precondiciones** | Datos de saldos de cuentas, FCIs y saldos a liquidar del período disponibles en BD. |
| **Frecuencia** | Mensual. Vencimiento: día 22 del mes siguiente (o día hábil posterior). |

**Flujo principal:**
1. El analista navega a `Reportes Regulatorios > UIF > Apartado A`.
2. Selecciona el período y presiona "Generar".
3. El sistema consolida automáticamente los datos del período.
4. El analista revisa la vista previa y presiona "Exportar .txt".
5. Envía el `.txt` a la UIF y marca la presentación como `Enviada a UIF` con fecha de envío.

---

**Requerimientos:**

- **RF-06.1** Consolidar y mostrar los siguientes datos del período:

  **A. Cuentas de pago de clientes:**
  - a.1 Saldo total de fondos acreditados en cuentas de pago.
  - a.2 Cantidad de cuentas con saldo > 0.
  - a.3 Cantidad total de cuentas (con y sin saldo).
  - a.4 Por cada entidad financiera depositaria: CBU y saldo en cuenta a la vista.

  **B. Saldos invertidos en FCIs:**
  - b.1 Saldo total de clientes en FCIs.
  - b.2 Cantidad de clientes con inversiones en FCIs.
  - b.3 Por fondo: número de registro CNV, denominación, saldo, tipo de agente (I/II/III), denominación del agente, CUIT del agente.

  **C. Saldos a liquidar:**
  - c.1 Saldo pendiente de acreditación en cuentas de pago.
  - c.2 Cantidad de cuentas con saldo pendiente de liquidación.

- **RF-06.2** Importes en **miles de pesos, sin decimales**, con redondeo estándar (≥5 incrementa, <5 descarta).
- **RF-06.3** Exportar a `.txt` con botón "Exportar .txt".
- **RF-06.4** Permitir marcar la presentación como `Enviada a UIF` con fecha de envío.

**Criterios de Aceptación:**

- **CA-06.1** Todos los importes están en miles de pesos sin decimales.
- **CA-06.2** El saldo a.1 es igual a la suma de saldos individuales de todas las cuentas al cierre del período.
- **CA-06.3** Las cantidades a.2 y a.3 coinciden con los conteos reales de cuentas en el sistema.
- **CA-06.4** El `.txt` contiene todos los campos del modelo de información del Apartado A.
- **CA-06.5** La presentación marcada como `Enviada a UIF` queda en el historial con usuario y fechas.

---

#### CU-07 — Generar Apartado B (Información estadística mensual)

| | |
|---|---|
| **Actor principal** | Analista de Compliance (Nivel 1 o Nivel 2) |
| **Precondiciones** | Datos de transacciones, transferencias y clientes del período en BD. Apartado A del período anterior disponible para el control de razonabilidad. |
| **Frecuencia** | Mensual. Vencimiento: día 22 del mes siguiente (o día hábil posterior). |

**Flujo principal:**
1. El analista navega a `Reportes Regulatorios > UIF > Apartado B`.
2. Selecciona el período y presiona "Generar".
3. El sistema consolida los datos estadísticos y ejecuta el control de razonabilidad.
4. Si la razonabilidad es correcta → indicador verde. Si hay diferencia → alerta con monto de discrepancia.
5. El analista revisa (y justifica si hay diferencia) y presiona "Exportar .txt".
6. Envía el `.txt` a la UIF y marca la presentación como `Enviada a UIF`.

**Flujo alternativo — Discrepancia en razonabilidad:**
- El analista ingresa una justificación obligatoria de la diferencia antes de exportar. Queda registrado en el audit log.

---

**Requerimientos:**

- **RF-07.1** Consolidar y mostrar:

  **A. Transacciones** (Crédito / Débito):
  - Créditos y Débitos: cuenta propia Comercial / cuenta propia Personal o No Comercial.
  - Solo Débitos: cuenta de otros PSPCP / Entidad Financiera / Otros.
  - Tipo de titular (cuenta propia): Persona Humana (`10`) / Persona Jurídica (`20`).
  - Método de iniciación: NFC / QR / Botón de pago / TPV Banda magnética / TPV Chip / Sucursal-Agente-Comercio / Cajero automático / No disponible.
  - Medios de pago (Tabla 1): tarjeta crédito / débito / prepaga / efectivo / transf. push / pull / PCT / SPOT / SPOT Recurrente.
  - Esquema de pago: código de marca de tarjeta o `00007` / `00008` / `00009`.

  **B. Transferencias:**
  - CVU → CBU / CBU → CVU / CVU → CVU Acreditadas / CVU → CVU Debitadas: monto y cantidad por tipo.

  **C. Clientes y cuentas:**
  - Clientes y cuentas involucrados en A y B, separados por uso Comercial / Personal o No Comercial.
  - Total de clientes y cuentas del PSP, separados por tipo de uso.

  **D. Préstamos:**
  - Otorgamiento (`10XXXXX`) y cancelación (`20XXXXX`), desagregados por medio de pago y esquema.

- **RF-07.2** Control de razonabilidad automático:
  `Saldo nuevo = Saldo anterior (Apt. A mes previo) + Créditos del mes − Débitos del mes`
  Comparar con el saldo informado en el Apartado A del período actual.

- **RF-07.3** Si hay diferencia en la razonabilidad: requerir justificación obligatoria antes de permitir la exportación.
- **RF-07.4** Importes en **miles de pesos, sin decimales**, con redondeo estándar.
- **RF-07.5** Exportar a `.txt` con botón "Exportar .txt".

**Criterios de Aceptación:**

- **CA-07.1** El control de razonabilidad se ejecuta automáticamente antes de mostrar la vista previa.
- **CA-07.2** Razonabilidad correcta → indicador verde visible en la vista previa.
- **CA-07.3** Con diferencia → el analista no puede exportar sin ingresar justificación.
- **CA-07.4** La justificación queda en el audit log con usuario, timestamp y monto de la diferencia.
- **CA-07.5** Los montos del Apartado B son consistentes con los movimientos del módulo transaccional para el mismo período.
- **CA-07.6** El `.txt` sigue el modelo de información del Apartado B (BCRA).

---

#### CU-08 — Generar template Apartado C (Auditor externo)

| | |
|---|---|
| **Actor principal** | Oficial de Cumplimiento (Nivel 1) |
| **Precondiciones** | Apartados A de los 3 meses del trimestre disponibles y marcados como enviados. |
| **Frecuencia** | Trimestral. Al 31 de diciembre incluye sección adicional de protección de usuarios. |

**Flujo principal:**
1. El Oficial navega a `Reportes Regulatorios > UIF > Apartado C`.
2. Selecciona el trimestre a informar.
3. El sistema genera el template `.txt` con los datos del Apartado A del trimestre y datos de la entidad.
4. Si el trimestre es Q4 (cierre 31/12), el template incluye la sección adicional de opinión sobre protección de usuarios.
5. El Oficial descarga el template y lo entrega al auditor externo para certificación.
6. Una vez presentado al BCRA, el Oficial marca el Apartado C como `Enviado`.

---

**Requerimientos:**

- **RF-08.1** Generar el template del Apartado C con: datos de la entidad informante, resumen del Apartado A de los 3 meses del trimestre, y secciones a completar por el auditor.
- **RF-08.2** Para cierre del 31 de diciembre, incluir la sección adicional de opinión sobre protección de usuarios de servicios financieros.
- **RF-08.3** Exportar el template a `.txt`.
- **RF-08.4** Permitir marcar como `Enviado` con fecha de presentación al BCRA.

**Criterios de Aceptación:**

- **CA-08.1** El template incluye correctamente los datos del Apartado A de los 3 meses del trimestre.
- **CA-08.2** Para el cierre del 31 de diciembre, la sección adicional de protección de usuarios está presente.
- **CA-08.3** El `.txt` puede entregarse al auditor externo sin modificaciones en los datos del sistema.
- **CA-08.4** La presentación marcada como `Enviado` queda registrada con fecha, usuario y trimestre.

---

#### CU-09 — Consultar calendario de vencimientos regulatorios

| | |
|---|---|
| **Actor principal** | Analista de Compliance (Nivel 1 o Nivel 2) |
| **Precondiciones** | Sesión iniciada. Fechas de vencimiento configuradas en el sistema. |
| **Frecuencia** | Consulta en cualquier momento del mes. |

**Flujo principal:**
1. El analista accede al dashboard o navega a `Reportes Regulatorios > Calendario`.
2. El sistema muestra los vencimientos del mes en curso y del siguiente.
3. Vencimientos en los próximos 5 días hábiles → resaltados en amarillo.
4. Vencimientos pasados sin presentación → resaltados en rojo.
5. El analista hace click en un vencimiento y navega directamente al módulo del reporte.

---

**Requerimientos:**

- **RF-09.1** Mostrar vencimientos de todos los reportes activos:
  - F.8126 ARCA: mensual, configurable.
  - Base Padrón BCRA: mensual, configurable.
  - UIF Apartados A y B: día 22 del mes siguiente (o día hábil posterior).
  - UIF Apartado C: trimestral, configurable.
- **RF-09.2** Resaltar en amarillo los reportes con vencimiento ≤ 5 días hábiles.
- **RF-09.3** Resaltar en rojo los reportes vencidos sin presentación registrada.
- **RF-09.4** El dashboard debe incluir el indicador de "Próximos vencimientos regulatorios" sin necesidad de navegar al módulo.
- **RF-09.5** Cada item del calendario debe ser clickeable y navegar al módulo correspondiente.

**Criterios de Aceptación:**

- **CA-09.1** El calendario muestra correctamente todos los vencimientos del mes actual y del siguiente.
- **CA-09.2** Un reporte con estado `Enviado` para el período vigente no aparece en rojo aunque la fecha haya pasado.
- **CA-09.3** Un reporte sin `Enviado` con fecha vencida aparece en rojo con indicación del retraso en días.
- **CA-09.4** El indicador del dashboard muestra en tiempo real el conteo de vencimientos próximos y vencidos.
- **CA-09.5** Las fechas de vencimiento son configurables por el Oficial de Cumplimiento sin requerir deploy.

---

## Fuera de Alcance (Out of Scope)

- **Integración directa con el portal de presentación de la UIF** — En V1 el envío de Apartados A, B y C es manual (export `.txt` + carga en plataforma UIF); la integración automática queda para V2.
- **Integración con RUNOR BCRA para envío automático del Base Padrón** — En V1 el envío es manual; se evalúa integración en V2.
- **Generación del informe del auditor externo (Apartado C)** — La herramienta genera el template; el informe final es responsabilidad del auditor externo.
- **Soporte multi-período simultáneo (generar varios meses en paralelo)** — En V1 se genera de a un período por vez.
- **Generación automática programada (cron job mensual)** — En V1 el analista dispara la generación manualmente; la generación automática queda para V2.
- **Validación en tiempo real contra el Web Service de ARCA previo a la generación** — En V1 la validación es local contra las reglas del sistema.

---

## Riesgos

### Técnicos
- **Las especificaciones de formato del F.8126 (longitud fija de campos, tablas de códigos) pueden cambiar por nuevas versiones del aplicativo ARCA.**
  - Mitigación: La versión del aplicativo (`00200`) debe ser configurable por el Oficial de Cumplimiento sin deploy. Registrar la versión utilizada en cada presentación.

- **La conexión WSM con ARCA puede estar no disponible en el momento de envío.**
  - Mitigación: Implementar reintentos automáticos (hasta 3 intentos) con intervalo configurable. El analista puede reintentar manualmente desde el historial.

- **Los datos de saldos y movimientos deben estar consolidados y correctos al momento de generar el reporte; si hay transacciones pendientes de conciliación, el reporte puede ser incorrecto.**
  - Mitigación: Mostrar advertencia antes de generar si existen transacciones del período sin conciliar.

- **El Apartado B requiere agregar movimientos por combinaciones de tipo + método + moneda, lo que implica queries de agregación sobre la tabla de transacciones.**
  - Mitigación: Crear vistas o índices específicos para estas consultas antes del desarrollo. Testear performance con volúmenes reales.

### Regulatorios
- **Las tablas de códigos de ARCA (tipos de documento, monedas, métodos de iniciación) pueden actualizarse.**
  - Mitigación: Las tablas de códigos deben ser configurables por el Oficial de Cumplimiento desde el backoffice del sistema.

- **La fecha de primer vencimiento (Apartados A y B) se activa a partir del certificado de inscripción en el Registro de PSPCP de la SEFyC.**
  - Mitigación: El sistema debe permitir configurar la fecha de inicio de obligación de presentación por tipo de reporte.

### De Adopción
- **Si el equipo no confía en que los datos generados son correctos, puede seguir usando la construcción manual en paralelo.**
  - Mitigación: Incluir el control de razonabilidad del Apartado B como validación visible y exportable. Generar reportes de revisión previos al envío.

### De Timeline
- **La integración WSM con ARCA requiere homologación previa con el organismo, lo que puede tomar tiempo.**
  - Mitigación: Iniciar el proceso de homologación con ARCA en paralelo con el desarrollo. En caso de demora, ofrecer exportación del archivo para envío manual como fallback.

---

## Dependencias

| Dependencia | Estado | Impacto si no está lista |
|-------------|--------|--------------------------|
| Módulo de Clientes (Alta Usuario) | En desarrollo | Bloqueante — los registros 02, 03 y Base Padrón usan datos de clientes |
| Datos de transacciones y saldos disponibles en BD | Pendiente de definición | Bloqueante para registros 04, 05 y Apartados A y B |
| Credenciales WSM ARCA configuradas y homologadas | Pendiente | Bloqueante para envío automático F.8126 |
| Tablas de códigos ARCA cargadas en el sistema | Pendiente | Bloqueante para validación y generación del F.8126 |
| Generación de archivos `.txt` | Pendiente de definición | Bloqueante para exportación de reportes BCRA y UIF |
| Migración a PostgreSQL | Pendiente | Necesaria antes de salida a producción |

---

## Tracking / Eventos

| Evento | Dónde | Event Category | Event Action | Event Name | Negocio | Producto | Placement |
|--------|-------|----------------|--------------|------------|---------|----------|-----------|
| Iniciar generación F.8126 | Módulo ARCA | Interacción | IniciarGeneracionF8126 | Iniciar F.8126 | dCP | Compliance | CTA General |
| Validar archivo F.8126 | Módulo ARCA | Interacción | ValidarArchivoF8126 | Validar F.8126 | dCP | Compliance | CTA General |
| Enviar F.8126 vía WSM | Módulo ARCA | Interacción | EnviarF8126WSM | Enviar F.8126 WSM | dCP | Compliance | CTA General |
| Error en envío WSM | Módulo ARCA | Navegación | ErrorEnvioWSM | Error envío ARCA WSM | dCP | Compliance | - |
| Generar Base Padrón BCRA | Módulo BCRA | Interacción | GenerarBasePadron | Generar Base Padrón | dCP | Compliance | CTA General |
| Exportar Base Padrón .txt | Módulo BCRA | Interacción | ExportarBasePadronTXT | Exportar Base Padrón .txt | dCP | Compliance | CTA General |
| Generar Apartado A UIF | Módulo UIF | Interacción | GenerarApartadoA | Generar Apartado A UIF | dCP | Compliance | CTA General |
| Generar Apartado B UIF | Módulo UIF | Interacción | GenerarApartadoB | Generar Apartado B UIF | dCP | Compliance | CTA General |
| Generar Apartado C UIF | Módulo UIF | Interacción | GenerarApartadoC | Generar Apartado C UIF | dCP | Compliance | CTA General |
| Exportar Apartado A .txt | Módulo UIF | Interacción | ExportarApartadoATXT | Exportar Apartado A .txt | dCP | Compliance | CTA General |
| Exportar Apartado B .txt | Módulo UIF | Interacción | ExportarApartadoBTXT | Exportar Apartado B .txt | dCP | Compliance | CTA General |
| Control razonabilidad aprobado | Módulo UIF | Navegación | RazonabilidadOK | Razonabilidad Apt. B OK | dCP | Compliance | - |
| Control razonabilidad con diferencia | Módulo UIF | Navegación | RazonabilidadError | Razonabilidad Apt. B con diferencia | dCP | Compliance | - |
| Marcar presentación como enviada | Historial reportes | Interacción | MarcarPresentacionEnviada | Marcar presentación enviada | dCP | Compliance | CTA Particular |
| Ver calendario vencimientos | Dashboard | Navegación | VerCalendarioVencimientos | Ver calendario vencimientos regulatorios | dCP | Compliance | - |

---

## Agenda / Plan de Desarrollo

| Instancia | Status | Fecha | Notas |
|-----------|--------|-------|-------|
| Kickoff | | | Incluir representante de ARCA/BCRA/UIF si posible |
| Desarrollo experiencia (UX) | | | Pendiente diseño en Figma — priorizar flujo F.8126 |
| Iteración experiencia | | | |
| Proceso de homologación WSM con ARCA | | | Iniciar en paralelo con desarrollo |
| Alineación con negocio | | | Confirmar fecha de primer vencimiento regulatorio |
| Desarrollo — Base Padrón BCRA | | | Primer módulo recomendado (más simple, sin WSM) |
| Desarrollo — UIF Apartados A y B | | | Depende de datos de transacciones en BD |
| Desarrollo — F.8126 ARCA (sin WSM) | | | Generación del archivo + validaciones |
| Desarrollo — Integración WSM ARCA | | | Depende de homologación con ARCA |
| Desarrollo — UIF Apartado C | | | Menor prioridad (trimestral, template manual) |
| Salida a PROD | | | Bloqueado por migración a PostgreSQL y homologación WSM |
