const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');
const personaController = require('../controllers/personaController');

router.get('/', auth, personaController.directorio);
router.get('/sociedad/:id_sociedad', auth, personaController.listarPorSociedad);
router.get('/:id', auth, personaController.obtener);
router.post('/sociedad/:id_sociedad', auth, personaController.crear);
router.put('/:id', auth, personaController.actualizar);
router.delete('/vinculacion/:id_tag', auth, personaController.desvincular);

module.exports = router;
