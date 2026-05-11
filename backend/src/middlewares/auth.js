const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token de autenticación no proporcionado',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const usuario = await Usuario.findByPk(decoded.id);

    if (!usuario || !usuario.activo) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autorizado',
      });
    }

    req.user = usuario;
    req.user.role = decoded.role; // role mapeado en el JWT
    next();
  } catch (error) {
    next(error);
  }
};

// roles: 'admin' | 'supervisor' | 'analyst' | 'auditor'
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para realizar esta acción',
      });
    }
    next();
  };
};

module.exports = { auth, authorize };
