const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const clientRoutes = require('./clientRoutes');
const documentRoutes = require('./documentRoutes');
const alertRoutes = require('./alertRoutes');
const unusualOperationRoutes = require('./unusualOperationRoutes');
const rosRoutes = require('./rosRoutes');
const reportRoutes = require('./reportRoutes');
const riskRoutes = require('./riskRoutes');
const screeningRoutes = require('./screeningRoutes');
const contractRoutes = require('./contractRoutes');
const investigationCaseRoutes = require('./investigationCaseRoutes');
const entityDataRoutes = require('./entityDataRoutes');

router.use('/auth', authRoutes);
router.use('/clients', clientRoutes);
router.use('/documents', documentRoutes);
router.use('/alerts', alertRoutes);
router.use('/unusual-operations', unusualOperationRoutes);
router.use('/ros', rosRoutes);
router.use('/reports', reportRoutes);
router.use('/risk', riskRoutes);
router.use('/screening', screeningRoutes);
router.use('/contracts', contractRoutes);
router.use('/investigation-cases', investigationCaseRoutes);
router.use('/entity-data', entityDataRoutes);

module.exports = router;
