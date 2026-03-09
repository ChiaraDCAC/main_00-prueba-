const { Op } = require('sequelize');
const { UnusualOperation, Client, SuspiciousReport, Alert } = require('../models');
const auditLogger = require('../utils/auditLogger');

const unusualOperationController = {
  // Listar operaciones inusuales
  async list(req, res, next) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        clientId,
        dateFrom,
        dateTo,
        sortBy = 'detectionDate',
        sortOrder = 'DESC',
      } = req.query;

      const where = {};
      if (status) where.status = status;
      if (clientId) where.clientId = clientId;
      if (dateFrom || dateTo) {
        where.detectionDate = {};
        if (dateFrom) where.detectionDate[Op.gte] = new Date(dateFrom);
        if (dateTo) where.detectionDate[Op.lte] = new Date(dateTo);
      }

      const { count, rows } = await UnusualOperation.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit),
        order: [[sortBy, sortOrder]],
        include: [
          { model: Client, attributes: ['id', 'cuit', 'legalName', 'firstName', 'lastName'] },
          { model: SuspiciousReport, as: 'suspiciousReport' },
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

  // Obtener OI por ID
  async getById(req, res, next) {
    try {
      const operation = await UnusualOperation.findByPk(req.params.id, {
        include: [
          { model: Client },
          { model: SuspiciousReport, as: 'suspiciousReport' },
        ],
      });

      if (!operation) {
        return res.status(404).json({
          success: false,
          message: 'Operación inusual no encontrada',
        });
      }

      await auditLogger.log({
        entityType: 'UnusualOperation',
        entityId: operation.id,
        action: 'view',
        userId: req.user.id,
        req,
      });

      res.json({
        success: true,
        data: operation,
      });
    } catch (error) {
      next(error);
    }
  },

  // Crear OI manual
  async create(req, res, next) {
    try {
      const data = req.body;

      // Generar número de operación
      const count = await UnusualOperation.count();
      data.operationNumber = `OI-${new Date().getFullYear()}-${String(count + 1).padStart(6, '0')}`;
      data.detectionDate = new Date();

      const operation = await UnusualOperation.create(data);

      await auditLogger.log({
        entityType: 'UnusualOperation',
        entityId: operation.id,
        action: 'create',
        changes: data,
        userId: req.user.id,
        req,
      });

      res.status(201).json({
        success: true,
        message: 'Operación inusual registrada',
        data: operation,
      });
    } catch (error) {
      next(error);
    }
  },

  // Analizar OI
  async analyze(req, res, next) {
    try {
      const operation = await UnusualOperation.findByPk(req.params.id);

      if (!operation) {
        return res.status(404).json({
          success: false,
          message: 'Operación inusual no encontrada',
        });
      }

      const { analysis } = req.body;

      await operation.update({
        status: 'en_analisis',
        analysis,
        analyzedBy: req.user.id,
        analyzedAt: new Date(),
      });

      await auditLogger.log({
        entityType: 'UnusualOperation',
        entityId: operation.id,
        action: 'update',
        changes: { status: 'en_analisis', analysis },
        userId: req.user.id,
        req,
      });

      res.json({
        success: true,
        message: 'Análisis registrado',
        data: operation,
      });
    } catch (error) {
      next(error);
    }
  },

  // Clasificar OI como justificada
  async markAsJustified(req, res, next) {
    try {
      const operation = await UnusualOperation.findByPk(req.params.id);

      if (!operation) {
        return res.status(404).json({
          success: false,
          message: 'Operación inusual no encontrada',
        });
      }

      const { conclusion } = req.body;

      await operation.update({
        status: 'justificada',
        conclusion,
        approvedBy: req.user.id,
        approvedAt: new Date(),
      });

      await auditLogger.log({
        entityType: 'UnusualOperation',
        entityId: operation.id,
        action: 'update',
        changes: { status: 'justificada', conclusion },
        userId: req.user.id,
        req,
      });

      res.json({
        success: true,
        message: 'Operación clasificada como justificada',
        data: operation,
      });
    } catch (error) {
      next(error);
    }
  },

  // Clasificar OI como sospechosa (genera ROS)
  async markAsSuspicious(req, res, next) {
    try {
      const operation = await UnusualOperation.findByPk(req.params.id, {
        include: [{ model: Client }],
      });

      if (!operation) {
        return res.status(404).json({
          success: false,
          message: 'Operación inusual no encontrada',
        });
      }

      const { conclusion, suspicionDescription } = req.body;

      await operation.update({
        status: 'sospechosa',
        conclusion,
        approvedBy: req.user.id,
        approvedAt: new Date(),
      });

      // Generar ROS
      const rosCount = await SuspiciousReport.count();
      const ros = await SuspiciousReport.create({
        reportNumber: `ROS-${new Date().getFullYear()}-${String(rosCount + 1).padStart(6, '0')}`,
        reportDate: new Date(),
        clientId: operation.clientId,
        unusualOperationId: operation.id,
        suspicionDescription: suspicionDescription || conclusion,
        totalAmount: operation.amount,
        currency: operation.currency,
        createdBy: req.user.id,
        isConfidential: true,
      });

      await auditLogger.log({
        entityType: 'UnusualOperation',
        entityId: operation.id,
        action: 'update',
        changes: { status: 'sospechosa', rosGenerated: ros.reportNumber },
        userId: req.user.id,
        req,
      });

      res.json({
        success: true,
        message: 'Operación clasificada como sospechosa. ROS generado.',
        data: {
          operation,
          ros,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // Crear OI desde alerta
  async createFromAlert(req, res, next) {
    try {
      const alert = await Alert.findByPk(req.params.alertId, {
        include: [{ model: Client }],
      });

      if (!alert) {
        return res.status(404).json({
          success: false,
          message: 'Alerta no encontrada',
        });
      }

      const count = await UnusualOperation.count();
      const operation = await UnusualOperation.create({
        operationNumber: `OI-${new Date().getFullYear()}-${String(count + 1).padStart(6, '0')}`,
        clientId: alert.clientId,
        detectionDate: new Date(),
        operationType: alert.alertType,
        description: `Generado desde alerta: ${alert.title}. ${alert.description}`,
        unusualIndicators: [alert.alertType],
        status: 'pendiente',
      });

      await auditLogger.log({
        entityType: 'UnusualOperation',
        entityId: operation.id,
        action: 'create',
        changes: { fromAlert: alert.id },
        userId: req.user.id,
        req,
      });

      res.status(201).json({
        success: true,
        message: 'Operación inusual creada desde alerta',
        data: operation,
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = unusualOperationController;
