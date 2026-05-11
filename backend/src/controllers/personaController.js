const { UsuarioSociedad, UsuarioSociedadTag, BeneficiarioFinal, AccionistaSocio, SocioSH, Autoridad, Apoderado, Heredero, AdministradorJusticia } = require('../models');

const personaController = {
  // GET /api/personas/sociedad/:id_sociedad
  async listarPorSociedad(req, res, next) {
    try {
      const { id_sociedad } = req.params;

      const vinculaciones = await UsuarioSociedadTag.findAll({
        where: { id_sociedad, activo: true },
        include: [{ model: UsuarioSociedad, as: 'persona' }],
      });

      res.json({ success: true, data: vinculaciones });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/personas/:id
  async obtener(req, res, next) {
    try {
      const persona = await UsuarioSociedad.findByPk(req.params.id);
      if (!persona) {
        return res.status(404).json({ success: false, message: 'Persona no encontrada' });
      }
      res.json({ success: true, data: persona });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/personas/sociedad/:id_sociedad
  async crear(req, res, next) {
    try {
      const { id_sociedad } = req.params;
      const { rol, ...personaData } = req.body;

      // Crear o usar persona existente
      let persona;
      if (personaData.id) {
        persona = await UsuarioSociedad.findByPk(personaData.id);
        if (!persona) {
          return res.status(404).json({ success: false, message: 'Persona no encontrada' });
        }
      } else {
        persona = await UsuarioSociedad.create(personaData);
      }

      // Vincular a la sociedad
      const vinculacion = await UsuarioSociedadTag.create({
        id_usuario_sociedad: persona.id,
        id_sociedad: parseInt(id_sociedad),
        rol: rol || null,
      });

      res.status(201).json({
        success: true,
        data: { ...vinculacion.toJSON(), persona },
      });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/personas/:id
  async actualizar(req, res, next) {
    try {
      const persona = await UsuarioSociedad.findByPk(req.params.id);
      if (!persona) {
        return res.status(404).json({ success: false, message: 'Persona no encontrada' });
      }
      await persona.update(req.body);
      res.json({ success: true, data: persona });
    } catch (error) {
      next(error);
    }
  },

  // DELETE /api/personas/vinculacion/:id_tag
  async desvincular(req, res, next) {
    try {
      const vinculacion = await UsuarioSociedadTag.findByPk(req.params.id_tag);
      if (!vinculacion) {
        return res.status(404).json({ success: false, message: 'Vinculación no encontrada' });
      }
      await vinculacion.update({ activo: false });
      res.json({ success: true, message: 'Persona desvinculada' });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/personas - directorio completo
  async directorio(req, res, next) {
    try {
      const { search } = req.query;
      const where = { activo: true };

      if (search) {
        const { Op } = require('sequelize');
        where[Op.or] = [
          { nombre: { [Op.iLike]: `%${search}%` } },
          { apellido: { [Op.iLike]: `%${search}%` } },
          { correo_electronico: { [Op.iLike]: `%${search}%` } },
        ];
      }

      const personas = await UsuarioSociedad.findAll({
        where,
        order: [['apellido', 'ASC'], ['nombre', 'ASC']],
      });

      res.json({ success: true, data: personas });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = personaController;
