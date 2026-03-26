const express = require('express');
const router = express.Router();
const { getEntityData, saveEntityData, getDatosGenerales, createDatosGenerales, linkSociedad } = require('../controllers/entityDataController');
const { auth } = require('../middlewares/auth');

// Entity data por tipo y id_sociedad
router.get('/:type/:id_sociedad', auth, getEntityData);
router.post('/:type/:id_sociedad', auth, saveEntityData);

// Datos generales
router.get('/datos-generales/:uuid', auth, getDatosGenerales);
router.post('/datos-generales', auth, createDatosGenerales);
router.post('/datos-generales/:uuid/sociedades', auth, linkSociedad);

module.exports = router;
