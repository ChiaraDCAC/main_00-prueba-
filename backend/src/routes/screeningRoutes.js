const express = require('express');
const router = express.Router();
const screeningService = require('../services/screeningService');
const { ScreeningResult } = require('../models');
const { auth, authorize } = require('../middlewares/auth');
const auditLogger = require('../utils/auditLogger');

// Ejecutar screening de un cliente
router.post('/client/:clientId', auth, async (req, res, next) => {
  try {
    const { screeningType } = req.body;
    const results = await screeningService.performScreening(
      req.params.clientId,
      screeningType || 'evento'
    );

    await auditLogger.log({
      entityType: 'Screening',
      entityId: req.params.clientId,
      action: 'create',
      changes: { screeningType, resultsCount: results.length, matchesFound: results.filter(r => r.hasMatch).length },
      userId: req.user.id,
      req,
    });

    res.json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
});

// Obtener historial de screening de un cliente
router.get('/history/:clientId', auth, async (req, res, next) => {
  try {
    const results = await screeningService.getScreeningHistory(req.params.clientId);
    res.json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
});

// Revisar resultado de screening
router.post('/review/:resultId', auth, async (req, res, next) => {
  try {
    const result = await ScreeningResult.findByPk(req.params.resultId);
    if (!result) {
      return res.status(404).json({ success: false, message: 'Resultado no encontrado' });
    }

    const { status, reviewNotes } = req.body;

    await result.update({
      status,
      reviewNotes,
      reviewedBy: req.user.id,
      reviewedAt: new Date(),
    });

    await auditLogger.log({
      entityType: 'ScreeningResult',
      entityId: result.id,
      action: 'update',
      changes: { status, reviewNotes },
      userId: req.user.id,
      req,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// Ejecutar screening periódico (solo admin)
router.post('/periodic', auth, authorize('admin'), async (req, res, next) => {
  try {
    const results = await screeningService.performPeriodicScreening();

    await auditLogger.log({
      entityType: 'Screening',
      entityId: 'periodic',
      action: 'create',
      changes: { type: 'periodic', clientsProcessed: results.length },
      userId: req.user.id,
      req,
    });

    res.json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
});

// Obtener resultados con matches pendientes
router.get('/pending-matches', auth, async (req, res, next) => {
  try {
    const results = await ScreeningResult.findAll({
      where: {
        hasMatch: true,
        status: 'pendiente',
      },
      order: [['createdAt', 'DESC']],
    });
    res.json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
