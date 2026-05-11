const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');

// Mapeo nivel DB <-> role frontend
const nivelToRole = {
  nivel_1: 'admin',      // Oficial de Cumplimiento
  nivel_2: 'supervisor', // Analista
  nivel_3: 'analyst',    // Sin acceso a dashboard
};
const roleToNivel = {
  admin: 'nivel_1',
  supervisor: 'nivel_2',
  analyst: 'nivel_3',
  auditor: 'nivel_3',
};

const formatUser = (u) => ({
  id: u.id,
  email: u.email,
  firstName: u.nombre,
  lastName: u.apellido,
  role: nivelToRole[u.nivel] || u.nivel,
  isActive: u.activo,
  createdAt: u.created_at,
});

const authController = {
  async register(req, res, next) {
    try {
      const { email, password, firstName, lastName, role } = req.body;

      const existingUser = await Usuario.findOne({ where: { email } });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'El email ya está registrado',
        });
      }

      const password_hash = await bcrypt.hash(password, 12);
      const nivel = roleToNivel[role] || 'nivel_1';

      const usuario = await Usuario.create({
        email,
        password_hash,
        nombre: firstName,
        apellido: lastName,
        nivel,
      });

      res.status(201).json({
        success: true,
        message: 'Usuario creado exitosamente',
        data: formatUser(usuario),
      });
    } catch (error) {
      next(error);
    }
  },

  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      const usuario = await Usuario.findOne({ where: { email } });

      if (!usuario || !usuario.activo) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas',
        });
      }

      const isValid = await bcrypt.compare(password, usuario.password_hash);
      if (!isValid) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas',
        });
      }

      const role = nivelToRole[usuario.nivel] || 'analyst';

      const token = jwt.sign(
        { id: usuario.id, email: usuario.email, role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
      );

      res.json({
        success: true,
        message: 'Login exitoso',
        data: {
          token,
          user: formatUser(usuario),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async getProfile(req, res, next) {
    try {
      const usuario = await Usuario.findByPk(req.user.id);
      res.json({
        success: true,
        data: formatUser(usuario),
      });
    } catch (error) {
      next(error);
    }
  },

  async getUsers(req, res, next) {
    try {
      const usuarios = await Usuario.findAll({
        order: [['created_at', 'DESC']],
      });
      res.json({
        success: true,
        data: usuarios.map(formatUser),
      });
    } catch (error) {
      next(error);
    }
  },

  async updateUser(req, res, next) {
    try {
      const { id } = req.params;
      const { role, isActive } = req.body;

      const usuario = await Usuario.findByPk(id);
      if (!usuario) {
        return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      }

      const updates = {};
      if (role !== undefined) updates.nivel = roleToNivel[role] || role;
      if (isActive !== undefined) updates.activo = isActive;

      await usuario.update(updates);

      res.json({
        success: true,
        message: 'Usuario actualizado',
        data: formatUser(usuario),
      });
    } catch (error) {
      next(error);
    }
  },

  async updateProfile(req, res, next) {
    try {
      const { firstName, lastName, currentPassword, newPassword } = req.body;
      const usuario = await Usuario.findByPk(req.user.id);

      const updates = {};
      if (firstName) updates.nombre = firstName;
      if (lastName) updates.apellido = lastName;

      if (newPassword) {
        const isValid = await bcrypt.compare(currentPassword, usuario.password_hash);
        if (!isValid) {
          return res.status(400).json({
            success: false,
            message: 'Contraseña actual incorrecta',
          });
        }
        updates.password_hash = await bcrypt.hash(newPassword, 12);
      }

      await usuario.update(updates);

      res.json({
        success: true,
        message: 'Perfil actualizado',
        data: formatUser(usuario),
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = authController;
