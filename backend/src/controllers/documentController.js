const path = require('path');
const fs = require('fs').promises;
const { Document, Client } = require('../models');
const auditLogger = require('../utils/auditLogger');

const documentController = {
  // Listar documentos de un cliente
  async listByClient(req, res, next) {
    try {
      const { clientId } = req.params;
      const { category, expired } = req.query;

      const where = { clientId };
      if (category) where.documentCategory = category;
      if (expired === 'true') where.isExpired = true;

      const documents = await Document.findAll({
        where,
        order: [['createdAt', 'DESC']],
      });

      res.json({
        success: true,
        data: documents,
      });
    } catch (error) {
      next(error);
    }
  },

  // Subir documento
  async upload(req, res, next) {
    try {
      const { clientId } = req.params;
      const { documentType, documentCategory, issueDate, expirationDate, notes } = req.body;

      const client = await Client.findByPk(clientId);
      if (!client) {
        return res.status(404).json({
          success: false,
          message: 'Cliente no encontrado',
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No se ha proporcionado ningún archivo',
        });
      }

      const document = await Document.create({
        clientId,
        documentType,
        documentCategory,
        fileName: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        issueDate,
        expirationDate,
        isExpired: expirationDate ? new Date(expirationDate) < new Date() : false,
        notes,
      });

      await auditLogger.log({
        entityType: 'Document',
        entityId: document.id,
        action: 'create',
        changes: { documentType, documentCategory, fileName: req.file.originalname },
        userId: req.user.id,
        req,
      });

      res.status(201).json({
        success: true,
        message: 'Documento subido exitosamente',
        data: document,
      });
    } catch (error) {
      next(error);
    }
  },

  // Descargar documento
  async download(req, res, next) {
    try {
      const document = await Document.findByPk(req.params.id);

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Documento no encontrado',
        });
      }

      await auditLogger.log({
        entityType: 'Document',
        entityId: document.id,
        action: 'view',
        userId: req.user.id,
        req,
      });

      res.download(document.path, document.originalName);
    } catch (error) {
      next(error);
    }
  },

  // Verificar documento
  async verify(req, res, next) {
    try {
      const document = await Document.findByPk(req.params.id);

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Documento no encontrado',
        });
      }

      await document.update({
        verifiedBy: req.user.id,
        verifiedAt: new Date(),
      });

      await auditLogger.log({
        entityType: 'Document',
        entityId: document.id,
        action: 'approve',
        changes: { verified: true },
        userId: req.user.id,
        req,
      });

      res.json({
        success: true,
        message: 'Documento verificado',
        data: document,
      });
    } catch (error) {
      next(error);
    }
  },

  // Eliminar documento
  async delete(req, res, next) {
    try {
      const document = await Document.findByPk(req.params.id);

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Documento no encontrado',
        });
      }

      const { reason } = req.body;

      // Eliminar archivo físico
      try {
        await fs.unlink(document.path);
      } catch (err) {
        console.error('Error deleting file:', err);
      }

      await auditLogger.log({
        entityType: 'Document',
        entityId: document.id,
        action: 'delete',
        changes: { documentType: document.documentType, fileName: document.originalName },
        reason,
        userId: req.user.id,
        req,
      });

      await document.destroy();

      res.json({
        success: true,
        message: 'Documento eliminado',
      });
    } catch (error) {
      next(error);
    }
  },

  // Obtener documentos próximos a vencer
  async getExpiring(req, res, next) {
    try {
      const { days = 30 } = req.query;
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + parseInt(days));

      const documents = await Document.findAll({
        where: {
          expirationDate: {
            [require('sequelize').Op.between]: [new Date(), futureDate],
          },
          isExpired: false,
        },
        include: [{
          model: Client,
          attributes: ['id', 'cuit', 'legalName', 'firstName', 'lastName'],
        }],
        order: [['expirationDate', 'ASC']],
      });

      res.json({
        success: true,
        data: documents,
      });
    } catch (error) {
      next(error);
    }
  },

  // Actualizar estado de documentos vencidos
  async updateExpiredStatus(req, res, next) {
    try {
      const [affectedRows] = await Document.update(
        { isExpired: true },
        {
          where: {
            expirationDate: {
              [require('sequelize').Op.lt]: new Date(),
            },
            isExpired: false,
          },
        }
      );

      res.json({
        success: true,
        message: `${affectedRows} documentos marcados como vencidos`,
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = documentController;
