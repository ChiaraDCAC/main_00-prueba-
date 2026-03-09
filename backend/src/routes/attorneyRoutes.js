const express = require('express');
const router = express.Router({ mergeParams: true });
const { Attorney, Client } = require('../models');
const { auth } = require('../middlewares/auth');
const auditLogger = require('../utils/auditLogger');

router.get('/', auth, async (req, res, next) => {
  try {
    const attorneys = await Attorney.findAll({
      where: { clientId: req.params.clientId },
      order: [['createdAt', 'DESC']],
    });
    res.json({ success: true, data: attorneys });
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

    const attorney = await Attorney.create({
      ...req.body,
      clientId: req.params.clientId,
    });

    await auditLogger.log({
      entityType: 'Attorney',
      entityId: attorney.id,
      action: 'create',
      changes: req.body,
      userId: req.user.id,
      req,
    });

    res.status(201).json({ success: true, data: attorney });
  } catch (error) {
    next(error);
  }
});

router.put('/:attId', auth, async (req, res, next) => {
  try {
    const attorney = await Attorney.findOne({
      where: { id: req.params.attId, clientId: req.params.clientId },
    });

    if (!attorney) {
      return res.status(404).json({ success: false, message: 'Apoderado no encontrado' });
    }

    await attorney.update(req.body);

    await auditLogger.log({
      entityType: 'Attorney',
      entityId: attorney.id,
      action: 'update',
      changes: req.body,
      userId: req.user.id,
      req,
    });

    res.json({ success: true, data: attorney });
  } catch (error) {
    next(error);
  }
});

router.delete('/:attId', auth, async (req, res, next) => {
  try {
    const attorney = await Attorney.findOne({
      where: { id: req.params.attId, clientId: req.params.clientId },
    });

    if (!attorney) {
      return res.status(404).json({ success: false, message: 'Apoderado no encontrado' });
    }

    await attorney.update({ isActive: false });

    await auditLogger.log({
      entityType: 'Attorney',
      entityId: attorney.id,
      action: 'delete',
      reason: req.body.reason,
      userId: req.user.id,
      req,
    });

    res.json({ success: true, message: 'Apoderado desactivado' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
