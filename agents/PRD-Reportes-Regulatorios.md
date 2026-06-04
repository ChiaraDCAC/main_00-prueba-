# PRD - Reportes Regulatorios (ARCA F.8126 / BCRA Base Padrón / UIF Apartados A-B-C)

| Campo | Valor |
|-------|-------|
| **Status** | En curso |
| **Author(s)** | Producto |
| **Stakeholders** | Compliance, Legal, Finanzas, Tecnología, Dirección |
| **Team** | Coordinación Técnica (centraliza/coordina) &nbsp;·&nbsp; Desarrollo (ejecuta — a definir) |
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
[El sistema construye el archivo automáticamente — V300]
  - Registro 01: Cabecera (1 línea, 259 caracteres)
  - Registro 02: Titular de cuenta (201 caracteres)
  - Registro 03: Detalle de cuentas asociadas (540 caracteres)
  - Registro 04: Otros integrantes de cuenta (102 caracteres) — solo si >1 integrante
  - Registro 05: Movimientos mensuales (34 caracteres)
  - Registro 06: Detalle de transferencias (36 caracteres) — solo si supera 5% del umbral RG 4614
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

### Módulo A: ARCA — F.8126 (V300)

> **Versión del manual:** F.8126 V300, vigente para períodos ≥ 202604.
> **Sujeto informante:** deCampoPagos como **PSP** que actúa **por cuenta y orden de PSAVs**. Esto define el modo de completar el Registro 03 (ver RF-01.4).
> **Banco sponsor:** Banco Industrial (BIND). Sus CBUs operativos del PSP **no se reportan** — el régimen aplica al PSP, no al banco.

---

#### CU-01 — Generar archivo F.8126 (V300)

| | |
|---|---|
| **Actor principal** | Analista de Compliance (Nivel 1 o Nivel 2) |
| **Precondiciones** | Sesión iniciada. Datos de cuentas, titulares, integrantes y movimientos del período disponibles en BD. Tablas ARCA cargadas (documentos, monedas, países, carácter). Maestro de PSAVs cliente actualizado. |
| **Frecuencia** | Mensual (cierre de mes) |

**Flujo principal:**
1. El analista navega a `Reportes Regulatorios > ARCA F.8126`.
2. Selecciona el período a informar (AAAAMM) y confirma la generación.
3. El sistema construye el archivo con los **6 tipos de registros V300** y muestra vista previa con conteo por tipo.
4. El analista revisa y presiona "Validar" (continúa en CU-02).
5. Sin errores, el botón "Enviar a ARCA (WS)" se habilita.
6. El analista confirma el envío (continúa en CU-03).

**Flujo alternativo A — Rectificativa:**
- Si el período ya tiene una presentación exitosa, el sistema pregunta si se desea rectificar. Si se confirma, la secuencia se incrementa automáticamente (01, 02, …, máx 99).

**Flujo alternativo B — Errores de validación:**
- Si el paso 4 devuelve errores, el envío queda bloqueado. El analista corrige los datos y regenera.

**Flujo alternativo C — Sin movimientos:**
- Si en el período no hay nada que reportar, el archivo contiene **un único Registro 01** con campo "Cantidad de registros de detalle" = `1`.

---

**Requerimientos:**

- **RF-01.0 — Formato general del archivo**
  - Encoding: `ISO-8859-1`. Sin caracteres de control C0/C1 (excepto `LF` y `CR`).
  - Alfanuméricos alineados a izquierda, rellenados con espacios a derecha.
  - Numéricos alineados a derecha, rellenados con ceros a izquierda. Sin separadores de miles ni decimales.
  - Sin líneas en blanco.
  - Texto plano `.txt`. Compresión `.zip` o `.gz` recomendada para envío.
  - Nombre del archivo: `F8126.{CUIT}.{AAAAMM}00.{secuencia4}.txt`. Ej: `F8126.30999999995.20260500.0000.txt`.

