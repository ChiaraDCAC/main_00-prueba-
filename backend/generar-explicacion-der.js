const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, WidthType, BorderStyle, ShadingType,
  PageBreak, SpacingType
} = require('docx');
const fs = require('fs');
const path = require('path');

// ─── Helpers ────────────────────────────────────────────────────────────────

const AZUL = '0077B6';
const AZUL_CLARO = 'E0F0FA';
const AMARILLO = 'FFF8E1';
const GRIS = 'fafafa';

function titulo1(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 160 },
    run: { color: AZUL, bold: true },
  });
}

function titulo2(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 120 },
  });
}

function titulo3(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, color: AZUL, size: 22 })],
    spacing: { before: 200, after: 80 },
  });
}

function parrafo(text, options = {}) {
  return new Paragraph({
    children: [new TextRun({ text, size: 20, ...options })],
    spacing: { before: 60, after: 60 },
  });
}

function parrafoBold(label, text) {
  return new Paragraph({
    children: [
      new TextRun({ text: label, bold: true, size: 20 }),
      new TextRun({ text, size: 20 }),
    ],
    spacing: { before: 60, after: 60 },
  });
}

function viñeta(text) {
  return new Paragraph({
    children: [new TextRun({ text, size: 20 })],
    bullet: { level: 0 },
    spacing: { before: 40, after: 40 },
  });
}

function ejemplo(lines) {
  return [
    new Paragraph({
      children: [new TextRun({ text: 'Ejemplo:', bold: true, size: 20, color: AZUL })],
      spacing: { before: 80, after: 40 },
    }),
    ...lines.map(l => new Paragraph({
      children: [new TextRun({ text: l, size: 19, italics: true })],
      spacing: { before: 20, after: 20 },
      indent: { left: 400 },
    })),
  ];
}

function separador() {
  return new Paragraph({
    children: [new TextRun({ text: '' })],
    spacing: { before: 80, after: 80 },
  });
}

function tablaSimple(headers, rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: headers.map(h => new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ text: h, bold: true, color: 'FFFFFF', size: 18 })],
          })],
          shading: { type: ShadingType.SOLID, fill: AZUL },
        })),
      }),
      ...rows.map((row, i) => new TableRow({
        children: row.map(cell => new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ text: cell, size: 18 })],
          })],
          shading: { type: ShadingType.SOLID, fill: i % 2 === 0 ? 'FFFFFF' : GRIS },
        })),
      })),
    ],
  });
}

// ─── Contenido ───────────────────────────────────────────────────────────────

