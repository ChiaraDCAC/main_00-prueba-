const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');
const sociedadController = require('../controllers/sociedadController');

router.get('/', auth, sociedadController.listar);
router.get('/:id', auth, sociedadController.obtener);
router.post('/', auth, sociedadController.crear);
router.put('/:id', auth, sociedadController.actualizar);

module.exports = router;
