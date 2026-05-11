const { Op, literal } = require('sequelize');
const { OperacionInusual, OIComentario, OIAdjunto, SociedadTag, Usuario, sequelize } = require('../models');
const auditLogger = require('../utils/auditLogger');
const path = require('path');
const fs = require('fs');

const unusualOperationController = {

  // GET /api/unusual-operations
  async list(req, res, next) {
    try {
      const { page = 1, limit = 20, status, clientId, dateFrom, dateTo } = req.query;

      const where = {};
      if (status) where.estado = status;
      if (clientId) where.id_sociedad = clientId;
      if (dateFrom || dateTo) {
        where.fecha_operacion = {};
        if (dateFrom) where.fecha_operacion[Op.gte] = dateFrom;
        if (dateTo)   where.fecha_operacion[Op.lte] = dateTo;
      }

      const { count, rows } = await OperacionInusual.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit),
        order: [['created_at', 'DESC']],
        include: [
          { model: SociedadTag, attributes: ['id_sociedad', 'razon_social', 'cuit_cuil'] },
          { model: Usuario, as: 'Usuario', attributes: ['id', 'nombre', 'apellido'] },
        ],
      });

      res.json({
        success: true,
        data: rows,
        pagination: { total: count, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(count / parseInt(limit)) },
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/unusual-operations/:id
  async getById(req, res, next) {
    try {
      const oi = await OperacionInusual.findByPk(req.params.id, {
        include: [
          { model: SociedadTag, attributes: ['id_sociedad', 'razon_social', 'cuit_cuil'] },
          { model: OIComentario, include: [{ model: Usuario, attributes: ['id', 'nombre', 'apellido'] }], order: [['created_at', 'ASC']] },
          { model: OIAdjunto, include: [{ model: Usuario, attributes: ['id', 'nombre', 'apellido'] }] },
        ],
      });
      if (!oi) return res.status(404).json({ success: false, message: 'OI no encontrada' });
      res.json({ success: true, data: oi });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/unusual-operations (ingreso desde sistema externo)
  async create(req, res, next) {
    try {
      const nextNum = await sequelize.query("SELECT nextval('oi_codigo_seq') AS n", { type: sequelize.QueryTypes.SELECT });
      const codigo = `OI-${String(nextNum[0].n).padStart(4, '0')}`;

      const oi = await OperacionInusual.create({
        codigo,
        ...req.body,
        origen: req.body.origen || 'sistema_externo',
      });

      res.status(201).json({ success: true, data: oi });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/unusual-operations/:id/justify — cerrar como Justificada
  async markAsJustified(req, res, next) {
    try {
      const { comentario } = req.body;
      if (!comentario?.trim()) {
        return res.status(400).json({ success: false, message: 'El comentario es obligatorio para cerrar la OI' });
      }

      const oi = await OperacionInusual.findByPk(req.params.id);
      if (!oi) return res.status(404).json({ success: false, message: 'OI no encontrada' });
      if (oi.estado !== 'nueva') return res.status(400).json({ success: false, message: 'Solo se pueden cerrar OIs en estado Nueva' });

      await oi.update({ estado: 'justificada', comentario_cierre: comentario, cerrado_por: req.user.id, cerrado_en: new Date() });

      await OIComentario.create({ id_oi: oi.id, id_usuario: req.user.id, texto: `[CIERRE JUSTIFICADA] ${comentario}` });

      await auditLogger.log({ entityType: 'OperacionInusual', entityId: oi.id, action: 'justify', changes: { estado: 'justificada' }, userId: req.user.id, req });

      res.json({ success: true, data: oi });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/unusual-operations/:id/suspicious — cerrar como OS
  async markAsSuspicious(req, res, next) {
    try {
      const { comentario } = req.body;
      if (!comentario?.trim()) {
        return res.status(400).json({ success: false, message: 'El comentario es obligatorio para cerrar la OI como OS' });
      }

      const oi = await OperacionInusual.findByPk(req.params.id);
      if (!oi) return res.status(404).json({ success: false, message: 'OI no encontrada' });
      if (oi.estado !== 'nueva') return res.status(400).json({ success: false, message: 'Solo se pueden cerrar OIs en estado Nueva' });

      await oi.update({ estado: 'os', comentario_cierre: comentario, cerrado_por: req.user.id, cerrado_en: new Date() });

      await OIComentario.create({ id_oi: oi.id, id_usuario: req.user.id, texto: `[CIERRE OS] ${comentario}` });

      await auditLogger.log({ entityType: 'OperacionInusual', entityId: oi.id, action: 'suspicious', changes: { estado: 'os' }, userId: req.user.id, req });

      res.json({ success: true, data: oi, mensaje: 'OI cerrada como OS. El ROS debe emitirse fuera de la herramienta.' });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/unusual-operations/:id/comment
  async addComment(req, res, next) {
    try {
      const { texto } = req.body;
      if (!texto?.trim()) return res.status(400).json({ success: false, message: 'El comentario no puede estar vacío' });

      const oi = await OperacionInusual.findByPk(req.params.id);
      if (!oi) return res.status(404).json({ success: false, message: 'OI no encontrada' });

      const comentario = await OIComentario.create({ id_oi: oi.id, id_usuario: req.user.id, texto });
      res.status(201).json({ success: true, data: comentario });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/unusual-operations/:id/attachment
  async addAttachment(req, res, next) {
    try {
      if (!req.file) return res.status(400).json({ success: false, message: 'No se recibió ningún archivo' });

      const oi = await OperacionInusual.findByPk(req.params.id);
      if (!oi) return res.status(404).json({ success: false, message: 'OI no encontrada' });
      if (oi.estado !== 'nueva') return res.status(400).json({ success: false, message: 'No se pueden agregar adjuntos a una OI cerrada' });

      const adjunto = await OIAdjunto.create({
        id_oi: oi.id,
        id_usuario: req.user.id,
        nombre_archivo: req.file.originalname,
        url_archivo: `/api/uploads/${req.file.filename}`,
        mime_type: req.file.mimetype,
      });

      res.status(201).json({ success: true, data: adjunto });
    } catch (error) {
      next(error);
    }
  },

  // DELETE /api/unusual-operations/:id/attachment/:adjId
  async deleteAttachment(req, res, next) {
    try {
      const oi = await OperacionInusual.findByPk(req.params.id);
      if (!oi) return res.status(404).json({ success: false, message: 'OI no encontrada' });
      if (oi.estado !== 'nueva') return res.status(400).json({ success: false, message: 'No se pueden eliminar adjuntos de una OI cerrada' });

      const adjunto = await OIAdjunto.findByPk(req.params.adjId);
      if (!adjunto) return res.status(404).json({ success: false, message: 'Adjunto no encontrado' });

      await adjunto.destroy();
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = unusualOperationController;
