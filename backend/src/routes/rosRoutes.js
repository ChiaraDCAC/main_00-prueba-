const express = require('express');
const router = express.Router();
const rosController = require('../controllers/rosController');
const { auth, authorize } = require('../middlewares/auth');

// Todas las rutas de ROS requieren rol admin o supervisor
router.get('/', auth, rosController.list);
router.get('/:id', auth, rosController.getById);
router.put('/:id', auth, authorize('admin', 'supervisor'), rosController.update);
router.post('/:id/submit', auth, authorize('admin', 'supervisor'), rosController.submit);
router.post('/:id/confirm', auth, authorize('admin'), rosController.confirm);
router.post('/:id/evidence', auth, authorize('admin', 'supervisor'), rosController.addEvidence);

module.exports = router;
