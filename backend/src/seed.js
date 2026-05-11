process.env.NODE_ENV = 'production';
require('dotenv').config();
const bcrypt   = require('bcryptjs');
const path     = require('path');
const fs       = require('fs');
const { sequelize, Usuario, SociedadTag, UsuarioSociedad, UsuarioSociedadTag, DocumentoCliente, DocumentoVersion } = require('./models');

const seedData  = require(path.join(__dirname, '../data/seed-data.json'));
const UPLOAD_DIR = path.join(__dirname, '../uploads/seed');

// ── PDF mínimo válido ─────────────────────────────────────────────────────────
function makePdf(titulo) {
  return Buffer.from(
    `%PDF-1.4\n` +
    `1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n` +
    `2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n` +
    `3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>\nendobj\n` +
    `4 0 obj<</Length 60>>\nstream\nBT /F1 14 Tf 72 700 Td (${titulo.slice(0,40)}) Tj ET\nendstream\nendobj\n` +
    `5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\n` +
    `xref\n0 6\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\n0000000266 00000 n\n0000000394 00000 n\n` +
    `trailer<</Size 6/Root 1 0 R>>\nstartxref\n459\n%%EOF\n`
  );
}

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('Conectado a PostgreSQL...\n');

    // Crear carpeta de uploads seed si no existe
    if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

    // ── 1. USUARIOS INTERNOS ──────────────────────────────────────────
    console.log('Creando usuarios internos...');
    const usuariosCreados = {};
    for (const u of seedData.usuarios_internos) {
      const [usuario] = await Usuario.findOrCreate({
        where: { email: u.email },
        defaults: {
          nombre:        u.nombre,
          apellido:      u.apellido,
          password_hash: await bcrypt.hash(u.password, 12),
          nivel:         u.nivel,
        },
      });
      usuariosCreados[u.nivel] = usuario; // guarda el último de cada nivel
    }
    const analista = usuariosCreados['nivel_2'] || Object.values(usuariosCreados)[0];

    console.log(`  [OK] ${seedData.usuarios_internos.length} usuarios creados`);
    for (const u of seedData.usuarios_internos) {
      console.log(`    ${u.email.padEnd(34)} / ${u.password}  (${u.nivel})`);
    }
    console.log();

    // ── 2. CLIENTES ───────────────────────────────────────────────────
    for (const cliente of seedData.clientes) {
      console.log(`Procesando [${cliente.tipo}] ${cliente.sociedad.razon_social}`);

      // 2a. Sociedad
      const [sociedad] = await SociedadTag.findOrCreate({
        where:    { cuit_cuil: cliente.sociedad.cuit_cuil },
        defaults: cliente.sociedad,
      });

      // 2b. Personas y vinculaciones
      for (const p of cliente.personas) {
        const [persona] = await UsuarioSociedad.findOrCreate({
          where: { nro_documento: p.nro_documento },
          defaults: {
            apellido:           p.apellido,
            nombre:             p.nombre,
            nro_documento:      p.nro_documento,
            cuit:               p.cuit,
            correo_electronico: p.correo_electronico,
            telefono:           p.telefono,
            domicilio:          p.domicilio,
            es_pep:             p.es_pep,
            cargo_societario:   p.cargo_societario,
            tipo_firma:         p.tipo_firma,
          },
        });
        await UsuarioSociedadTag.findOrCreate({
          where: { id_usuario_sociedad: persona.id, id_sociedad: sociedad.id_sociedad },
          defaults: { rol: p.rol },
        });
      }

      // 2c. Documentos: slot + versión con PDF dummy
      for (const doc of cliente.documentos) {
        // Slot
        const [slot] = await DocumentoCliente.findOrCreate({
          where: { id_sociedad: sociedad.id_sociedad, id_documento: doc.id_documento },
          defaults: {
            id_sociedad:      sociedad.id_sociedad,
            tipo_entidad:     cliente.sociedad.tipo_sociedad,
            id_documento:     doc.id_documento,
            nombre_documento: doc.nombre_documento,
            categoria:        doc.categoria,
            es_obligatorio:   doc.es_obligatorio,
          },
        });

        // PDF dummy
        const fileName = `${cliente.sociedad.tipo_sociedad}_${sociedad.id_sociedad}_${doc.id_documento}.pdf`;
        const filePath = path.join(UPLOAD_DIR, fileName);
        if (!fs.existsSync(filePath)) {
          fs.writeFileSync(filePath, makePdf(doc.nombre_documento));
        }
        const urlArchivo = `uploads/seed/${fileName}`;

        // Versión — solo crear si no existe
        const existingVersion = await DocumentoVersion.findOne({ where: { id_documento: slot.id } });
        if (!existingVersion) {
          const v = doc.version;
          const version = await DocumentoVersion.create({
            id_documento:     slot.id,
            aprobado_por:     ['aprobado'].includes(v.estado) ? analista.id : null,
            numero_version:   1,
            url_archivo:      urlArchivo,
            estado:           v.estado,
            motivo_rechazo:   v.motivo_rechazo   || null,
            observaciones:    v.observaciones    || null,
            datos_formulario: v.datos_formulario || null,
            aprobado_en:      v.estado === 'aprobado' ? new Date() : null,
          });

          // Apuntar version_activa en el slot
          await slot.update({ version_activa: version.id });
        }
      }

      const estados = cliente.documentos.map(d => d.version.estado);
      console.log(`  [OK] ${cliente.personas.length} persona(s), ${cliente.documentos.length} doc(s) [${estados.join(', ')}]\n`);
    }

    // ── RESUMEN ───────────────────────────────────────────────────────
    console.log('══════════════════════════════════════════════════════');
    console.log('  SEED COMPLETADO');
    console.log('══════════════════════════════════════════════════════');
    console.log('  Clientes cargados:');
    for (const c of seedData.clientes) {
      const estadoDocs = c.documentos.map(d => d.version.estado).join(', ');
      console.log(`    [${c.tipo.padEnd(14)}] ${c.sociedad.razon_social.padEnd(35)} estado: ${c.sociedad.estado}`);
      console.log(`                     docs: ${estadoDocs}`);
    }
    console.log('══════════════════════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('ERROR en seed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

seed();
