# Checklist — Primera reunión con Desarrollo
## Conexión al Web Service de ARCA (módulo F.8126)

**Asistentes sugeridos:** Chiara (PO) · Marcos · Esteban · Jero Rech (Activación y UX) · opcionalmente Adrián (consultor) si hay dudas normativas
**Duración estimada:** 60-75 min
**Objetivo:** alinear el alcance técnico de la conexión al WS de ARCA, levantar dudas y dejar compromisos concretos para arrancar.

---

## Antes de la reunión

Mandales por mail estos 3 documentos como prelectura:

1. `agents/PRD-Reportes-Regulatorios.md` — sección Módulo A (F.8126 V300), CU-01 a CU-03
2. `agents/referencias-arca/Manual-usuario-F8126V300.pdf` — manual oficial del régimen
3. `agents/referencias-arca/wsaa_obtener_certificado_produccion.pdf` — pasos del trámite del certificado

Pedirles que vengan habiendo leído al menos los CU del PRD.

---

## Agenda

### 1. Contexto del proyecto (5 min) — vos lo presentás
- Qué es F.8126 (régimen mensual ARCA para PSP).
- Por qué V300 y no V200 (cambios de manual).
- deCampoPagos como PSP por cuenta y orden de PSAVs.
- Banco sponsor: BIND. Sus CBUs operativos NO se reportan.

### 2. Recorrido por el PRD (15 min) — los dejás guiar a ellos
Que te cuenten cómo entendieron:
- Los 6 tipos de registro del archivo (01 a 06).
- El flujo CU-01 → CU-02 → CU-03.
- Las validaciones jerárquicas de CU-02.

**Si algo no les cierra, marcalo como pregunta para Adrián/Compliance.**

### 3. Decisiones técnicas a tomar (20 min)
Ver sección "Decisiones a cerrar" más abajo.

### 4. Estimación y orden de tareas (15 min)
- Recorrer el PMO Hoja 3 — tareas T18 a T43 (las 20 técnicas).
- Pedirles que validen los esfuerzos en días.
- Pedirles que validen el orden por sprint (Hoja 3d Roadmap).

### 5. Próximos pasos y compromisos (10 min)
Cierres concretos antes de salir de la reunión.

---

## Decisiones a cerrar en la reunión

| # | Decisión | Opciones | Quién decide |
|---|---|---|---|
| 1 | **Lenguaje / stack** del módulo F.8126 | Reutilizar lo del backend actual de la herramienta de compliance. Confirmar cuál es. | Marcos/Esteban |
| 2 | **¿Librería existente o de cero?** Para WSAA + WS DDJJ existen wrappers de la comunidad (ej. en Python `pyafipws`, en PHP `LeoCubillaPaz/sdk-afip`, en .NET hay otras). | a) Usar librería existente · b) Programar de cero | Marcos/Esteban (vos preguntás) |
| 3 | **Custodia de la clave privada del certificado** | a) AWS KMS · b) GCP Cloud KMS · c) HashiCorp Vault · d) HSM físico · e) Archivo encriptado en server | Tech lead + Seguridad |
| 4 | **Cómo se gatilla el cierre mensual** | a) Cron job interno · b) Botón manual del analista · c) Trigger del sistema contable | Negocio (Administración) + Dev |
| 5 | **Compresión del archivo** | a) `.zip` · b) `.gz` · c) `.txt` plano | Dev (recomendado: .zip) |
| 6 | **Reintentos ante errores ARCA** | El PRD ya dice 3 reintentos cada 5 min. ¿Lo dejamos así? | Dev |
| 7 | **Logs de envíos** | ¿Dónde se guardan? ¿Cuánto tiempo se retienen? | Dev + Compliance |
| 8 | **Ambientes** | ¿Tienen ambiente de homologación montado para dev? Si no, ¿quién lo monta y cuándo? | Tech lead |

---

## Preguntas que vos (PO) tenés que hacer

Aunque no seas técnica, estas son las que tenés que llevar para no quedar dependiente:

### Sobre el certificado
- ¿Quién genera el CSR? (la solicitud que se sube a ARCA)
- ¿Quién custodia la clave privada y cómo se rota?
- ¿Tienen fecha de vencimiento del certificado y alerta antes de que venza?

### Sobre el envío
- ¿Cómo me entero yo si un envío salió OK o falló?
- ¿Dónde se guarda el N° de transacción de ARCA y por cuánto tiempo?
- ¿Cómo se ve el historial de presentaciones desde la herramienta?
- Si ARCA se cae el día del cierre, ¿qué pasa?

### Sobre rectificativas
- ¿Cómo se dispara una rectificativa?
- ¿Quién la aprueba antes de mandarla?
- ¿Hay un máximo de rectificativas posibles? (sí, 99)

### Sobre la BD
- ¿Cómo se modela una "Presentación" en la BD? (tabla, campos)
- ¿Se guarda el archivo .txt enviado? ¿Con qué retención?
- ¿Se guarda el response de ARCA literal?

### Sobre las validaciones
- ¿Cómo se reportan los errores de validación? (un listado claro al analista)
- Si dev encuentra validaciones del manual que no están en el PRD, ¿cómo se documentan?

### Sobre el ambiente de homologación
- ¿Pueden tener todo funcionando en homologación antes de la Sem 7?
- ¿Vamos a hacer pruebas con datos sintéticos o con un período real?

---

## Compromisos a cerrar antes de terminar

Que cada uno se vaya con responsabilidad concreta:

- [ ] **Dev:** estimar las 20 tareas técnicas y devolver feedback en 3 días hábiles.
- [ ] **Dev:** recomendar librería WSAA o decisión de "cero" en 5 días hábiles.
- [ ] **Dev:** confirmar stack y custodia de clave privada en 5 días hábiles.
- [ ] **PO (vos):** pasar las decisiones bloqueantes (Hoja 6 PMO) cerradas con Compliance antes de Sem 2.
- [ ] **PO (vos):** coordinar con Administración el certificado de homologación para Sem 2.
- [ ] **PO (vos):** convocar reunión de seguimiento semanal mientras dure la implementación.
- [ ] **Tech lead (Jero):** valida estructura final del módulo y PRD antes de que dev arranque a programar.

---

## Después de la reunión

1. Mandales minuta corta con: decisiones tomadas + compromisos + dueños + fecha.
2. Actualizá el PMO con los esfuerzos validados por dev (Hoja 3 columna "Esf").
3. Si aparecieron decisiones nuevas, sumalas a la Hoja 6 (Decisiones pendientes).
4. Agendá la reunión semanal de seguimiento.

---

## Material de referencia que necesitan tener a mano

- PRD: `agents/PRD-Reportes-Regulatorios.md`
- PMO: `PMO_F8126_V300_Implementacion_v7.xlsx`
- Manual ARCA: `agents/referencias-arca/Manual-usuario-F8126V300.pdf`
- Trámite certificado: `agents/referencias-arca/wsaa_obtener_certificado_produccion.pdf`
- Documentación oficial WSAA: https://www.arca.gob.ar/ws/documentacion/wsaa.asp
- Documentación oficial WS Presentación de DDJJ: https://www.arca.gob.ar/ws/wsddjj/WSPresentaciondeDDJJManualparaelDesarrollador.pdf
