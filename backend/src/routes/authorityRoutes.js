const express = require('express');
const router = express.Router({ mergeParams: true });
const { Authority, Client } = require('../models');
const { auth } = require('../middlewares/auth');
const auditLogger = require('../utils/auditLogger');

router.get('/', auth, async (req, res, next) => {
  try {
    const authorities = await Authority.findAll({
      where: { clientId: req.params.clientId },
      order: [['createdAt', 'DESC']],
    });
    res.json({ success: true, data: authorities });
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

    const authority = await Authority.create({
      ...req.body,
      clientId: req.params.clientId,
    });

    await auditLogger.log({
      entityType: 'Authority',
      entityId: authority.id,
      action: 'create',
      changes: req.body,
      userId: req.user.id,
      req,
    });

    res.status(201).json({ success: true, data: authority });
  } catch (error) {
    next(error);
  }
});

router.put('/:authId', auth, async (req, res, next) => {
  try {
    const authority = await Authority.findOne({
      where: { id: req.params.authId, clientId: req.params.clientId },
    });

    if (!authority) {
      return res.status(404).json({ success: false, message: 'Autoridad no encontrada' });
    }

    await authority.update(req.body);

    await auditLogger.log({
      entityType: 'Authority',
      entityId: authority.id,
      action: 'update',
      changes: req.body,
      userId: req.user.id,
      req,
    });

    res.json({ success: true, data: authority });
  } catch (error) {
    next(error);
  }
});

router.delete('/:authId', auth, async (req, res, next) => {
  try {
    const authority = await Authority.findOne({
      where: { id: req.params.authId, clientId: req.params.clientId },
    });

    if (!authority) {
      return res.status(404).json({ success: false, message: 'Autoridad no encontrada' });
    }

    await authority.update({ isActive: false });

    await auditLogger.log({
      entityType: 'Authority',
      entityId: authority.id,
      action: 'delete',
      reason: req.body.reason,
      userId: req.user.id,
      req,
    });

    res.json({ success: true, message: 'Autoridad desactivada' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
