const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');
const altaController = require('../controllers/altaController');

router.get('/:id_sociedad/estado', auth, altaController.obtenerEstado);
router.get('/:id_sociedad/historial', auth, altaController.historial);
router.post('/:id_sociedad/iniciar', auth, altaController.iniciar);
router.put('/:id_sociedad/guardar', auth, altaController.guardarBorrador);
router.put('/:id_sociedad/avanzar', auth, altaController.avanzar);
router.post('/:id_sociedad/cvu', auth, altaController.generarCVU);

module.exports = router;
