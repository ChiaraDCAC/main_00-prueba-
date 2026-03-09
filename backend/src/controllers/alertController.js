const { Op } = require('sequelize');
const { Alert, Client, Transaction } = require('../models');
const auditLogger = require('../utils/auditLogger');

const alertController = {
  // Listar alertas con filtros
  async list(req, res, next) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        alertType,
        severity,
        clientId,
        assignedTo,
        sortBy = 'createdAt',
        sortOrder = 'DESC',
      } = req.query;

      const where = {};
      if (status) where.status = status;
      if (alertType) where.alertType = alertType;
      if (severity) where.severity = severity;
      if (clientId) where.clientId = clientId;
      if (assignedTo) where.assignedTo = assignedTo;

      const { count, rows } = await Alert.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit),
        order: [[sortBy, sortOrder]],
        include: [
          { model: Client, attributes: ['id', 'cuit', 'legalName', 'firstName', 'lastName'] },
          { model: Transaction, as: 'transaction' },
        ],
      });

      res.json({
        success: true,
        data: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / parseInt(limit)),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // Obtener alerta por ID
  async getById(req, res, next) {
    try {
      const alert = await Alert.findByPk(req.params.id, {
        include: [
          { model: Client },
          { model: Transaction, as: 'transaction' },
        ],
      });

      if (!alert) {
        return res.status(404).json({
          success: false,
          message: 'Alerta no encontrada',
        });
      }

      res.json({
        success: true,
        data: alert,
      });
    } catch (error) {
      next(error);
    }
  },

  // Asignar alerta a un analista
  async assign(req, res, next) {
    try {
      const alert = await Alert.findByPk(req.params.id);

      if (!alert) {
        return res.status(404).json({
          success: false,
          message: 'Alerta no encontrada',
        });
      }

      const { assignedTo } = req.body;

      await alert.update({
        assignedTo,
        assignedAt: new Date(),
        status: 'en_revision',
      });

      await auditLogger.log({
        entityType: 'Alert',
        entityId: alert.id,
        action: 'update',
        changes: { assignedTo, status: 'en_revision' },
        userId: req.user.id,
        req,
      });

      res.json({
        success: true,
        message: 'Alerta asignada',
        data: alert,
      });
    } catch (error) {
      next(error);
    }
  },

  // Resolver alerta
  async resolve(req, res, next) {
    try {
      const alert = await Alert.findByPk(req.params.id);

      if (!alert) {
        return res.status(404).json({
          success: false,
          message: 'Alerta no encontrada',
        });
      }

      const { resolution } = req.body;

      await alert.update({
        status: 'cerrada',
        resolution,
        resolvedBy: req.user.id,
        resolvedAt: new Date(),
      });

      await auditLogger.log({
        entityType: 'Alert',
        entityId: alert.id,
        action: 'update',
        changes: { status: 'cerrada', resolution },
        userId: req.user.id,
        req,
      });

      res.json({
        success: true,
        message: 'Alerta resuelta',
        data: alert,
      });
    } catch (error) {
      next(error);
    }
  },

  // Escalar alerta
  async escalate(req, res, next) {
    try {
      const alert = await Alert.findByPk(req.params.id);

      if (!alert) {
        return res.status(404).json({
          success: false,
          message: 'Alerta no encontrada',
        });
      }

      const { reason } = req.body;

      await alert.update({
        status: 'escalada',
        resolution: reason,
      });

      await auditLogger.log({
        entityType: 'Alert',
        entityId: alert.id,
        action: 'update',
        changes: { status: 'escalada' },
        reason,
        userId: req.user.id,
        req,
      });

      res.json({
        success: true,
        message: 'Alerta escalada',
        data: alert,
      });
    } catch (error) {
      next(error);
    }
  },

  // Estadísticas de alertas
  async getStats(req, res, next) {
    try {
      const stats = await Alert.findAll({
        attributes: [
          'status',
          'severity',
          [require('sequelize').fn('COUNT', '*'), 'count'],
        ],
        group: ['status', 'severity'],
      });

      const pendingByType = await Alert.findAll({
        where: { status: 'pendiente' },
        attributes: [
          'alertType',
          [require('sequelize').fn('COUNT', '*'), 'count'],
        ],
        group: ['alertType'],
      });

      res.json({
        success: true,
        data: {
          byStatusAndSeverity: stats,
          pendingByType,
        },
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = alertController;