- **RF-01.1 — Generar Registro 01 (Cabecera, 1 línea, 259 caracteres):**

  | # | Campo | Largo | Pos | Valor / Fuente |
  |---|-------|-------|-----|---------------|
  | 0 | Tipo de registro | 2 | 1-2 | `01` (fijo) |
  | 1 | CUIT informante | 11 | 3-13 | CUIT de deCampoPagos (config sistema, sin guiones) |
  | 2 | Período informado | 6 | 14-19 | AAAAMM seleccionado (mín `202604`) |
  | 3 | Secuencia | 2 | 20-21 | `00` original; `>00` rectificativa |
  | 4 | Denominación informante | 200 | 22-221 | Razón social de deCampoPagos (config) |
  | 5 | Hora | 6 | 222-227 | Timestamp `HHMMSS` de generación |
  | 6 | Cód. de impuesto | 4 | 228-231 | `0103` (fijo) |
  | 7 | Cód. de concepto | 3 | 232-234 | `812` (fijo) |
  | 8 | Número verificador | 6 | 235-240 | `000000`-`999999` |
  | 9 | Número de formulario | 4 | 241-244 | `8126` (fijo) |
  | 10 | Versión | 5 | 245-249 | `00300` (fijo, V300) |
  | 11 | Cantidad de registros de detalle | 10 | 250-259 | Conteo real de registros 01+02+03+04+05+06 |

- **RF-01.2 — Generar Registro 02 (Titular de cuenta, 201 caracteres) por cada usuario informado:**

  | # | Campo | Largo | Pos | Valor / Fuente |
  |---|-------|-------|-----|---------------|
  | 0 | Tipo de registro | 2 | 1-2 | `02` |
  | 1 | Tipo de persona | 1 | 3-3 | `1`=Humana / `2`=Jurídica |
  | 2 | Nacionalidad | 1 | 4-4 | `N`=Argentina / `E`=Extranjera |
  | 3 | País de nacionalidad | 3 | 5-7 | Código tabla países ARCA (Argentina = `200`) |
  | 4 | Tipo de documento | 2 | 8-9 | `80`=CUIT / `86`=CUIL / `87`=CDI / `88`=CIE / `94`=Pasaporte / `99`=NIF |
  | 5 | CUIT/CUIL/CDI | 11 | 10-20 | Obligatorio si campo 4 ∈ {80,86,87}. Sino, espacios |
  | 6 | Número otro documento | 20 | 21-40 | Obligatorio si campo 4 ∈ {88,94,99}. Sino, espacios |
  | 7 | Apellido y nombre / Denominación | 60 | 41-100 | Nombre completo o razón social |
  | 8 | ID de cuenta / Cliente interno | 50 | 101-150 | Legajo interno. Si no existe, usar CUIT/CUIL/CDI o ID fiscal extranjero |
  | 9 | Fecha de alta cuenta usuario | 8 | 151-158 | `AAAAMMDD` |
  | 10 | Tipo de operación | 2 | 159-160 | `01`=Cierre / `02`=Con movimientos / `03`=Sin movimientos |
  | 11 | Signo saldo en pesos | 1 | 161-161 | `0`=positivo / `1`=negativo |
  | 12 | Saldo en pesos | 12 | 162-173 | Sumatoria de saldos en ARS del titular, sin decimales |
  | 13 | Signo saldo M.E. | 1 | 174-174 | `0`/`1` |
  | 14 | Saldo M.E. en pesos | 12 | 175-186 | Sumatoria por moneda, valuada a pesos, sin decimales |
  | 15 | Signo saldo cripto | 1 | 187-187 | `0`/`1` |
  | 16 | Saldo cripto en pesos | 12 | 188-199 | Sumatoria valuada a pesos, sin decimales |
  | 17 | Cant. cuentas asociadas | 2 | 200-201 | Mín `01`, máx `99`. Debe coincidir con cant. de Registros 03 vinculados |

