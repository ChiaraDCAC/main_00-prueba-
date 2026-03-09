const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const auditLogger = require('../utils/auditLogger');

const authController = {
  async register(req, res, next) {
    try {
      const { email, password, firstName, lastName, role } = req.body;

      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'El email ya está registrado',
        });
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      const user = await User.create({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: role || 'analyst',
      });

      await auditLogger.log({
        entityType: 'User',
        entityId: user.id,
        action: 'create',
        changes: { email, firstName, lastName, role },
        userId: req.user?.id,
        req,
      });

      res.status(201).json({
        success: true,
        message: 'Usuario creado exitosamente',
        data: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ where: { email } });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas',
        });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas',
        });
      }

      await user.update({ lastLogin: new Date() });

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
      );

      res.json({
        success: true,
        message: 'Login exitoso',
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async getProfile(req, res, next) {
    try {
      const user = await User.findByPk(req.user.id, {
        attributes: { exclude: ['password'] },
      });

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },

  async getUsers(req, res, next) {
    try {
      const users = await User.findAll({
        attributes: { exclude: ['password'] },
        order: [['createdAt', 'DESC']],
      });
      res.json({
        success: true,
        data: users,
      });
    } catch (error) {
      next(error);
    }
  },

  async updateUser(req, res, next) {
    try {
      const { id } = req.params;
      const { role, isActive } = req.body;

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      }

      const updates = {};
      if (role !== undefined) updates.role = role;
      if (isActive !== undefined) updates.isActive = isActive;

      await user.update(updates);

      await auditLogger.log({
        entityType: 'User',
        entityId: user.id,
        action: 'update',
        changes: updates,
        userId: req.user.id,
        req,
      });

      res.json({
        success: true,
        message: 'Usuario actualizado',
        data: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isActive: user.isActive,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async updateProfile(req, res, next) {
    try {
      const { firstName, lastName, currentPassword, newPassword } = req.body;
      const user = await User.findByPk(req.user.id);

      const updates = {};
      if (firstName) updates.firstName = firstName;
      if (lastName) updates.lastName = lastName;

      if (newPassword) {
        const isValidPassword = await bcrypt.compare(currentPassword, user.password);
        if (!isValidPassword) {
          return res.status(400).json({
            success: false,
            message: 'Contraseña actual incorrecta',
          });
        }
        updates.password = await bcrypt.hash(newPassword, 12);
      }

      await user.update(updates);

      await auditLogger.log({
        entityType: 'User',
        entityId: user.id,
        action: 'update',
        changes: { firstName, lastName, passwordChanged: !!newPassword },
        userId: req.user.id,
        req,
      });

      res.json({
        success: true,
        message: 'Perfil actualizado',
        data: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = authController;
