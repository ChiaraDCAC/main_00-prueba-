const express = require('express');
const router = express.Router();
const riskService = require('../services/riskService');
const { RiskMatrix, RiskAssessment, Client } = require('../models');
const { auth, authorize } = require('../middlewares/auth');
const auditLogger = require('../utils/auditLogger');

// Calcular riesgo de un cliente
router.post('/calculate/:clientId', auth, async (req, res, next) => {
  try {
    const { assessmentType } = req.body;
    const assessment = await riskService.calculateRisk(
      req.params.clientId,
      assessmentType || 'evento',
      req.user.id
    );

    await auditLogger.log({
      entityType: 'RiskAssessment',
      entityId: assessment.id,
      action: 'create',
      changes: { clientId: req.params.clientId, assessmentType },
      userId: req.user.id,
      req,
    });

    res.json({ success: true, data: assessment });
  } catch (error) {
    next(error);
  }
});

// Obtener historial de evaluaciones de riesgo
router.get('/history/:clientId', auth, async (req, res, next) => {
  try {
    const assessments = await RiskAssessment.findAll({
      where: { clientId: req.params.clientId },
      order: [['createdAt', 'DESC']],
    });
    res.json({ success: true, data: assessments });
  } catch (error) {
    next(error);
  }
});

// Aprobar evaluación de riesgo
router.post('/approve/:assessmentId', auth, authorize('admin', 'supervisor'), async (req, res, next) => {
  try {
    const assessment = await RiskAssessment.findByPk(req.params.assessmentId);
    if (!assessment) {
      return res.status(404).json({ success: false, message: 'Evaluación no encontrada' });
    }

    await assessment.update({
      approvedBy: req.user.id,
      approvedAt: new Date(),
    });

    await auditLogger.log({
      entityType: 'RiskAssessment',
      entityId: assessment.id,
      action: 'approve',
      userId: req.user.id,
      req,
    });

    res.json({ success: true, data: assessment });
  } catch (error) {
    next(error);
  }
});

// Recalificación periódica
router.post('/recalculate-expired', auth, authorize('admin'), async (req, res, next) => {
  try {
    const results = await riskService.recalculateExpiredRisks();
    res.json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
});

// Obtener clientes por nivel de riesgo
router.get('/clients/:riskLevel', auth, async (req, res, next) => {
  try {
    const clients = await riskService.getClientsByRiskLevel(req.params.riskLevel);
    res.json({ success: true, data: clients });
  } catch (error) {
    next(error);
  }
});

// CRUD de matriz de riesgo
router.get('/matrix', auth, async (req, res, next) => {
  try {
    const matrix = await RiskMatrix.findAll({
      where: { isActive: true },
      order: [['factor', 'ASC'], ['score', 'ASC']],
    });
    res.json({ success: true, data: matrix });
  } catch (error) {
    next(error);
  }
});

router.post('/matrix', auth, authorize('admin'), async (req, res, next) => {
  try {
    const entry = await RiskMatrix.create(req.body);
    res.status(201).json({ success: true, data: entry });
  } catch (error) {
    next(error);
  }
});

router.put('/matrix/:id', auth, authorize('admin'), async (req, res, next) => {
  try {
    const entry = await RiskMatrix.findByPk(req.params.id);
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Entrada no encontrada' });
    }
    await entry.update(req.body);
    res.json({ success: true, data: entry });
  } catch (error) {
    next(error);
  }
});

router.delete('/matrix/:id', auth, authorize('admin'), async (req, res, next) => {
  try {
    const entry = await RiskMatrix.findByPk(req.params.id);
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Entrada no encontrada' });
    }
    await entry.update({ isActive: false });
    res.json({ success: true, message: 'Entrada desactivada' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
