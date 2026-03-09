const express = require('express');
const router = express.Router({ mergeParams: true });
const { BeneficialOwner, Client } = require('../models');
const { auth } = require('../middlewares/auth');
const auditLogger = require('../utils/auditLogger');

// Listar beneficiarios finales de un cliente
router.get('/', auth, async (req, res, next) => {
  try {
    const beneficialOwners = await BeneficialOwner.findAll({
      where: { clientId: req.params.clientId },
      order: [['createdAt', 'DESC']],
    });
    res.json({ success: true, data: beneficialOwners });
  } catch (error) {
    next(error);
  }
});

// Crear beneficiario final
router.post('/', auth, async (req, res, next) => {
  try {
    const client = await Client.findByPk(req.params.clientId);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
    }

    const bo = await BeneficialOwner.create({
      ...req.body,
      clientId: req.params.clientId,
    });

    await auditLogger.log({
      entityType: 'BeneficialOwner',
      entityId: bo.id,
      action: 'create',
      changes: req.body,
      userId: req.user.id,
      req,
    });

    res.status(201).json({ success: true, data: bo });
  } catch (error) {
    next(error);
  }
});

// Actualizar beneficiario final
router.put('/:boId', auth, async (req, res, next) => {
  try {
    const bo = await BeneficialOwner.findOne({
      where: { id: req.params.boId, clientId: req.params.clientId },
    });

    if (!bo) {
      return res.status(404).json({ success: false, message: 'Beneficiario final no encontrado' });
    }

    const previousData = bo.toJSON();
    await bo.update(req.body);

    await auditLogger.log({
      entityType: 'BeneficialOwner',
      entityId: bo.id,
      action: 'update',
      changes: { previous: previousData, new: req.body },
      userId: req.user.id,
      req,
    });

    res.json({ success: true, data: bo });
  } catch (error) {
    next(error);
  }
});

// Desactivar beneficiario final
router.delete('/:boId', auth, async (req, res, next) => {
  try {
    const bo = await BeneficialOwner.findOne({
      where: { id: req.params.boId, clientId: req.params.clientId },
    });

    if (!bo) {
      return res.status(404).json({ success: false, message: 'Beneficiario final no encontrado' });
    }

    await bo.update({ isActive: false });

    await auditLogger.log({
      entityType: 'BeneficialOwner',
      entityId: bo.id,
      action: 'delete',
      reason: req.body.reason,
      userId: req.user.id,
      req,
    });

    res.json({ success: true, message: 'Beneficiario final desactivado' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