- **RF-01.3 — Generar Registro 03 (Detalle de cuenta asociada, 540 caracteres) por cada CVU/cuenta del titular:**

  | # | Campo | Largo | Pos | Valor / Fuente |
  |---|-------|-------|-----|---------------|
  | 0 | Tipo de registro | 2 | 1-2 | `03` |
  | 1 | Tipo de cuenta | 2 | 3-4 | `01`=Cuenta de pago / `02`=Otra |
  | 2 | CVU/CBU | 22 | 5-26 | Obligatorio si tipo cuenta = `01`. CVU emitido por el PSP al usuario |
  | 3 | Identificador otro tipo cuenta | 50 | 27-76 | Obligatorio si tipo cuenta = `02` |
  | 4 | Cantidad de integrantes | 2 | 77-78 | Mín `01`, máx `99`. Debe coincidir con Registros 04 vinculados |
  | 5 | Denominación entidad emisora | 200 | 79-278 | **Vacío** (somos PSP, somos la entidad emisora) |
  | 6 | Tipo doc. entidad emisora | 2 | 279-280 | **Vacío** |
  | 7 | Núm. doc. entidad emisora | 20 | 281-300 | **Vacío** |
  | 8 | Cuenta vinculada por cuenta y orden de terceros | 1 | 301-301 | `1`=Sí (somos PSP por cuenta y orden de PSAV) / `0`=No (cuenta propia del PSP) |
  | 9 | Denominación comercial del tercero | 200 | 302-501 | **Obligatorio si campo 8 = 1**. Razón social del PSAV cliente (del Maestro de PSAVs) |
  | 10 | Signo saldo en pesos (cuenta) | 1 | 502-502 | `0`/`1` |
  | 11 | Saldo en pesos (cuenta) | 12 | 503-514 | Sin decimales |
  | 12 | Signo saldo M.E. (cuenta) | 1 | 515-515 | `0`/`1` |
  | 13 | Saldo M.E. en pesos (cuenta) | 12 | 516-527 | Sin decimales |
  | 14 | Signo saldo cripto (cuenta) | 1 | 528-528 | `0`/`1` |
  | 15 | Saldo cripto en pesos (cuenta) | 12 | 529-540 | Sin decimales |

  > **Aclaración crítica para deCampoPagos como PSP por cuenta y orden de PSAV:**
  > - Campos 5, 6 y 7 quedan **en blanco/espacios** (somos la entidad emisora del CVU).
  > - Campo 8 = `1`.
  > - Campo 9 = denominación legal del PSAV cliente.
  > - **Las CBUs operativas del PSP en BIND NO se reportan**: se filtran en BD vía flag `is_reportable=false`.

- **RF-01.4 — Generar Registro 04 (Otros integrantes de cuenta, 102 caracteres):**

  Solo se genera si el Registro 03 asociado tiene `Cantidad de integrantes > 1`. Un Registro 04 por cada cotitular/apoderado/firmante adicional.

  | # | Campo | Largo | Pos | Valor / Fuente |
  |---|-------|-------|-----|---------------|
  | 0 | Tipo de registro | 2 | 1-2 | `04` |
  | 1 | Tipo de persona | 1 | 3-3 | `1`=Humana / `2`=Jurídica |
  | 2 | Carácter | 2 | 4-5 | `01`=Titular / `02`=Cotitular / `03`=Apoderado / `04`=Rep. legal / `05`=Firmante / `06`=Otros |
  | 3 | Nacionalidad | 1 | 6-6 | `N`/`E` |
  | 4 | País nacionalidad | 3 | 7-9 | Código tabla países |
  | 5 | Tipo documento | 2 | 10-11 | `80`/`86`/`87`/`88`/`94`/`99` |
  | 6 | CUIT/CUIL/CDI | 11 | 12-22 | Obligatorio si campo 5 ∈ {80,86,87} |
  | 7 | Número otro documento | 20 | 23-42 | Obligatorio si campo 5 ∈ {88,94,99} |
  | 8 | Apellido y nombre / Denominación | 60 | 43-102 | — |

