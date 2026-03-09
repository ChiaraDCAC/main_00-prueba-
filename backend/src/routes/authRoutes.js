const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { auth, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validate');

router.post(
  '/register',
  auth,
  authorize('admin'),
  [
    body('email').isEmail().withMessage('Email inválido'),
    body('password').isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres'),
    body('firstName').notEmpty().withMessage('Nombre requerido'),
    body('lastName').notEmpty().withMessage('Apellido requerido'),
  ],
  validate,
  authController.register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Email inválido'),
    body('password').notEmpty().withMessage('Contraseña requerida'),
  ],
  validate,
  authController.login
);

router.get('/users', auth, authorize('admin'), authController.getUsers);
router.put('/users/:id', auth, authorize('admin'), authController.updateUser);
router.get('/profile', auth, authController.getProfile);
router.put('/profile', auth, authController.updateProfile);

module.exports = router;
