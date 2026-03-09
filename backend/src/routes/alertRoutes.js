const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');
const { auth, authorize } = require('../middlewares/auth');

router.get('/', auth, alertController.list);
router.get('/stats', auth, alertController.getStats);
router.get('/:id', auth, alertController.getById);
router.post('/:id/assign', auth, authorize('admin', 'supervisor'), alertController.assign);
router.post('/:id/resolve', auth, alertController.resolve);
router.post('/:id/escalate', auth, alertController.escalate);

module.exports = router;
