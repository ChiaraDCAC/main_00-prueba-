const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const contractController = require('../controllers/contractController');

// Configure multer for contract uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/contracts'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `contract_${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos PDF'), false);
    }
  },
});

// Get contract for a client
router.get('/client/:clientId', contractController.getClientContract);

// Create contract for a client
router.post('/client/:clientId', contractController.createContract);

// Upload contract document
router.post(
  '/:contractId/upload',
  upload.single('contract'),
  contractController.uploadContract
);

// Get signature status
router.get('/:contractId/signatures', contractController.getSignatureStatus);

// Sign contract
router.post(
  '/:contractId/sign/:signatureId',
  contractController.signContract
);

// Add signer to contract
router.post('/:contractId/signers', contractController.addSigner);

// Remove signer from contract
router.delete(
  '/:contractId/signers/:signatureId',
  contractController.removeSigner
);

module.exports = router;
