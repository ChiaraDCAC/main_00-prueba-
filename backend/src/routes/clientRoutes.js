const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const clientController = require('../controllers/clientController');
const { auth, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validate');

// Beneficiarios finales, firmantes, apoderados y autoridades
const beneficialOwnerRoutes = require('./beneficialOwnerRoutes');
const signatoryRoutes = require('./signatoryRoutes');
const attorneyRoutes = require('./attorneyRoutes');
const authorityRoutes = require('./authorityRoutes');

router.use('/:clientId/beneficial-owners', beneficialOwnerRoutes);
router.use('/:clientId/signatories', signatoryRoutes);
router.use('/:clientId/attorneys', attorneyRoutes);
router.use('/:clientId/authorities', authorityRoutes);

// CRUD de clientes
router.get('/', auth, clientController.list);
router.post('/onboarding', auth, clientController.createOnboarding);
router.get('/:id', auth, clientController.getById);
router.get('/:id/audit', auth, authorize('admin', 'supervisor', 'auditor'), clientController.getAuditHistory);

router.post(
  '/',
  auth,
  [
    body('clientType').isIn(['persona_humana', 'persona_juridica']).withMessage('Tipo de cliente inválido'),
    body('cuit').matches(/^(\d{11}|\d{2}-\d{7,8}-\d)$/).withMessage('CUIT inválido'),
  ],
  validate,
  clientController.create
);

router.put('/:id', auth, clientController.update);
router.post('/:id/deactivate', auth, authorize('admin', 'supervisor'), clientController.deactivate);
router.post('/:id/approve', auth, authorize('admin', 'supervisor'), clientController.approve);
router.post('/:id/reject', auth, authorize('admin', 'supervisor'), clientController.reject);
router.post('/:id/fraud-flag', auth, authorize('admin', 'supervisor'), clientController.setFraudFlag);

module.exports = router;
