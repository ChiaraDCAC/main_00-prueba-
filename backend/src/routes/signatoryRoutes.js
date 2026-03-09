const express = require('express');
const router = express.Router({ mergeParams: true });
const { Signatory, Client } = require('../models');
const { auth } = require('../middlewares/auth');
const auditLogger = require('../utils/auditLogger');

router.get('/', auth, async (req, res, next) => {
  try {
    const signatories = await Signatory.findAll({
      where: { clientId: req.params.clientId },
      order: [['createdAt', 'DESC']],
    });
    res.json({ success: true, data: signatories });
  } catch (error) {
    next(error);
  }
});

router.post('/', auth, async (req, res, next) => {
  try {
    const client = await Client.findByPk(req.params.clientId);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
    }

    const signatory = await Signatory.create({
      ...req.body,
      clientId: req.params.clientId,
    });

    await auditLogger.log({
      entityType: 'Signatory',
      entityId: signatory.id,
      action: 'create',
      changes: req.body,
      userId: req.user.id,
      req,
    });

    res.status(201).json({ success: true, data: signatory });
  } catch (error) {
    next(error);
  }
});

router.put('/:sigId', auth, async (req, res, next) => {
  try {
    const signatory = await Signatory.findOne({
      where: { id: req.params.sigId, clientId: req.params.clientId },
    });

    if (!signatory) {
      return res.status(404).json({ success: false, message: 'Firmante no encontrado' });
    }

    await signatory.update(req.body);

    await auditLogger.log({
      entityType: 'Signatory',
      entityId: signatory.id,
      action: 'update',
      changes: req.body,
      userId: req.user.id,
      req,
    });

    res.json({ success: true, data: signatory });
  } catch (error) {
    next(error);
  }
});

router.delete('/:sigId', auth, async (req, res, next) => {
  try {
    const signatory = await Signatory.findOne({
      where: { id: req.params.sigId, clientId: req.params.clientId },
    });

    if (!signatory) {
      return res.status(404).json({ success: false, message: 'Firmante no encontrado' });
    }

    await signatory.update({ isActive: false });

    await auditLogger.log({
      entityType: 'Signatory',
      entityId: signatory.id,
      action: 'delete',
      reason: req.body.reason,
      userId: req.user.id,
      req,
    });

    res.json({ success: true, message: 'Firmante desactivado' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
