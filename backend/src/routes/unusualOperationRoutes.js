const express = require('express');
const router = express.Router();
const unusualOperationController = require('../controllers/unusualOperationController');
const { auth, authorize } = require('../middlewares/auth');

const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.get('/', auth, unusualOperationController.list);
router.get('/:id', auth, unusualOperationController.getById);
router.post('/', auth, unusualOperationController.create);
router.post('/:id/justify', auth, authorize('admin', 'supervisor'), unusualOperationController.markAsJustified);
router.post('/:id/suspicious', auth, authorize('admin', 'supervisor'), unusualOperationController.markAsSuspicious);
router.post('/:id/comment', auth, unusualOperationController.addComment);
router.post('/:id/attachment', auth, upload.single('file'), unusualOperationController.addAttachment);
router.delete('/:id/attachment/:adjId', auth, unusualOperationController.deleteAttachment);

module.exports = router;
