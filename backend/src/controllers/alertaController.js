const { Alerta, SociedadTag, UsuarioSociedad } = require('../models');
const { Op } = require('sequelize');

const alertaController = {
  // GET /api/alertas
  async listar(req, res, next) {
    try {
      const { estado, tipo, id_sociedad, page = 1, limit = 20 } = req.query;
      const where = {};

      if (estado) where.estado = estado;
      if (tipo) where.tipo_alerta = tipo;
      if (id_sociedad) where.id_sociedad = parseInt(id_sociedad);

      const offset = (parseInt(page) - 1) * parseInt(limit);

      const { count, rows } = await Alerta.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset,
        include: [{ model: SociedadTag, as: 'sociedad', attributes: ['id_sociedad', 'razon_social', 'cuit_cuil'] }],
        order: [['created_at', 'DESC']],
      });

      res.json({
        success: true,
        data: rows,
        meta: { total: count, page: parseInt(page), limit: parseInt(limit) },
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/alertas/:id
  async obtener(req, res, next) {
    try {
      const alerta = await Alerta.findByPk(req.params.id, {
        include: [{ model: SociedadTag, as: 'sociedad' }],
      });
      if (!alerta) {
        return res.status(404).json({ success: false, message: 'Alerta no encontrada' });
      }
      res.json({ success: true, data: alerta });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/alertas
  async crear(req, res, next) {
    try {
      const { id_sociedad, id_usuario_sociedad, tipo_alerta, mensaje, fecha_vencimiento } = req.body;

      const alerta = await Alerta.create({
        id_sociedad,
        id_usuario_sociedad: id_usuario_sociedad || null,
        tipo_alerta,
        mensaje,
        fecha_vencimiento: fecha_vencimiento || null,
        estado: 'pendiente',
      });

      res.status(201).json({ success: true, data: alerta });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/alertas/:id/resolver
  async resolver(req, res, next) {
    try {
      const alerta = await Alerta.findByPk(req.params.id);
      if (!alerta) {
        return res.status(404).json({ success: false, message: 'Alerta no encontrada' });
      }
      await alerta.update({ estado: 'resuelta' });
      res.json({ success: true, message: 'Alerta resuelta', data: alerta });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/alertas/:id/ignorar
  async ignorar(req, res, next) {
    try {
      const alerta = await Alerta.findByPk(req.params.id);
      if (!alerta) {
        return res.status(404).json({ success: false, message: 'Alerta no encontrada' });
      }
      await alerta.update({ estado: 'ignorada' });
      res.json({ success: true, message: 'Alerta ignorada', data: alerta });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = alertaController;
