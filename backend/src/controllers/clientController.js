const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs').promises;
const {
  sequelize,
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

// Categorías de documentos por tipo
const DOCUMENT_CATEGORIES = {
  estatuto: 'societario', contrato_social: 'societario', contrato_privado: 'societario',
  acta_autoridades: 'societario', acta_asamblea: 'societario', acta_asamblea_srl: 'societario',
  registro_accionistas: 'societario', registro_socios: 'societario', registro_socios_srl: 'societario',
  declaratoria_herederos: 'societario', ficha_sucesion: 'societario',
  dni_socios: 'identificacion', dni_herederos: 'identificacion', constancia_cuit: 'identificacion',
  ddjj_pep: 'pep', ddjj_pep_monotributo: 'pep', ddjj_representante: 'otro',
  ddjj_beneficiarios_finales: 'beneficiario_final', poder: 'apoderado', poder_administracion: 'apoderado',
};

// Guarda un archivo base64 en disco y retorna el nombre del archivo
async function saveBase64File(dataUrl, originalName, clientId) {
  const uploadsDir = path.join(__dirname, '../../uploads', clientId);
  await fs.mkdir(uploadsDir, { recursive: true });

  const base64Data = dataUrl.replace(/^data:[^;]+;base64,/, '');
  const ext = path.extname(originalName) || '.pdf';
  const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;
  const filePath = path.join(uploadsDir, fileName);

  await fs.writeFile(filePath, Buffer.from(base64Data, 'base64'));
  return { fileName, filePath: path.join(clientId, fileName) };
}

// Mapea datosSociedad + formData al modelo Client
function mapToClientData(clientType, legalForm, datosSociedad = {}, formData = {}, dd = {}) {
  const allFormData = {};
  if (formData && typeof formData === 'object') {
    Object.values(formData).forEach(v => { if (v && typeof v === 'object') Object.assign(allFormData, v); });
  }

  const base = {
    clientType,
    legalForm,
    formData: allFormData,
    cuit: datosSociedad.cuit || allFormData.cuit || allFormData.sa_cuit || allFormData.srl_cuit || '',
    address: datosSociedad.domicilioLegal || allFormData.domicilio || '',
    mainActivity: datosSociedad.actividadPrincipal || allFormData.actividad || '',
    expectedMonthlyAmount: dd.ventasEstimadasAnuales ? parseFloat(dd.ventasEstimadasAnuales) / 12 : null,
  };

  if (clientType === 'persona_juridica') {
    Object.assign(base, {
      legalName: datosSociedad.razonSocial || allFormData.denominacion_social || allFormData.srl_razon_social || '',
      tradeName: datosSociedad.nombreFantasia || allFormData.nombre_fantasia || '',
      incorporationDate: datosSociedad.fechaConstitucion || null,
      registrationNumber: datosSociedad.inscripcionIGJ || allFormData.inscripcion_igj || '',
    });
  } else {
    Object.assign(base, {
      firstName: datosSociedad.nombre || allFormData.nombre || '',
      lastName: datosSociedad.apellido || allFormData.apellido || '',
      dni: datosSociedad.dni || allFormData.dni || '',
      birthDate: datosSociedad.fechaNacimiento || null,
      nationality: datosSociedad.nacionalidad || 'Argentina',
      occupation: datosSociedad.ocupacion || allFormData.ocupacion || '',
    });
  }

  return base;
}

// Mapea una persona del frontend a los modelos relacionados
function mapPersonaToModels(persona, clientId) {
  const base = {
    clientId,
    firstName: persona.nombre || '',
    lastName: persona.apellido || '',
    dni: persona.numeroDocumento || '',
    cuit: persona.cuit || '',
    isPep: !!persona.esPep,
    pepPosition: persona.pepCargo || '',
    isActive: true,
  };

  const beneficialOwner = persona.esBeneficiarioFinal ? {
    ...base,
    ownershipPercentage: parseFloat(persona.porcentaje) || null,
    nationality: persona.nacionalidad || 'Argentina',
    address: persona.domicilio || '',
  } : null;

  const signatory = persona.esFirmante ? {
    ...base,
    position: persona.cargo || '',
    signatureType: persona.tipoFirma || 'individual',
  } : null;

  const attorney = persona.esApoderado ? {
    ...base,
    powerType: persona.tipoPoder || 'general',
    powerScope: persona.facultades || '',
    grantDate: persona.fechaOtorgamiento || null,
    expirationDate: persona.fechaVencimientoPoder || null,
  } : null;

  const authority = (persona.esAutoridad || persona.esAdministrador) ? {
    ...base,
    position: persona.cargo || persona.tipoAdministrador || '',
    appointmentDate: persona.fechaOtorgamiento || null,
  } : null;

  return { beneficialOwner, signatory, attorney, authority };
}

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

  // Alta completa de cliente (onboarding)
  async createOnboarding(req, res, next) {
    const t = await sequelize.transaction();
    try {
      const {
        clientType,
        legalForm,
        datosSociedad = {},
        formData = {},
        dd = {},
        personas = [],
        uploadedDocsData = {},
      } = req.body;

      if (!clientType) {
        await t.rollback();
        return res.status(400).json({ success: false, message: 'clientType es requerido' });
      }

      // 1. Armar datos del cliente
      const clientData = mapToClientData(clientType, legalForm, datosSociedad, formData, dd);
      clientData.createdBy = req.user.id;
      clientData.status = 'pendiente';

      if (!clientData.cuit) {
        await t.rollback();
        return res.status(400).json({ success: false, message: 'CUIT es requerido' });
      }

      // 2. Crear cliente
      const client = await Client.create(clientData, { transaction: t });

      // 3. Crear personas relacionadas
      for (const persona of personas) {
        const { beneficialOwner, signatory, attorney, authority } = mapPersonaToModels(persona, client.id);
        if (beneficialOwner) await BeneficialOwner.create(beneficialOwner, { transaction: t });
        if (signatory) await Signatory.create(signatory, { transaction: t });
        if (attorney) await Attorney.create(attorney, { transaction: t });
        if (authority) await Authority.create(authority, { transaction: t });
      }

      // 4. Guardar documentos (base64 → archivo en disco + registro en DB)
      for (const [docType, docData] of Object.entries(uploadedDocsData)) {
        if (!docData?.dataUrl) continue;
        try {
          const { fileName, filePath } = await saveBase64File(docData.dataUrl, docData.name || `${docType}.pdf`, client.id);
          await Document.create({
            clientId: client.id,
            documentType: docType,
            documentCategory: DOCUMENT_CATEGORIES[docType] || 'otro',
            fileName,
            originalName: docData.name || `${docType}.pdf`,
            mimeType: docData.dataUrl.match(/^data:([^;]+)/)?.[1] || 'application/pdf',
            path: filePath,
          }, { transaction: t });
        } catch (docError) {
          // No bloquear el alta si falla un documento
          console.error(`Error guardando documento ${docType}:`, docError.message);
        }
      }

      await t.commit();

      // 5. Screening y riesgo (fuera de la transacción para no bloquear)
      try {
        await screeningService.performScreening(client.id, 'alta');
        await riskService.calculateRisk(client.id, 'inicial', req.user.id);
      } catch (err) {
        console.error('Error en screening/riesgo post-alta:', err.message);
      }

      await auditLogger.log({
        entityType: 'Client',
        entityId: client.id,
        action: 'create',
        changes: { clientType, legalForm, cuit: clientData.cuit },
        userId: req.user.id,
        req,
      });

      const clientConRelaciones = await Client.findByPk(client.id, {
        include: [
          { model: BeneficialOwner, as: 'beneficialOwners' },
          { model: Signatory, as: 'signatories' },
          { model: Attorney, as: 'attorneys' },
          { model: Authority, as: 'authorities' },
          { model: Document, as: 'documents' },
        ],
      });

      res.status(201).json({
        success: true,
        message: 'Cliente creado exitosamente',
        data: clientConRelaciones,
      });
    } catch (error) {
      await t.rollback();
      next(error);
    }
  },
};

module.exports = clientController;
