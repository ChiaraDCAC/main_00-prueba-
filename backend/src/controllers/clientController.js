const { Op } = require('sequelize');
const {
  Client,
  BeneficialOwner,
  Signatory,
  Attorney,
  Authority,
  Document,
  RiskAssessment,
  ScreeningResult,
} = require('../models');
const auditLogger = require('../utils/auditLogger');
const riskService = require('../services/riskService');
const screeningService = require('../services/screeningService');
const validationService = require('../services/validationService');

const clientController = {
  // Listar clientes con filtros
  async list(req, res, next) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        clientType,
        riskLevel,
        search,
        sortBy = 'createdAt',
        sortOrder = 'DESC',
      } = req.query;

      const where = {};
      if (status) where.status = status;
      if (clientType) where.clientType = clientType;
      if (riskLevel) where.riskLevel = riskLevel;
      if (search) {
        // Use Op.like for SQLite compatibility (case insensitive by default in SQLite)
        where[Op.or] = [
          { cuit: { [Op.like]: `%${search}%` } },
          { legalName: { [Op.like]: `%${search}%` } },
          { tradeName: { [Op.like]: `%${search}%` } },
          { firstName: { [Op.like]: `%${search}%` } },
          { lastName: { [Op.like]: `%${search}%` } },
        ];
      }

      const { count, rows } = await Client.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit),
        order: [[sortBy, sortOrder]],
        include: [
          'creator',
          { model: BeneficialOwner, as: 'beneficialOwners' },
          { model: Signatory, as: 'signatories' },
          { model: Attorney, as: 'attorneys' },
          { model: Authority, as: 'authorities' },
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

  // Obtener cliente por ID con toda la información
  async getById(req, res, next) {
    try {
      const client = await Client.findByPk(req.params.id, {
        include: [
          { model: BeneficialOwner, as: 'beneficialOwners' },
          { model: Signatory, as: 'signatories' },
          { model: Attorney, as: 'attorneys' },
          { model: Authority, as: 'authorities' },
          { model: Document, as: 'documents' },
          { model: RiskAssessment, as: 'riskAssessments', limit: 5, order: [['createdAt', 'DESC']] },
          { model: ScreeningResult, as: 'screeningResults', limit: 5, order: [['createdAt', 'DESC']] },
        ],
      });

      if (!client) {
        return res.status(404).json({
          success: false,
          message: 'Cliente no encontrado',
        });
      }

      await auditLogger.log({
        entityType: 'Client',
        entityId: client.id,
        action: 'view',
        userId: req.user.id,
        req,
      });

      res.json({
        success: true,
        data: client,
      });
    } catch (error) {
      next(error);
    }
  },

  // Crear nuevo cliente (Alta)
  async create(req, res, next) {
    try {
      const clientData = req.body;
      clientData.createdBy = req.user.id;
      clientData.status = 'pendiente';

      const client = await Client.create(clientData);

      // Ejecutar screening inicial
      await screeningService.performScreening(client.id, 'alta');

      // Calcular riesgo inicial
      await riskService.calculateRisk(client.id, 'inicial', req.user.id);

      await auditLogger.log({
        entityType: 'Client',
        entityId: client.id,
        action: 'create',
        changes: clientData,
        userId: req.user.id,
        req,
      });

      res.status(201).json({
        success: true,
        message: 'Cliente creado exitosamente',
        data: client,
      });
    } catch (error) {
      next(error);
    }
  },

  // Actualizar cliente (Modificación)
  async update(req, res, next) {
    try {
      const client = await Client.findByPk(req.params.id);

      if (!client) {
        return res.status(404).json({
          success: false,
          message: 'Cliente no encontrado',
        });
      }

      const { reason, ...updateData } = req.body;
      const previousData = client.toJSON();

      await client.update(updateData);

      // Ejecutar screening si hay modificaciones relevantes
      const relevantFields = ['cuit', 'firstName', 'lastName', 'legalName'];
      const hasRelevantChanges = relevantFields.some(field => updateData[field]);
      if (hasRelevantChanges) {
        await screeningService.performScreening(client.id, 'modificacion');
      }

      await auditLogger.log({
        entityType: 'Client',
        entityId: client.id,
        action: 'update',
        changes: { previous: previousData, new: updateData },
        reason,
        userId: req.user.id,
        req,
      });

      res.json({
        success: true,
        message: 'Cliente actualizado exitosamente',
        data: client,
      });
    } catch (error) {
      next(error);
    }
  },

  // Dar de baja cliente
  async deactivate(req, res, next) {
    try {
      const client = await Client.findByPk(req.params.id);

      if (!client) {
        return res.status(404).json({
          success: false,
          message: 'Cliente no encontrado',
        });
      }

      const { reason } = req.body;

      await client.update({
        status: 'baja',
        notes: reason,
      });

      await auditLogger.log({
        entityType: 'Client',
        entityId: client.id,
        action: 'update',
        changes: { status: 'baja' },
        reason,
        userId: req.user.id,
        req,
      });

      res.json({
        success: true,
        message: 'Cliente dado de baja exitosamente',
      });
    } catch (error) {
      next(error);
    }
  },

  // Aprobar cliente
  async approve(req, res, next) {
    try {
      const client = await Client.findByPk(req.params.id);

      if (!client) {
        return res.status(404).json({
          success: false,
          message: 'Cliente no encontrado',
        });
      }

      // Validate documents before approval
      const validation = await validationService.validateClientDocuments(client.id);

      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'No se puede aprobar el cliente. Faltan documentos obligatorios.',
          missingDocuments: validation.missingDocuments
        });
      }

      await client.update({
        status: 'aprobado',
        approvedBy: req.user.id,
        approvedAt: new Date(),
      });

      await auditLogger.log({
        entityType: 'Client',
        entityId: client.id,
        action: 'approve',
        changes: { status: 'aprobado' },
        userId: req.user.id,
        req,
      });

      res.json({
        success: true,
        message: 'Cliente aprobado exitosamente',
        data: client,
      });
    } catch (error) {
      next(error);
    }
  },

  // Rechazar cliente
  async reject(req, res, next) {
    try {
      const client = await Client.findByPk(req.params.id);

      if (!client) {
        return res.status(404).json({
          success: false,
          message: 'Cliente no encontrado',
        });
      }

      const { reason } = req.body;

      await client.update({
        status: 'rechazado',
        rejectionReason: reason,
      });

      await auditLogger.log({
        entityType: 'Client',
        entityId: client.id,
        action: 'reject',
        changes: { status: 'rechazado' },
        reason,
        userId: req.user.id,
        req,
      });

      res.json({
        success: true,
        message: 'Cliente rechazado',
      });
    } catch (error) {
      next(error);
    }
  },

  // Marcar flag de fraude
  async setFraudFlag(req, res, next) {
    try {
      const client = await Client.findByPk(req.params.id);

      if (!client) {
        return res.status(404).json({
          success: false,
          message: 'Cliente no encontrado',
        });
      }

      const { hasFraudFlag, reason } = req.body;

      await client.update({
        hasFraudFlag,
        fraudFlagReason: reason,
        fraudFlagDate: hasFraudFlag ? new Date() : null,
      });

      await auditLogger.log({
        entityType: 'Client',
        entityId: client.id,
        action: 'update',
        changes: { hasFraudFlag, fraudFlagReason: reason },
        reason: `Flag de fraude ${hasFraudFlag ? 'activado' : 'desactivado'}`,
        userId: req.user.id,
        req,
      });

      res.json({
        success: true,
        message: `Flag de fraude ${hasFraudFlag ? 'activado' : 'desactivado'}`,
      });
    } catch (error) {
      next(error);
    }
  },

  // Obtener historial de auditoría del cliente
  async getAuditHistory(req, res, next) {
    try {
      const history = await auditLogger.getHistory('Client', req.params.id);

      res.json({
        success: true,
        data: history,
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = clientController;