- **RF-01.5 — Generar Registro 05 (Movimientos mensuales, 34 caracteres) agrupados por: tipo de operación + detalle de operación + moneda original:**

  Se informan los movimientos que **modifican el saldo disponible** y son visibles para el usuario. Solo montos positivos, sin decimales.

  | # | Campo | Largo | Pos | Valor / Fuente |
  |---|-------|-------|-----|---------------|
  | 0 | Tipo de registro | 2 | 1-2 | `05` |
  | 1 | Tipo de operación | 2 | 3-4 | `01`=Ingreso / `02`=Egreso |
  | 2 | Detalle de operación | 2 | 5-6 | `01`=Efectivo / `02`=Transf. a/de terceros (excepto pagos con transf.) / `03`=Transf. propia (entre cuentas del mismo titular) / `04`=Otorgamiento o pago de préstamos / `05`=Rendimientos de inversiones / `06`=Devoluciones / `07`=Compra/venta de M.E. / `08`=Pagos con transferencia (Transf. 3.0, QR, botón de pago, POS) / `09`=Otros (cripto, impuestos, comisiones, etc.) |
  | 3 | Moneda original | 2 | 7-9 | Tabla monedas ARCA: `1`=ARS, `2`=USD, …, `14`=BTC, etc. |
  | 4 | Monto mensual en moneda original | 13 | 9-21 | Suma del grupo. Si moneda = `1` (ARS), va en `0` |
  | 5 | Monto mensual en pesos | 13 | 22-34 | Equivalente en ARS, sin decimales |

- **RF-01.6 — Generar Registro 06 (Detalle de transferencias, 36 caracteres):**

  Se genera **solo si** el Registro 05 asociado cumple **todas estas condiciones**:
  1. Campo "Detalle de operación" del Reg. 05 ∈ {`02`, `03`} (transferencias, propias o de terceros).
  2. Campo "Moneda original" del Reg. 05 ∈ {`01`-`13`} (fiduciaria).
  3. El monto agrupado por **CBU/CVU contraparte** supera el **5% del umbral** del 2° párrafo art. 3° RG 4614.

  | # | Campo | Largo | Pos | Valor / Fuente |
  |---|-------|-------|-----|---------------|
  | 0 | Tipo de registro | 2 | 1-2 | `06` |
  | 1 | CBU o CVU contraparte | 22 | 3-24 | CBU si transf. bancaria, CVU si transf. virtual |
  | 2 | Monto en pesos | 12 | 25-36 | Sin decimales |

- **RF-01.7 — Estructura jerárquica del archivo (nodos):**
  El archivo respeta la concatenación: `01 → 02 → (03 + opcional 04* + opcional 05* + opcional 06*) → siguiente 03 → … → siguiente 02 → …`. No se agrupan todos los 03 al final ni todos los 05 al final.

- **RF-01.8** Mostrar vista previa con conteo de registros por tipo (01, 02, 03, 04, 05, 06) antes de habilitar el envío.

- **RF-01.9** El generador debe respetar el flag `is_reportable=false` en cuentas operativas del PSP (CBUs en BIND). Estas cuentas se excluyen del archivo.

**Criterios de Aceptación:**

