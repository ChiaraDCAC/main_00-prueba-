const { SociedadTag, UsuarioSociedadTag, UsuarioSociedad, DocumentoCliente, DocumentoVersion, LogAccion } = require('../models');
const { Op } = require('sequelize');

const sociedadController = {
  // GET /api/sociedades
  async listar(req, res, next) {
    try {
      const { search, tipo, estado, page = 1, limit = 20 } = req.query;
      const where = {};

      if (search) {
        where[Op.or] = [
          { razon_social: { [Op.iLike]: `%${search}%` } },
          { cuit_cuil: { [Op.iLike]: `%${search}%` } },
        ];
      }
      if (tipo) where.tipo_sociedad = tipo;
      if (estado) where.estado = estado;

      const offset = (parseInt(page) - 1) * parseInt(limit);

      const { count, rows } = await SociedadTag.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset,
        order: [['razon_social', 'ASC']],
      });

      res.json({
        success: true,
        data: rows,
        meta: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / parseInt(limit)),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/sociedades/:id
  async obtener(req, res, next) {
    try {
      const { id } = req.params;

      const sociedad = await SociedadTag.findByPk(id);
      if (!sociedad) {
        return res.status(404).json({ success: false, message: 'Sociedad no encontrada' });
      }

      // Traer personas vinculadas con sus roles
      const vinculaciones = await UsuarioSociedadTag.findAll({
        where: { id_sociedad: id, activo: true },
        include: [{ model: UsuarioSociedad, as: 'persona' }],
      });

      // Traer documentos con versión activa
      const documentos = await DocumentoCliente.findAll({
        where: { id_sociedad: id },
        include: [{ model: DocumentoVersion, as: 'versionActiva', required: false }],
      });

      res.json({
        success: true,
        data: {
          ...sociedad.toJSON(),
          personas: vinculaciones.map(v => ({
            ...v.toJSON(),
            ...(v.persona ? v.persona.toJSON() : {}),
          })),
          documentos,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/sociedades
  async crear(req, res, next) {
    try {
      const { razon_social, cuit_cuil, tipo_sociedad, estado } = req.body;

      const sociedad = await SociedadTag.create({
        razon_social,
        cuit_cuil,
        tipo_sociedad,
        estado: estado || 'pendiente',
      });

      await LogAccion.create({
        id_sociedad: sociedad.id_sociedad,
        id_usuario_interno: req.user.id,
        tipo_accion: 'alta_iniciada',
        estado_nuevo: sociedad.estado,
        direccion_ip: req.ip,
      });

      res.status(201).json({
        success: true,
        message: 'Sociedad creada exitosamente',
        data: sociedad,
      });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/sociedades/:id
  async actualizar(req, res, next) {
    try {
      const { id } = req.params;
      const sociedad = await SociedadTag.findByPk(id);
      if (!sociedad) {
        return res.status(404).json({ success: false, message: 'Sociedad no encontrada' });
      }

      const estadoAnterior = sociedad.estado;
      await sociedad.update(req.body);

      if (req.body.estado && req.body.estado !== estadoAnterior) {
        await LogAccion.create({
          id_sociedad: parseInt(id),
          id_usuario_interno: req.user.id,
          tipo_accion: 'datos_modificados',
          estado_anterior: estadoAnterior,
          estado_nuevo: req.body.estado,
          direccion_ip: req.ip,
        });
      }

      res.json({ success: true, data: sociedad });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = sociedadController;
