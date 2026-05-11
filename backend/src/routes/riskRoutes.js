const express = require('express');
const router = express.Router();
const { RiesgoSociedad, SociedadTag, UsuarioSociedadTag, UsuarioSociedad, Usuario } = require('../models');
const { auth } = require('../middlewares/auth');
const auditLogger = require('../utils/auditLogger');

// ─── Calcular puntaje según matriz ───────────────────────────
// tipo_sociedad: 'monotributista' → humana (5 factores)
//                cualquier otro   → jurídica (4 factores, sin nacionalidad, residencia 20%)
function calcularRiesgo({ es_pep, residencia, nacionalidad, actividad, antiguedad, materialidad, tipo_sociedad }) {
  if (es_pep) return { puntaje: 5.00, nivel_riesgo: 'alto' };

  const esHumana = tipo_sociedad === 'monotributista';
  const puntaje = esHumana
    ? residencia * 0.10 + nacionalidad * 0.10 + actividad * 0.30 + antiguedad * 0.20 + materialidad * 0.30
    : residencia * 0.20 +                       actividad * 0.30 + antiguedad * 0.20 + materialidad * 0.30;

  const nivel_riesgo = puntaje <= 2.00 ? 'bajo' : puntaje <= 3.00 ? 'medio' : 'alto';
  return { puntaje: Math.round(puntaje * 100) / 100, nivel_riesgo };
}

// ─── GET /api/risk/:id_sociedad — obtener última evaluación ──
router.get('/:id_sociedad', auth, async (req, res, next) => {
  try {
    const evaluacion = await RiesgoSociedad.findOne({
      where: { id_sociedad: req.params.id_sociedad },
      order: [['created_at', 'DESC']],
      include: [{ model: Usuario, as: 'Usuario', attributes: ['id', 'nombre', 'apellido'] }],
    });
    res.json({ success: true, data: evaluacion });
  } catch (error) {
    next(error);
  }
});

// ─── GET /api/risk/:id_sociedad/historial ────────────────────
router.get('/:id_sociedad/historial', auth, async (req, res, next) => {
  try {
    const historial = await RiesgoSociedad.findAll({
      where: { id_sociedad: req.params.id_sociedad },
      order: [['created_at', 'DESC']],
      include: [{ model: Usuario, as: 'Usuario', attributes: ['id', 'nombre', 'apellido'] }],
    });
    res.json({ success: true, data: historial });
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/risk/:id_sociedad — guardar evaluación ────────
router.post('/:id_sociedad', auth, async (req, res, next) => {
  try {
    const { residencia, nacionalidad, actividad, antiguedad, materialidad, observaciones, tipo_sociedad } = req.body;

    // Detectar PEP automáticamente desde personas vinculadas
    const vinculadosPep = await UsuarioSociedadTag.findAll({
      where: { id_sociedad: req.params.id_sociedad, activo: true },
      include: [{ model: UsuarioSociedad, where: { es_pep: true }, required: true }],
    });
    const es_pep = vinculadosPep.length > 0;

    // Validar factores requeridos (si no es PEP)
    if (!es_pep) {
      const esHumana = tipo_sociedad === 'monotributista';
      const factores = esHumana
        ? { residencia, nacionalidad, actividad, antiguedad, materialidad }
        : { residencia, actividad, antiguedad, materialidad };
      for (const [key, val] of Object.entries(factores)) {
        if (val === undefined || val === null) {
          return res.status(400).json({ success: false, message: `Factor requerido: ${key}` });
        }
      }
    }

    const { puntaje, nivel_riesgo } = calcularRiesgo({ es_pep, residencia, nacionalidad, actividad, antiguedad, materialidad, tipo_sociedad });

    const evaluacion = await RiesgoSociedad.create({
      id_sociedad:  req.params.id_sociedad,
      es_pep,
      residencia:    residencia    || null,
      nacionalidad:  nacionalidad  || null,
      actividad:     actividad     || null,
      antiguedad:    antiguedad    || null,
      materialidad:  materialidad  || null,
      puntaje,
      nivel_riesgo,
      evaluado_por: req.user.id,
      observaciones: observaciones || null,
    });

    // Actualizar nivel_riesgo en sociedades_tag para acceso rápido
    await SociedadTag.update(
      { nivel_riesgo },
      { where: { id_sociedad: req.params.id_sociedad } }
    );

    await auditLogger.log({
      entityType: 'RiesgoSociedad',
      entityId: evaluacion.id,
      action: 'create',
      changes: { nivel_riesgo, puntaje },
      userId: req.user.id,
      req,
    });

    res.status(201).json({ success: true, data: { ...evaluacion.toJSON(), puntaje, nivel_riesgo } });
  } catch (error) {
    next(error);
  }
});

// ─── GET /api/risk/:id_sociedad/pep-detectado ────────────────
// Detecta automáticamente si alguna persona vinculada es PEP
router.get('/:id_sociedad/pep-detectado', auth, async (req, res, next) => {
  try {
    const vinculados = await UsuarioSociedadTag.findAll({
      where: { id_sociedad: req.params.id_sociedad, activo: true },
      include: [{ model: UsuarioSociedad, where: { es_pep: true }, required: true }],
    });
    res.json({ success: true, data: { pep_detectado: vinculados.length > 0, cantidad: vinculados.length } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