- **CA-01.1** El Registro 01 aparece una sola vez y es la primera línea del archivo. Versión = `00300`.
- **CA-01.2** Cada registro cumple su largo exacto V300: 01=259, 02=201, 03=540, 04=102, 05=34, 06=36.
- **CA-01.3** Encoding `ISO-8859-1`. Sin caracteres de control C0/C1.
- **CA-01.4** El campo "Cantidad de registros de detalle" del Reg. 01 coincide con el conteo real (01+02+03+04+05+06).
- **CA-01.5** El CVU está presente en todos los Registros 03 con tipo de cuenta = `01`.
- **CA-01.6** Para todo Registro 03 con campo 8 = `1`, el campo 9 (denominación del PSAV) está completo y coincide con el Maestro de PSAVs.
- **CA-01.7** Los campos 5/6/7 del Registro 03 están vacíos (somos PSP emisor de la cuenta).
- **CA-01.8** Las CBUs operativas del PSP en BIND no aparecen en ningún Registro 03.
- **CA-01.9** Para rectificativa, la secuencia del Registro 01 es mayor en 1 respecto a la última presentación exitosa del mismo período.
- **CA-01.10** La vista previa muestra el conteo correcto por tipo de registro antes de confirmar el envío.
- **CA-01.11** Para presentación sin movimientos, el archivo contiene exclusivamente un Registro 01 con "Cantidad de registros de detalle" = `1`.

---

#### CU-02 — Validar integridad del archivo F.8126 (V300)

| | |
|---|---|
| **Actor principal** | Sistema (automático) |
| **Precondiciones** | Archivo F.8126 generado en CU-01. |
| **Disparador** | El analista presiona "Validar" en la vista previa. |

**Flujo principal:**
1. El sistema ejecuta el conjunto completo de validaciones de integridad V300.
2. Si no hay errores: habilita el botón "Enviar a ARCA (WS)" con indicador verde.
3. Si hay errores: muestra listado con descripción y registro afectado. El botón de envío permanece deshabilitado.

**Flujo alternativo — Corrección y revalidación:**
- El analista corrige los datos en el módulo correspondiente, regenera el archivo y ejecuta la validación nuevamente.

---

**Requerimientos:**

- **RF-02.1 — Validaciones estructurales:**
  - Registro 01 presente, único y primera línea.
  - El CUIT del Registro 01 coincide con el CUIT en el nombre del archivo.
  - El período del Registro 01 coincide con el período en el nombre del archivo.
  - "Cantidad de registros de detalle" del Reg. 01 = conteo real (01+02+03+04+05+06).
  - Largo exacto por tipo: 01=259, 02=201, 03=540, 04=102, 05=34, 06=36.

- **RF-02.2 — Validaciones jerárquicas (nodos):**
  - Debajo del Reg. 01, debe venir un Reg. 02 (excepto sin movimientos).
  - Debajo de cada Reg. 02, uno o más Reg. 03.
  - Debajo de un Reg. 03 con `Cantidad de integrantes > 1`, deben venir Registros 04 hasta completar la cantidad declarada.
  - La cantidad de Reg. 03 vinculados a un Reg. 02 = campo 17 ("Cant. cuentas asociadas") del Reg. 02.
  - Cada Reg. 06 está precedido por un Reg. 05 con detalle ∈ {`02`, `03`} y moneda ∈ {`01`-`13`}.

- **RF-02.3 — Validaciones de datos:**
  - Si nacionalidad = `N`, país = `200` (Argentina) y tipo doc ∈ {80, 86, 87}.
  - Si nacionalidad = `E`, país = código extranjero válido y tipo doc ∈ {80, 86, 87, 88, 94, 99}.
  - Si tipo doc ∈ {80, 86, 87}, el número se valida contra Registro Único Tributario (cuando esté disponible).
  - CVU/CBU válido (largo y dígito verificador) en Reg. 03 campo 2 y Reg. 06 campo 1.
  - Solo 1 integrante con carácter = `01` (Titular) por cuenta (entre Reg. 02 + Reg. 04).
  - Si Reg. 03 campo 8 = `1`, entonces Reg. 03 campo 9 (denominación PSAV) no está vacío.
  - Si Reg. 03 campo 1 = `01` (cuenta de pago), entonces campo 2 (CVU/CBU) tiene contenido.

