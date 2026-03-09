const express = require('express');
const router = express.Router();
const reportService = require('../services/reportService');
const { auth, authorize } = require('../middlewares/auth');
const auditLogger = require('../utils/auditLogger');

// Generar Base Padrón
router.get('/base-padron/:year/:month', auth, async (req, res, next) => {
  try {
    const { year, month } = req.params;
    const { content, fileName } = await reportService.generateBasePadron(
      parseInt(month),
      parseInt(year)
    );

    await auditLogger.log({
      entityType: 'Report',
      entityId: fileName,
      action: 'export',
      changes: { reportType: 'base_padron', year, month },
      userId: req.user.id,
      req,
    });

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(content);
  } catch (error) {
    next(error);
  }
});

// Generar Apartados
router.get('/apartados/:year/:month', auth, async (req, res, next) => {
  try {
    const { year, month } = req.params;
    const { content, fileName } = await reportService.generateApartados(
      parseInt(month),
      parseInt(year)
    );

    await auditLogger.log({
      entityType: 'Report',
      entityId: fileName,
      action: 'export',
      changes: { reportType: 'apartados', year, month },
      userId: req.user.id,
      req,
    });

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(content);
  } catch (error) {
    next(error);
  }
});

// Generar reporte mensual de BP
router.get('/bp/:year/:month', auth, async (req, res, next) => {
  try {
    const { year, month } = req.params;
    const { content, fileName } = await reportService.generateBPReport(
      parseInt(month),
      parseInt(year)
    );

    await auditLogger.log({
      entityType: 'Report',
      entityId: fileName,
      action: 'export',
      changes: { reportType: 'bp_mensual', year, month },
      userId: req.user.id,
      req,
    });

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(content);
  } catch (error) {
    next(error);
  }
});

// Validar reporte
router.post('/validate', auth, async (req, res, next) => {
  try {
    const { content, reportType } = req.body;
    const validation = reportService.validateReport(content, reportType);
    res.json({ success: true, data: validation });
  } catch (error) {
    next(error);
  }
});

// Resumen del período
router.get('/summary/:year/:month', auth, async (req, res, next) => {
  try {
    const { year, month } = req.params;
    const summary = await reportService.getReportSummary(
      parseInt(month),
      parseInt(year)
    );
    res.json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
