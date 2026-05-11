const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const clientRoutes = require('./clientRoutes');
const sociedadRoutes = require('./sociedadRoutes');
const personaRoutes = require('./personaRoutes');
const documentoRoutes = require('./documentoRoutes');
const altaRoutes = require('./altaRoutes');
const alertaRoutes = require('./alertaRoutes');
const altaPendientePersonaRoutes = require('./altaPendientePersonaRoutes');
const unusualOperationRoutes = require('./unusualOperationRoutes');
const riskRoutes = require('./riskRoutes');
const reportRoutes = require('./reportRoutes');

router.use('/auth', authRoutes);
router.use('/clients', clientRoutes);
router.use('/sociedades', sociedadRoutes);
router.use('/personas', personaRoutes);
router.use('/documentos', documentoRoutes);
router.use('/alta', altaRoutes);
router.use('/alertas', alertaRoutes);
router.use('/altas-pendientes', altaPendientePersonaRoutes);
router.use('/unusual-operations', unusualOperationRoutes);
router.use('/risk', riskRoutes);
router.use('/reports', reportRoutes);

module.exports = router;
