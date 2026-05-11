const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');
const ctrl = require('../controllers/altaPendientePersonaController');

router.get('/stats', auth, ctrl.stats);
router.get('/', auth, ctrl.listar);
router.get('/:id', auth, ctrl.obtener);
router.post('/', auth, ctrl.crear);
router.put('/:id', auth, ctrl.actualizar);
router.put('/:id/documento', auth, ctrl.marcarDocumento);
router.put('/:id/completar', auth, ctrl.completar);
router.put('/:id/cancelar', auth, ctrl.cancelar);
router.delete('/:id', auth, ctrl.eliminar);

module.exports = router;
