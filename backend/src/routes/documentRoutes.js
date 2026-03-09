const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const documentController = require('../controllers/documentController');
const { auth, authorize } = require('../middlewares/auth');

// Configuración de multer para subida de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido'), false);
    }
  },
});

router.get('/client/:clientId', auth, documentController.listByClient);
router.get('/expiring', auth, documentController.getExpiring);
router.post('/update-expired', auth, authorize('admin'), documentController.updateExpiredStatus);

router.post(
  '/client/:clientId',
  auth,
  upload.single('file'),
  documentController.upload
);

router.get('/:id/download', auth, documentController.download);
router.post('/:id/verify', auth, authorize('admin', 'supervisor'), documentController.verify);
router.delete('/:id', auth, authorize('admin', 'supervisor'), documentController.delete);

module.exports = router;
