const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const investigationCaseController = require('../controllers/investigationCaseController');
const { auth, authorize } = require('../middlewares/auth');

// Configuración de multer para uploads de evidencia
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/evidence'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido'), false);
    }
  },
});

// Rutas de casos de investigación
router.get('/', auth, investigationCaseController.list);
router.get('/stats', auth, investigationCaseController.getStats);
router.get('/:id', auth, investigationCaseController.getById);
router.put('/:id', auth, investigationCaseController.update);

// Crear caso desde alerta
router.post('/from-alert/:alertId', auth, investigationCaseController.createFromAlert);

// Crear caso desde operación inusual
router.post('/from-unusual-operation/:unusualOperationId', auth, investigationCaseController.createFromUnusualOperation);

// Solicitudes de documentación
router.post('/:caseId/requests', auth, investigationCaseController.createDocumentRequest);
router.put('/requests/:requestId', auth, investigationCaseController.updateDocumentRequest);

// Evidencia
router.post('/:caseId/evidence', auth, upload.single('file'), investigationCaseController.uploadEvidence);

// Decisiones finales (solo supervisor/admin)
router.post('/:id/close-justified', auth, authorize('admin', 'supervisor'), investigationCaseController.closeAsJustified);
router.post('/:id/escalate-suspicious', auth, authorize('admin', 'supervisor'), investigationCaseController.escalateAsSuspicious);

module.exports = router;
