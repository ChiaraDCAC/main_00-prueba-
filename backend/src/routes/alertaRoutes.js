const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');
const alertaController = require('../controllers/alertaController');

router.get('/', auth, alertaController.listar);
router.get('/:id', auth, alertaController.obtener);
router.post('/', auth, alertaController.crear);
router.put('/:id/resolver', auth, alertaController.resolver);
router.put('/:id/ignorar', auth, alertaController.ignorar);

module.exports = router;
