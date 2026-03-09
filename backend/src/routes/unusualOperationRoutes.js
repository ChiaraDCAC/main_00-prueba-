const express = require('express');
const router = express.Router();
const unusualOperationController = require('../controllers/unusualOperationController');
const { auth, authorize } = require('../middlewares/auth');

router.get('/', auth, unusualOperationController.list);
router.get('/:id', auth, unusualOperationController.getById);
router.post('/', auth, unusualOperationController.create);
router.post('/from-alert/:alertId', auth, unusualOperationController.createFromAlert);
router.post('/:id/analyze', auth, unusualOperationController.analyze);
router.post('/:id/justify', auth, authorize('admin', 'supervisor'), unusualOperationController.markAsJustified);
router.post('/:id/suspicious', auth, authorize('admin', 'supervisor'), unusualOperationController.markAsSuspicious);

module.exports = router;