const sections = [

  // PORTADA
  new Paragraph({
    children: [new TextRun({ text: 'HC DCAC · Herramienta Compliance', bold: true, size: 36, color: AZUL })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 800, after: 200 },
  }),
  new Paragraph({
    children: [new TextRun({ text: 'Explicación del Diagrama Entidad–Relación (DER)', size: 28, color: AZUL })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 100, after: 100 },
  }),
  new Paragraph({
    children: [new TextRun({ text: `Versión 2.0 · ${new Date().toLocaleDateString('es-AR')}`, size: 20, color: '888888' })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 100, after: 800 },
  }),
  new Paragraph({ children: [new PageBreak()] }),

  // ── INTRODUCCION ──
  titulo1('1. ¿Qué es este sistema y para qué sirve?'),
  parrafo('La Herramienta Compliance permite gestionar el proceso de alta de clientes PSP (Plataforma de Servicios de Pago). Cuando una sociedad quiere operar con HC DCAC, debe pasar por un proceso de compliance: presentar documentación, identificar a las personas que la integran, y ser evaluada por analistas internos.'),
  parrafo('El diagrama muestra cómo se organiza la información en la base de datos. Cada tabla guarda un tipo de dato específico, y las relaciones entre tablas indican cómo se conectan entre sí.'),
  parrafo('Convención de colores en el diagrama:'),
  viñeta('Naranja — campos GET: datos que vienen de sistemas externos de producción, no se modifican en esta herramienta.'),
  viñeta('Negro en negrita — campos POST: datos creados o modificados por la herramienta de compliance.'),
  ...ejemplo([
    'La sociedad "Textiles del Norte SA" inicia su proceso de alta.',
    'El sistema registra sus datos, los documentos que presenta, las personas que la integran',
    '(director, accionistas, apoderado), y cada acción que realizan los analistas durante la revisión.',
  ]),
  separador(),

  // ── GRUPO 1: USUARIOS INTERNOS ──
  titulo1('2. Grupo 1 — Usuarios Internos del Sistema'),
  parrafo('Son los analistas y responsables de HC DCAC que utilizan la herramienta de compliance. Todos sus datos son POST (creados dentro de la herramienta).'),

  titulo2('Tabla: USUARIOS'),
  parrafo('Guarda los datos de cada persona que trabaja en HC DCAC y usa el sistema.'),
  parrafoBold('Campos:', ' id, nombre, apellido, nivel, activo'),
  parrafoBold('Niveles de acceso:', ''),
  viñeta('nivel_1 — Oficial de Cumplimiento: puede aprobar, rechazar y tomar todas las decisiones'),
  viñeta('nivel_2 — Analista Administrativo: puede cargar datos y gestionar documentos'),
  viñeta('nivel_3 — Solo lectura: puede consultar pero no modificar nada'),
  ...ejemplo([
    '• María García → nivel_1 (Oficial de Cumplimiento)',
    '• Juan Pérez → nivel_2 (Analista)',
    '• Laura Díaz → nivel_3 (Auditoría, solo consulta)',
  ]),
  separador(),

  // ── GRUPO 2: SOCIEDADES ──
  titulo1('3. Grupo 2 — Sociedades (Clientes PSP)'),
  parrafo('Son las empresas o personas que solicitan el alta para operar como clientes PSP.'),

  titulo2('Tabla: SOCIEDADES_TAG'),
  parrafo('Es una tabla que ya existe en producción. Contiene los datos maestros de cada sociedad: razón social, CUIT, tipo y estado. Esta tabla no la crea la herramienta de compliance — la lee desde el sistema existente. Todos sus campos son GET (datos externos).'),
  tablaSimple(
    ['id_sociedad', 'razon_social', 'cuit_cuil', 'tipo_sociedad', 'estado'],
    [
      ['001', 'Textiles del Norte SA', '30-12345678-9', 'SA', 'activo'],
      ['002', 'Comercio del Sur SRL', '30-98765432-1', 'SRL', 'activo'],
      ['003', 'Sucesión García', '20-11223344-5', 'sucesion', 'activo'],
    ]
  ),
  separador(),

  titulo2('Tabla: USUARIOS_SOCIEDAD'),
  parrafo('Guarda los datos personales de cada persona vinculada a una sociedad: directores, socios, apoderados, herederos, etc. Una persona puede aparecer en múltiples sociedades, por eso no está directamente ligada a una sociedad específica.'),
  parrafo('Campos GET (vienen del sistema externo): id, nombre, apellido, correo_electronico, telefono.'),
  parrafo('Campos POST (se cargan en la herramienta): nro_documento, cuit, domicilio, es_pep, cargo_societario, rol_interno, alcance_actos, limite_tipo, limite_monto_hasta, limite_monto_desde, tipo_firma, tipo_firma_casos, activo.'),
  separador(),

  titulo3('Esquema de Firmas (campos en USUARIOS_SOCIEDAD)'),
  parrafo('Para cada usuario vinculado a una sociedad, se registra su esquema de firma dentro del proceso de alta. Estos campos se cargan dentro del proceso de alta de usuario:'),
  viñeta('cargo_societario — gerente / director / presidente / vicepresidente / apoderado / ninguno'),
  viñeta('rol_interno — descripción libre del rol en la organización'),
  viñeta('alcance_actos — qué operaciones puede realizar (crédito, pagos, bancos, alta CVU, etc.)'),
  viñeta('limite_tipo — sin_limite / hasta_x / rango_x_a_y'),
  viñeta('limite_monto_hasta / limite_monto_desde — límites económicos según el tipo'),
  viñeta('tipo_firma — individual / conjunta / obligatoria_casos / ninguna'),
  viñeta('tipo_firma_casos — descripción de los casos si el tipo es "obligatoria_casos"'),
  parrafo('Lógica de visualización:'),
  viñeta('Si limite_tipo = "sin_limite" → no se muestran campos de monto'),
  viñeta('Si limite_tipo = "hasta_x" → solo se muestra limite_monto_hasta'),
  viñeta('Si limite_tipo = "rango_x_a_y" → se muestran ambos campos de monto'),
  viñeta('Si tipo_firma = "obligatoria_casos" → se muestra el campo tipo_firma_casos'),
  ...ejemplo([
    'Carlos Rodríguez es director con firma individual, alcance general, sin límite económico.',
    'Ana López es apoderada con firma conjunta, alcance pagos y compras, hasta $500.000.',
  ]),
  separador(),

  titulo2('Tabla: USUARIOS_SOCIEDAD_TAG (tabla intermedia N:M)'),
  parrafo('Resuelve la relación muchos a muchos entre personas y sociedades. Una persona puede estar en muchas sociedades, y una sociedad puede tener muchas personas.'),
  tablaSimple(
    ['id', 'id_usuario_sociedad', 'id_sociedad', 'rol'],
    [
      ['tag-1', 'Carlos Rodríguez', 'Textiles del Norte SA', 'Director'],
      ['tag-2', 'Carlos Rodríguez', 'Comercio del Sur SRL', 'Socio'],
      ['tag-3', 'Ana López', 'Textiles del Norte SA', 'Apoderada'],
    ]
  ),
  parrafo('Carlos aparece dos veces: una por cada sociedad en la que participa.'),
  separador(),

  // ── GRUPO 3: ROLES ──
  titulo1('4. Grupo 3 — Roles de las Personas dentro de cada Sociedad'),
  parrafo('Una vez que una persona está vinculada a una sociedad (via USUARIOS_SOCIEDAD_TAG), puede tener uno o más roles específicos. Todas estas tablas apuntan a USUARIOS_SOCIEDAD_TAG como FK — así saben quién es la persona Y en qué sociedad cumple ese rol.'),

  titulo2('AUTORIDADES — Presidente, Director, Gerente'),
  ...ejemplo(['Carlos Rodríguez es Presidente de Textiles del Norte SA desde 01/03/2023 hasta 01/03/2026 (mandato de 3 años).']),

  titulo2('ACCIONISTAS_SOCIOS — SA y SRL'),
  ...ejemplo(['Carlos Rodríguez → 60% de las acciones', 'Ana López → 40% de las acciones', 'Total: 100%']),

  titulo2('SOCIOS_SH — Sociedad de Hecho'),
  ...ejemplo(['Pedro Martínez y Rosa Silva son socios al 50/50. Pedro es el administrador con firma presente.']),

  titulo2('BENEFICIARIOS_FINALES'),
  parrafo('Personas físicas que en última instancia poseen o controlan la sociedad (más del 20% de participación). Dato clave para cumplimiento antilavado.'),
  ...ejemplo(['En Textiles SA: Carlos (60%) y Ana (40%) son ambos beneficiarios finales.']),

  titulo2('APODERADOS'),
  parrafo('Personas con poder notarial para actuar en nombre de la sociedad. Se registra la fecha del poder y su vencimiento.'),
  ...ejemplo(['Ana López tiene poder general otorgado el 15/01/2024, sin fecha de vencimiento.']),

  titulo2('HEREDEROS — Sucesión'),
  ...ejemplo(['Roberto García (hijo) → 50%', 'Marta García (hija) → 50%']),

  titulo2('ADMINISTRADOR_JUSTICIA — Sucesión'),
  ...ejemplo([
    'El Dr. Marcos Suárez es designado administrador judicial de la Sucesión García.',
    'Aceptó el cargo el 10/02/2024 → se convierte en el firmante único de la cuenta PSP.',
  ]),
  separador(),

  // ── GRUPO 4: DOCUMENTOS ──
  titulo1('5. Grupo 4 — Documentos'),
  parrafo('El proceso de compliance requiere que cada sociedad presente documentación específica según su tipo.'),

  titulo2('DOCUMENTOS_CLIENTE — El "slot"'),
  parrafo('Representa el espacio reservado para cada documento que una sociedad debe presentar. Es como una carpeta vacía que espera ser llenada. No cambia aunque el documento sea rechazado.'),
  parrafo('El campo id_documento (GET) viene del sistema externo e identifica el tipo de documento requerido. Los demás campos son POST.'),
  tablaSimple(
    ['id', 'id_sociedad', 'id_documento', 'es_obligatorio', 'version_activa'],
    [
      ['doc-A', 'Textiles SA', 'estatuto', 'Sí', '→ ver-003'],
      ['doc-B', 'Textiles SA', 'acta_autoridades', 'Sí', '→ ver-001'],
      ['doc-C', 'Textiles SA', 'registro_accionistas', 'Sí', '→ ver-002'],
      ['doc-D', 'Textiles SA', 'poder_administracion', 'No', '→ ver-001'],
    ]
  ),
  separador(),

  titulo2('DOCUMENTOS_VERSIONES — Cada subida de archivo'),
  parrafo('Cada vez que se sube un archivo para un documento, se genera un nuevo registro. Si el documento es rechazado y se vuelve a subir, hay una nueva fila — el historial queda intacto.'),
  parrafo('El campo version_activa en DOCUMENTOS_CLIENTE siempre apunta a la última versión aprobada, para consultas rápidas.'),
  tablaSimple(
    ['id', 'id_documento', 'version', 'estado', 'motivo_rechazo'],
    [
      ['ver-001', 'doc-A (estatuto)', '1', 'rechazado', 'Documento ilegible en página 3'],
      ['ver-002', 'doc-A (estatuto)', '2', 'rechazado', 'Falta firma del escribano'],
      ['ver-003', 'doc-A (estatuto)', '3', 'aprobado', '—'],
    ]
  ),
  parrafo('El slot doc-A siempre fue "el estatuto de Textiles SA". Hoy version_activa apunta a ver-003.'),
  separador(),

  titulo2('Tablas FORM_* — Datos del formulario por tipo de documento'),
  parrafo('Cuando el analista revisa una versión de un documento, completa un formulario con los datos extraídos. Cada tipo de documento tiene su propio esquema de campos, vinculado a la versión específica.'),
  ...ejemplo([
    'Al aprobar ver-003 (Estatuto SA), el analista completa:',
    '• Tipo societario: S.A.',
    '• Denominación social: Textiles del Norte SA',
    '• CUIT: 30-12345678-9',
    '• Fecha de constitución: 15/06/2010',
    '• Capital suscripto: $5.000.000',
    'Estos datos quedan en FORM_ESTATUTO_SA, con id_version = ver-003.',
  ]),
  separador(),

  // ── GRUPO 5: LOGS ──
  titulo1('6. Grupo 5 — Logs de Acciones y Comentarios'),
  parrafo('Registra TODO lo que ocurre en el sistema: aprobaciones, rechazos, comentarios, cambios de estado, habilitación de CVU. Es el historial de auditoría completo.'),
  parrafo('Los comentarios no son una tabla separada — son un tipo de acción (tipo_accion = "comentario") que no cambia ningún estado pero deja una nota en el historial.'),
  parrafo('Tipos de acción disponibles:'),
  viñeta('alta_iniciada — se inicia el proceso de alta'),
  viñeta('alta_guardada_borrador — se guarda el alta parcialmente (carga parcial)'),
  viñeta('alta_avanzada_pendiente — se avanza aunque hay documentación pendiente'),
  viñeta('alta_completada — se finaliza el alta del cliente'),
  viñeta('alta_excepcion_docs — alta sin documentación completa (excepción)'),
  viñeta('alta_psp / alta_psp_excepcion — habilitación PSP normal o por excepción'),
  viñeta('documento_aprobado / documento_rechazado / documento_observado — revisión de documentos'),
  viñeta('documento_re_solicitado — documento rechazado que se vuelve a pedir'),
  viñeta('datos_modificados — edición de información del cliente'),
  viñeta('cvu_habilitado / cvu_bloqueado / cvu_excepcion — gestión de CVU'),
  viñeta('pep_detectado — se identifica/marca manualmente una persona como PEP'),
  viñeta('comentario — nota libre en el historial, sin cambio de estado'),
  tablaSimple(
    ['fecha', 'tipo_accion', 'usuario', 'motivo / comentario'],
    [
      ['01/03 09:00', 'alta_iniciada', 'Juan Pérez', '—'],
      ['03/03 11:30', 'comentario', 'Juan Pérez', 'Cliente confirmó que envía el estatuto esta semana'],
      ['07/03 14:00', 'documento_rechazado', 'María García', 'Documento ilegible en página 3'],
      ['08/03 09:15', 'documento_re_solicitado', 'María García', 'Se notificó al cliente por email'],
      ['12/03 16:00', 'documento_aprobado', 'María García', '—'],
      ['18/03 10:00', 'alta_avanzada_pendiente', 'María García', 'Documentación parcial aprobada, se avanza'],
      ['20/03 10:00', 'alta_psp', 'María García', '—'],
      ['20/03 10:05', 'cvu_habilitado', 'María García', 'CVU: 0000003100012345678900'],
    ]
  ),
  separador(),

  // ── GRUPO 6: ALERTAS ──
  titulo1('7. Grupo 6 — Alertas'),
  parrafo('Gestiona las notificaciones automáticas o manuales que se generan cuando hay vencimientos, informes pendientes o solicitudes de información que requieren atención.'),

  titulo2('Tabla: ALERTAS'),
  parrafo('Cada alerta está vinculada a una sociedad y opcionalmente a una persona específica. Se genera automáticamente (por cron job) o manualmente, y se resuelve cuando se completa la acción requerida.'),
  parrafoBold('Tipos de alerta:', ''),
  viñeta('vencimiento_ddjj — vencimiento de una declaración jurada'),
  viñeta('informe_debida_diligencia — informe de debida diligencia pendiente'),
  viñeta('solicitud_informacion_pendiente — solicitud de información sin respuesta'),
  viñeta('documentacion_pendiente — documentación requerida sin presentar'),
  viñeta('renovacion_documento — documento próximo a vencer que debe renovarse'),
  parrafoBold('Estados:', ' pendiente / enviada / resuelta / ignorada'),
  ...ejemplo([
    'El sistema detecta que el informe de debida diligencia de Textiles SA vence en 15 días.',
    '→ Se crea una alerta tipo "informe_debida_diligencia" con fecha_vencimiento = 15/04/2026.',
    '→ Estado: pendiente. Se envía notificación al analista responsable.',
    '→ Una vez presentado el informe, el analista marca la alerta como resuelta.',
  ]),
  separador(),

  // ── N:M ──
  titulo1('8. Relaciones Muchos a Muchos (N:M)'),
  parrafo('Una relación N:M ocurre cuando un registro de la tabla A puede relacionarse con muchos de la tabla B, y viceversa. En bases de datos esto se resuelve con una tabla intermedia.'),

  titulo2('Caso 1 — Personas ↔ Sociedades'),
  viñeta('Una persona puede estar vinculada a MUCHAS sociedades'),
  viñeta('Una sociedad puede tener MUCHAS personas'),
  parrafo('Si se pusiera id_sociedad directamente en USUARIOS_SOCIEDAD, solo se podría guardar una sociedad por persona. La tabla USUARIOS_SOCIEDAD_TAG resuelve esto: cada fila representa un vínculo persona-sociedad.'),

  titulo2('Caso 2 — Documentos ↔ Versiones'),
  parrafo('DOCUMENTOS_CLIENTE guarda el "qué" (qué documento se requiere). DOCUMENTOS_VERSIONES guarda el "cómo y cuándo" (qué archivo se subió). La separación permite mantener historial completo sin pisar datos anteriores.'),
  separador(),

  // ── INTEGRIDAD ──
  titulo1('9. Reglas de integridad referencial'),
  parrafo('La integridad referencial garantiza que no haya registros "huérfanos" — un FK nunca puede apuntar a algo que no existe.'),
  tablaSimple(
    ['Regla', 'Ejemplo de lo que NO puede pasar'],
    [
      ['No puede existir un DOCUMENTO sin SOCIEDAD', 'Un slot de "estatuto" sin id_sociedad válido'],
      ['No puede existir una VERSIÓN sin DOCUMENTO', 'Una subida de archivo sin su slot correspondiente'],
      ['No puede existir un ROL sin vínculo persona-sociedad', 'Una AUTORIDAD sin su USUARIOS_SOCIEDAD_TAG'],
      ['No puede existir un LOG sin SOCIEDAD', 'Una acción registrada sin saber a qué sociedad pertenece'],
      ['No puede existir una ALERTA sin SOCIEDAD', 'Una alerta sin sociedad asociada'],
    ]
  ),
  separador(),

  // ── FLUJO ──
  titulo1('10. Flujo completo de un Alta — Paso a paso'),
  parrafo('Para entender cómo se conectan todas las tablas, veamos el ciclo completo del alta de Textiles del Norte SA:'),
  viñeta('1. La sociedad ya existe en SOCIEDADES_TAG (viene del sistema de producción, GET).'),
  viñeta('2. Se cargan las personas vinculadas en USUARIOS_SOCIEDAD: Carlos Rodríguez y Ana López.'),
  viñeta('3. Se crean sus vínculos en USUARIOS_SOCIEDAD_TAG: Carlos como Director, Ana como Apoderada.'),
  viñeta('4. Se asignan roles: Carlos en AUTORIDADES y ACCIONISTAS_SOCIOS; Ana en APODERADOS.'),
  viñeta('5. Se completan los campos de firmante en USUARIOS_SOCIEDAD para cada persona.'),
  viñeta('6. Se crean los slots de documentos en DOCUMENTOS_CLIENTE (uno por cada documento requerido).'),
  viñeta('7. Se sube el Estatuto → se crea DOCUMENTOS_VERSIONES ver-001 con estado "pendiente".'),
  viñeta('8. El analista lo rechaza → ver-001 pasa a "rechazado" → se registra documento_rechazado en LOGS_ACCIONES.'),
  viñeta('9. Se re-solicita el documento → log con documento_re_solicitado.'),
  viñeta('10. Se vuelve a subir → ver-002 es aprobado → se completa FORM_ESTATUTO_SA → version_activa apunta a ver-002.'),
  viñeta('11. Se aprueban todos los documentos → alta PSP → log con tipo_accion = "alta_psp".'),
  viñeta('12. Se habilita el CVU → log con "cvu_habilitado" y el número de CVU generado.'),
  viñeta('13. El sistema genera alertas automáticas para seguimiento periódico (debida diligencia, vencimientos).'),
];

// ─── Generar documento ───────────────────────────────────────────────────────

const doc = new Document({
  sections: [{ properties: {}, children: sections }],
  styles: {
    default: {
      document: {
        run: { font: 'Calibri', size: 20 },
      },
    },
  },
});

const outputPath = path.join(__dirname, '..', 'Explicacion_DER_Compliance.docx');

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outputPath, buffer);
  console.log(`✅ Documento generado: ${outputPath}`);
}).catch(err => {
  console.error('❌ Error:', err);
});
