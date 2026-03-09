const { Op } = require('sequelize');
const {
  InvestigationCase,
  DocumentRequest,
  CaseEvidence,
  Alert,
  UnusualOperation,
  Client,
  SuspiciousReport,
  PepDeclaration,
} = require('../models');
const auditLogger = require('../utils/auditLogger');

const investigationCaseController = {
  // Crear caso desde alerta
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

      // Verificar si ya existe un caso para esta alerta
      const existingCase = await InvestigationCase.findOne({
        where: { alertId: alert.id },
      });

      if (existingCase) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un caso de investigación para esta alerta',
          data: existingCase,
        });
      }

      const count = await InvestigationCase.count();
      const caseNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(6, '0')}`;

      const investigationCase = await InvestigationCase.create({
        caseNumber,
        alertId: alert.id,
        clientId: alert.clientId,
        title: `Investigación: ${alert.title}`,
        description: alert.description,
        priority: alert.severity === 'critica' ? 'critica' : alert.severity === 'alta' ? 'alta' : 'media',
        status: 'abierto',
        createdBy: req.user.id,
        assignedTo: req.user.id,
        openedAt: new Date(),
        lastActivityAt: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días por defecto
      });

      // Actualizar estado de la alerta
      await alert.update({ status: 'en_revision' });

      await auditLogger.log({
        entityType: 'InvestigationCase',
        entityId: investigationCase.id,
        action: 'create',
        changes: { fromAlert: alert.id, caseNumber },
        userId: req.user.id,
        req,
      });

      const fullCase = await InvestigationCase.findByPk(investigationCase.id, {
        include: [
          { model: Client },
          { model: Alert },
          { model: DocumentRequest, as: 'documentRequests' },
          { model: CaseEvidence, as: 'evidence' },
        ],
      });

      res.status(201).json({
        success: true,
        message: 'Caso de investigación creado exitosamente',
        data: fullCase,
      });
    } catch (error) {
      next(error);
    }
  },

  // Crear caso desde operación inusual
  async createFromUnusualOperation(req, res, next) {
    try {
      const unusualOp = await UnusualOperation.findByPk(req.params.unusualOperationId, {
        include: [{ model: Client }],
      });

      if (!unusualOp) {
        return res.status(404).json({
          success: false,
          message: 'Operación inusual no encontrada',
        });
      }

      // Verificar si ya existe un caso para esta operación
      const existingCase = await InvestigationCase.findOne({
        where: { unusualOperationId: unusualOp.id },
      });

      if (existingCase) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un caso de investigación para esta operación',
          data: existingCase,
        });
      }

      const count = await InvestigationCase.count();
      const caseNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(6, '0')}`;

      const investigationCase = await InvestigationCase.create({
        caseNumber,
        unusualOperationId: unusualOp.id,
        clientId: unusualOp.clientId,
        title: `Investigación: ${unusualOp.operationNumber}`,
        description: unusualOp.description,
        priority: 'alta',
        status: 'abierto',
        riskIndicators: unusualOp.unusualIndicators || [],
        createdBy: req.user.id,
        assignedTo: req.user.id,
        openedAt: new Date(),
        lastActivityAt: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      // Actualizar estado de la operación inusual
      await unusualOp.update({ status: 'en_analisis' });

      await auditLogger.log({
        entityType: 'InvestigationCase',
        entityId: investigationCase.id,
        action: 'create',
        changes: { fromUnusualOperation: unusualOp.id, caseNumber },
        userId: req.user.id,
        req,
      });

      const fullCase = await InvestigationCase.findByPk(investigationCase.id, {
        include: [
          { model: Client },
          { model: UnusualOperation },
          { model: DocumentRequest, as: 'documentRequests' },
          { model: CaseEvidence, as: 'evidence' },
        ],
      });

      res.status(201).json({
        success: true,
        message: 'Caso de investigación creado exitosamente',
        data: fullCase,
      });
    } catch (error) {
      next(error);
    }
  },

  // Obtener caso por ID
  async getById(req, res, next) {
    try {
      const investigationCase = await InvestigationCase.findByPk(req.params.id, {
        include: [
          {
            model: Client,
            include: [{ model: PepDeclaration, as: 'pepDeclarations' }]
          },
          { model: Alert },
          { model: UnusualOperation },
          { model: DocumentRequest, as: 'documentRequests' },
          { model: CaseEvidence, as: 'evidence' },
        ],
      });

      if (!investigationCase) {
        return res.status(404).json({
          success: false,
          message: 'Caso de investigación no encontrado',
        });
      }

      await auditLogger.log({
        entityType: 'InvestigationCase',
        entityId: investigationCase.id,
        action: 'view',
        userId: req.user.id,
        req,
      });

      res.json({
        success: true,
        data: investigationCase,
      });
    } catch (error) {
      next(error);
    }
  },

  // Listar casos
  async list(req, res, next) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        priority,
        clientId,
        assignedTo,
        sortBy = 'openedAt',
        sortOrder = 'DESC',
      } = req.query;

      const where = {};
      if (status) where.status = status;
      if (priority) where.priority = priority;
      if (clientId) where.clientId = clientId;
      if (assignedTo) where.assignedTo = assignedTo;

      const { count, rows } = await InvestigationCase.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit),
        order: [[sortBy, sortOrder]],
        include: [
          { model: Client, attributes: ['id', 'cuit', 'legalName', 'firstName', 'lastName'] },
          { model: Alert, attributes: ['id', 'alertType', 'severity', 'title'] },
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

  // Actualizar caso
  async update(req, res, next) {
    try {
      const investigationCase = await InvestigationCase.findByPk(req.params.id);

      if (!investigationCase) {
        return res.status(404).json({
          success: false,
          message: 'Caso de investigación no encontrado',
        });
      }

      const allowedUpdates = [
        'status',
        'priority',
        'title',
        'description',
        'analysisNotes',
        'riskIndicators',
        'mitigatingFactors',
        'assignedTo',
        'dueDate',
      ];

      const updates = {};
      allowedUpdates.forEach(field => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });
      updates.lastActivityAt = new Date();

      await investigationCase.update(updates);

      await auditLogger.log({
        entityType: 'InvestigationCase',
        entityId: investigationCase.id,
        action: 'update',
        changes: updates,
        userId: req.user.id,
        req,
      });

      const updatedCase = await InvestigationCase.findByPk(investigationCase.id, {
        include: [
          { model: Client },
          { model: Alert },
          { model: DocumentRequest, as: 'documentRequests' },
          { model: CaseEvidence, as: 'evidence' },
        ],
      });

      res.json({
        success: true,
        message: 'Caso actualizado exitosamente',
        data: updatedCase,
      });
    } catch (error) {
      next(error);
    }
  },

  // Crear solicitud de documentación
  async createDocumentRequest(req, res, next) {
    try {
      const investigationCase = await InvestigationCase.findByPk(req.params.caseId);

      if (!investigationCase) {
        return res.status(404).json({
          success: false,
          message: 'Caso de investigación no encontrado',
        });
      }

      const { requestType, description, priority, dueDate } = req.body;

      const documentRequest = await DocumentRequest.create({
        caseId: investigationCase.id,
        requestType,
        description,
        priority: priority || 'media',
        dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días por defecto
        status: 'pendiente',
      });

      await investigationCase.update({
        status: 'pendiente_documentacion',
        lastActivityAt: new Date(),
      });

      await auditLogger.log({
        entityType: 'DocumentRequest',
        entityId: documentRequest.id,
        action: 'create',
        changes: { caseId: investigationCase.id, requestType },
        userId: req.user.id,
        req,
      });

      res.status(201).json({
        success: true,
        message: 'Solicitud de documentación creada',
        data: documentRequest,
      });
    } catch (error) {
      next(error);
    }
  },

  // Actualizar solicitud de documentación
  async updateDocumentRequest(req, res, next) {
    try {
      const documentRequest = await DocumentRequest.findByPk(req.params.requestId);

      if (!documentRequest) {
        return res.status(404).json({
          success: false,
          message: 'Solicitud de documentación no encontrada',
        });
      }

      const allowedUpdates = [
        'status',
        'sentAt',
        'sentMethod',
        'receivedAt',
        'responseNotes',
        'documentUrl',
        'fileName',
        'reviewNotes',
        'dueDate',
      ];

      const updates = {};
      allowedUpdates.forEach(field => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });

      // Setear campos automáticos según el estado
      if (updates.status === 'enviada' && !updates.sentAt) {
        updates.sentAt = new Date();
        updates.sentBy = req.user.id;
      }
      if (updates.status === 'aprobada' || updates.status === 'rechazada') {
        updates.reviewedAt = new Date();
        updates.reviewedBy = req.user.id;
      }

      await documentRequest.update(updates);

      // Actualizar actividad del caso
      const investigationCase = await InvestigationCase.findByPk(documentRequest.caseId);
      if (investigationCase) {
        await investigationCase.update({ lastActivityAt: new Date() });
      }

      await auditLogger.log({
        entityType: 'DocumentRequest',
        entityId: documentRequest.id,
        action: 'update',
        changes: updates,
        userId: req.user.id,
        req,
      });

      res.json({
        success: true,
        message: 'Solicitud de documentación actualizada',
        data: documentRequest,
      });
    } catch (error) {
      next(error);
    }
  },

  // Subir evidencia
  async uploadEvidence(req, res, next) {
    try {
      const investigationCase = await InvestigationCase.findByPk(req.params.caseId);

      if (!investigationCase) {
        return res.status(404).json({
          success: false,
          message: 'Caso de investigación no encontrado',
        });
      }

      const { evidenceType, title, description, source, relevance, notes } = req.body;

      let fileData = {};
      if (req.file) {
        fileData = {
          fileUrl: `/uploads/evidence/${req.file.filename}`,
          fileName: req.file.originalname,
          mimeType: req.file.mimetype,
          fileSize: req.file.size,
        };
      }

      const evidence = await CaseEvidence.create({
        caseId: investigationCase.id,
        evidenceType,
        title,
        description,
        source: source || 'interno',
        relevance: relevance || 'media',
        notes,
        uploadedBy: req.user.id,
        uploadedAt: new Date(),
        ...fileData,
      });

      await investigationCase.update({ lastActivityAt: new Date() });

      await auditLogger.log({
        entityType: 'CaseEvidence',
        entityId: evidence.id,
        action: 'create',
        changes: { caseId: investigationCase.id, evidenceType, title },
        userId: req.user.id,
        req,
      });

      res.status(201).json({
        success: true,
        message: 'Evidencia agregada exitosamente',
        data: evidence,
      });
    } catch (error) {
      next(error);
    }
  },

  // Cerrar caso como justificado
  async closeAsJustified(req, res, next) {
    try {
      const investigationCase = await InvestigationCase.findByPk(req.params.id, {
        include: [{ model: Alert }],
      });

      if (!investigationCase) {
        return res.status(404).json({
          success: false,
          message: 'Caso de investigación no encontrado',
        });
      }

      const { decisionJustification, mitigatingFactors } = req.body;

      if (!decisionJustification) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere una justificación para cerrar el caso',
        });
      }

      await investigationCase.update({
        status: 'cerrado_justificado',
        finalDecision: 'justified',
        decisionJustification,
        mitigatingFactors: mitigatingFactors || investigationCase.mitigatingFactors,
        decisionDate: new Date(),
        decidedBy: req.user.id,
        closedAt: new Date(),
        lastActivityAt: new Date(),
      });

      // Actualizar alerta asociada
      if (investigationCase.Alert) {
        await investigationCase.Alert.update({
          status: 'cerrada',
          resolution: decisionJustification,
          resolvedBy: req.user.id,
          resolvedAt: new Date(),
        });
      }

      await auditLogger.log({
        entityType: 'InvestigationCase',
        entityId: investigationCase.id,
        action: 'update',
        changes: { status: 'cerrado_justificado', finalDecision: 'justified' },
        userId: req.user.id,
        req,
      });

      res.json({
        success: true,
        message: 'Caso cerrado como justificado',
        data: investigationCase,
      });
    } catch (error) {
      next(error);
    }
  },

  // Escalar caso como sospechoso (genera ROS)
  async escalateAsSuspicious(req, res, next) {
    try {
      const investigationCase = await InvestigationCase.findByPk(req.params.id, {
        include: [
          { model: Alert },
          { model: Client },
        ],
      });

      if (!investigationCase) {
        return res.status(404).json({
          success: false,
          message: 'Caso de investigación no encontrado',
        });
      }

      const { decisionJustification, suspicionDescription, riskIndicators } = req.body;

      if (!decisionJustification || !suspicionDescription) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere justificación y descripción de la sospecha',
        });
      }

      await investigationCase.update({
        status: 'escalado_sospechoso',
        finalDecision: 'suspicious',
        decisionJustification,
        riskIndicators: riskIndicators || investigationCase.riskIndicators,
        decisionDate: new Date(),
        decidedBy: req.user.id,
        closedAt: new Date(),
        lastActivityAt: new Date(),
      });

      // Generar ROS
      const rosCount = await SuspiciousReport.count();
      const ros = await SuspiciousReport.create({
        reportNumber: `ROS-${new Date().getFullYear()}-${String(rosCount + 1).padStart(6, '0')}`,
        reportDate: new Date(),
        clientId: investigationCase.clientId,
        suspicionType: 'investigacion_caso',
        suspicionDescription,
        supportingEvidence: decisionJustification,
        createdBy: req.user.id,
        isConfidential: true,
      });

      // Actualizar alerta asociada
      if (investigationCase.Alert) {
        await investigationCase.Alert.update({
          status: 'escalada',
          resolution: `Escalado a ROS: ${ros.reportNumber}`,
          resolvedBy: req.user.id,
          resolvedAt: new Date(),
        });
      }

      await auditLogger.log({
        entityType: 'InvestigationCase',
        entityId: investigationCase.id,
        action: 'update',
        changes: {
          status: 'escalado_sospechoso',
          finalDecision: 'suspicious',
          rosGenerated: ros.reportNumber,
        },
        userId: req.user.id,
        req,
      });

      res.json({
        success: true,
        message: 'Caso escalado como sospechoso. ROS generado.',
        data: {
          investigationCase,
          ros,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // Obtener estadísticas de casos
  async getStats(req, res, next) {
    try {
      const totalCases = await InvestigationCase.count();
      const openCases = await InvestigationCase.count({
        where: { status: { [Op.in]: ['abierto', 'en_investigacion', 'pendiente_documentacion'] } },
      });
      const closedJustified = await InvestigationCase.count({
        where: { status: 'cerrado_justificado' },
      });
      const escalatedSuspicious = await InvestigationCase.count({
        where: { status: 'escalado_sospechoso' },
      });
      const pendingDocuments = await InvestigationCase.count({
        where: { status: 'pendiente_documentacion' },
      });

      // Casos por prioridad
      const byPriority = await InvestigationCase.findAll({
        attributes: [
          'priority',
          [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count'],
        ],
        where: { status: { [Op.in]: ['abierto', 'en_investigacion', 'pendiente_documentacion'] } },
        group: ['priority'],
      });

      res.json({
        success: true,
        data: {
          totalCases,
          openCases,
          closedJustified,
          escalatedSuspicious,
          pendingDocuments,
          byPriority,
        },
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = investigationCaseController;