- **RF-02.4** Mostrar listado de errores con: tipo de error, número de línea/registro afectado y descripción accionable.
- **RF-02.5** El botón "Enviar a ARCA (WS)" debe permanecer deshabilitado mientras existan errores sin resolver.

**Criterios de Aceptación:**

- **CA-02.1** Sin errores → indicador verde y botón de envío habilitado.
- **CA-02.2** Con errores → listado visible con número de línea o registro afectado y descripción clara.
- **CA-02.3** El envío no puede forzarse si la última validación tuvo errores.
- **CA-02.4** Tras corregir y regenerar, la validación puede ejecutarse nuevamente sin restricciones.
- **CA-02.5** Las validaciones jerárquicas detectan archivos donde los Reg. 03 no están agrupados con sus 04/05/06.

---

#### CU-03 — Enviar F.8126 vía Web Services a ARCA

| | |
|---|---|
| **Actor principal** | Analista de Compliance (Nivel 1) |
| **Precondiciones** | Archivo validado sin errores (CU-02). Certificado digital ARCA (homologación o producción según ambiente) instalado y vinculado al servicio "Presentación de DDJJ". |
| **Disparador** | El analista presiona "Enviar a ARCA (WS)" y confirma el diálogo. |

**Flujo principal:**
1. El sistema solicita un Token+Sign al **WSAA** firmando un TRA con la clave privada del certificado.
2. Una vez obtenido el TA (válido ~12h, cacheable), el sistema llama al **WS Presentación de DDJJ** enviando el archivo (preferentemente comprimido `.zip` o `.gz`).
3. ARCA devuelve un archivo `response` con número de transacción y estado.
4. El sistema registra la presentación como `Enviada` con la respuesta completa, persiste el archivo + hash + acuse, y notifica al analista.

**Flujo alternativo — Fallo de conexión o rechazo:**
- El sistema reintenta automáticamente hasta 3 veces (intervalo: 5 minutos).
- Si persiste el error, el estado queda como `Error en envío — pendiente reintento` con el detalle técnico.
- El analista puede reintentar manualmente desde el historial.

---

**Requerimientos:**

- **RF-03.1** El envío utiliza la cadena WSAA → WS Presentación de DDJJ con el certificado configurado para el ambiente activo (homologación / producción).
- **RF-03.2** El TA obtenido del WSAA se cachea hasta su vencimiento (~12h) y se reutiliza para llamadas posteriores en la ventana.
- **RF-03.3** Registrar la respuesta completa de ARCA: número de transacción, código, mensaje, timestamp de envío y de respuesta.
- **RF-03.4** Reintentar automáticamente hasta 3 veces ante fallos de conexión o errores transitorios (intervalo: 5 min).
- **RF-03.5** El historial de presentaciones debe incluir: período, secuencia, fecha/hora, usuario, estado, número de transacción ARCA, archivo enviado y acuse.
- **RF-03.6** Un archivo enviado exitosamente no puede reenviarse como original; solo puede generarse una rectificativa (secuencia `>00`, máx 99).
- **RF-03.7** La clave privada del certificado se custodia en KMS/HSM. Nunca se persiste en logs ni en el archivo plano del repositorio.

**Criterios de Aceptación:**

- **CA-03.1** Envío exitoso → estado `Enviada` con número de transacción ARCA visible en el historial.
- **CA-03.2** Envío fallido → estado `Error en envío` con detalle técnico visible para el analista.
- **CA-03.3** El analista puede reintentar desde el historial sin necesidad de regenerar el archivo.
- **CA-03.4** Para rectificativa, el sistema incrementa la secuencia automáticamente en el Registro 01.
- **CA-03.5** El historial es de solo lectura; no puede modificarse ni eliminarse.
- **CA-03.6** El archivo enviado y el acuse pueden descargarse desde cada entrada del historial.
- **CA-03.7** Un certificado próximo a vencer dispara una alerta a Operaciones con al menos 30 días de anticipación.

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
