const { Op } = require('sequelize');
const { SuspiciousReport, UnusualOperation, Client, Document } = require('../models');
const auditLogger = require('../utils/auditLogger');

const rosController = {
  // Listar ROS (solo usuarios autorizados)
  async list(req, res, next) {
    try {
      // Verificar rol autorizado para ver ROS
      if (!['admin', 'supervisor'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'No autorizado para ver reportes confidenciales',
        });
      }

      const {
        page = 1,
        limit = 20,
        status,
        dateFrom,
        dateTo,
      } = req.query;

      const where = {};
      if (status) where.status = status;
      if (dateFrom || dateTo) {
        where.reportDate = {};
        if (dateFrom) where.reportDate[Op.gte] = new Date(dateFrom);
        if (dateTo) where.reportDate[Op.lte] = new Date(dateTo);
      }

      const { count, rows } = await SuspiciousReport.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit),
        order: [['reportDate', 'DESC']],
        include: [
          { model: Client, attributes: ['id', 'cuit', 'legalName', 'firstName', 'lastName'] },
          { model: UnusualOperation },
        ],
      });

      await auditLogger.log({
        entityType: 'SuspiciousReport',
        entityId: 'list',
        action: 'view',
        userId: req.user.id,
        req,
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

  // Obtener ROS por ID
  async getById(req, res, next) {
    try {
      if (!['admin', 'supervisor'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'No autorizado para ver reportes confidenciales',
        });
      }

      const ros = await SuspiciousReport.findByPk(req.params.id, {
        include: [
          { model: Client },
          { model: UnusualOperation },
        ],
      });

      if (!ros) {
        return res.status(404).json({
          success: false,
          message: 'ROS no encontrado',
        });
      }

      await auditLogger.log({
        entityType: 'SuspiciousReport',
        entityId: ros.id,
        action: 'view',
        userId: req.user.id,
        req,
      });

      res.json({
        success: true,
        data: ros,
      });
    } catch (error) {
      next(error);
    }
  },

  // Actualizar ROS
  async update(req, res, next) {
    try {
      if (!['admin', 'supervisor'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'No autorizado para modificar reportes confidenciales',
        });
      }

      const ros = await SuspiciousReport.findByPk(req.params.id);

      if (!ros) {
        return res.status(404).json({
          success: false,
          message: 'ROS no encontrado',
        });
      }

      if (ros.status === 'enviado' || ros.status === 'confirmado') {
        return res.status(400).json({
          success: false,
          message: 'No se puede modificar un ROS ya enviado',
        });
      }

      const updateData = req.body;
      await ros.update(updateData);

      await auditLogger.log({
        entityType: 'SuspiciousReport',
        entityId: ros.id,
        action: 'update',
        changes: updateData,
        userId: req.user.id,
        req,
      });

      res.json({
        success: true,
        message: 'ROS actualizado',
        data: ros,
      });
    } catch (error) {
      next(error);
    }
  },

  // Marcar ROS como enviado
  async submit(req, res, next) {
    try {
      if (!['admin', 'supervisor'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'No autorizado',
        });
      }

      const ros = await SuspiciousReport.findByPk(req.params.id);

      if (!ros) {
        return res.status(404).json({
          success: false,
          message: 'ROS no encontrado',
        });
      }

      const { uifReference } = req.body;

      await ros.update({
        status: 'enviado',
        submittedBy: req.user.id,
        submittedAt: new Date(),
        uifReference,
      });

      await auditLogger.log({
        entityType: 'SuspiciousReport',
        entityId: ros.id,
        action: 'update',
        changes: { status: 'enviado', uifReference },
        userId: req.user.id,
        req,
      });

      res.json({
        success: true,
        message: 'ROS marcado como enviado',
        data: ros,
      });
    } catch (error) {
      next(error);
    }
  },

  // Confirmar recepción de ROS
  async confirm(req, res, next) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Solo administradores pueden confirmar ROS',
        });
      }

      const ros = await SuspiciousReport.findByPk(req.params.id);

      if (!ros) {
        return res.status(404).json({
          success: false,
          message: 'ROS no encontrado',
        });
      }

      await ros.update({
        status: 'confirmado',
      });

      await auditLogger.log({
        entityType: 'SuspiciousReport',
        entityId: ros.id,
        action: 'update',
        changes: { status: 'confirmado' },
        userId: req.user.id,
        req,
      });

      res.json({
        success: true,
        message: 'ROS confirmado',
        data: ros,
      });
    } catch (error) {
      next(error);
    }
  },

  // Agregar evidencia al ROS
  async addEvidence(req, res, next) {
    try {
      const ros = await SuspiciousReport.findByPk(req.params.id);

      if (!ros) {
        return res.status(404).json({
          success: false,
          message: 'ROS no encontrado',
        });
      }

      const { evidence } = req.body;
      const currentEvidence = ros.supportingEvidence || '';
      const newEvidence = currentEvidence + '\n\n' + `[${new Date().toISOString()}] ${evidence}`;

      await ros.update({
        supportingEvidence: newEvidence.trim(),
      });

      await auditLogger.log({
        entityType: 'SuspiciousReport',
        entityId: ros.id,
        action: 'update',
        changes: { evidenceAdded: true },
        userId: req.user.id,
        req,
      });

      res.json({
        success: true,
        message: 'Evidencia agregada',
        data: ros,
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = rosController;
