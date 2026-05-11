const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { auth, authorize } = require('../middlewares/auth');
const documentoController = require('../controllers/documentoController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads')),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

router.get('/sociedad/:id_sociedad', auth, documentoController.listarPorSociedad);
router.post('/sociedad/:id_sociedad', auth, documentoController.crearSlot);
router.post('/:id/version', auth, upload.single('archivo'), documentoController.subirVersion);
router.put('/:id/aprobar', auth, authorize('admin', 'supervisor'), documentoController.aprobar);
router.put('/:id/rechazar', auth, authorize('admin', 'supervisor'), documentoController.rechazar);
router.put('/:id/observar', auth, authorize('admin', 'supervisor'), documentoController.observar);

module.exports = router;
