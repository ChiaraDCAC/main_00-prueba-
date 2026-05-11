const { Op } = require('sequelize');
const {
  SociedadTag,
  UsuarioSociedad,
  UsuarioSociedadTag,
  DocumentoCliente,
  DocumentoVersion,
  LogAccion,
} = require('../models');

// Mapeo BD → formato frontend
const mapCliente = (s) => {
  const isHumana = !['SA','SRL','SH','sucesion'].includes(s.tipo_sociedad);
  let firstName = '', lastName = '';
  if (isHumana && s.razon_social) {
    const parts = s.razon_social.trim().split(' ');
    lastName = parts[parts.length - 1];
    firstName = parts.slice(0, -1).join(' ');
  }
  return {
    id: String(s.id_sociedad),
    legalName: s.razon_social,
    firstName,
    lastName,
    cuit: s.cuit_cuil,
    legalForm: s.tipo_sociedad,
    clientType: isHumana ? 'persona_humana' : 'persona_juridica',
    status: s.estado,
    riskLevel: 'medio',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

const mapPersona = (v) => {
  const p = v.UsuarioSociedad;
  return {
    id: v.id_usuario_sociedad,
    rol: v.rol,
    firstName: p?.nombre || '',
    lastName: p?.apellido || '',
    dni: p?.nro_documento || '',
    cuit: p?.cuit || '',
    email: p?.correo_electronico || '',
    telefono: p?.telefono || '',
    domicilio: p?.domicilio || '',
    position: p?.cargo_societario || '',
    tipo_firma: p?.tipo_firma || '',
    es_pep: p?.es_pep || false,
    ownershipPercentage: null,
    powerType: null,
  };
};

const clientController = {

  async list(req, res, next) {
    try {
      const { page = 1, limit = 20, status, clientType, legalForm, riskLevel, search } = req.query;
      const where = {};

      if (search) {
        where[Op.or] = [
          { razon_social: { [Op.iLike]: `%${search}%` } },
          { cuit_cuil: { [Op.iLike]: `%${search}%` } },
        ];
      }
      if (status) where.estado = status;
      if (legalForm) where.tipo_sociedad = legalForm;
      if (clientType === 'persona_humana') where.tipo_sociedad = 'monotributista';
      if (clientType === 'persona_juridica') {
        where.tipo_sociedad = { [Op.in]: ['SA','SRL','SH','sucesion'] };
      }

      const offset = (parseInt(page) - 1) * parseInt(limit);
      const { count, rows } = await SociedadTag.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset,
        order: [['razon_social', 'ASC']],
      });

      res.json({
        success: true,
        data: rows.map(mapCliente),
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

  async getById(req, res, next) {
    try {
      const sociedad = await SociedadTag.findByPk(req.params.id);
      if (!sociedad) {
        return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
      }

      // Personas: query directa sin includes para evitar problemas de alias
      let personas = [];
      try {
        const tags = await UsuarioSociedadTag.findAll({
          where: { id_sociedad: req.params.id, activo: true },
          attributes: ['id', 'id_usuario_sociedad', 'rol'],
        });
        const personaIds = tags.map(t => t.id_usuario_sociedad);
        const personasData = personaIds.length > 0
          ? await UsuarioSociedad.findAll({ where: { id: personaIds } })
          : [];
        const personaMap = Object.fromEntries(personasData.map(p => [p.id, p]));
        personas = tags.map(t => mapPersona({ ...t.toJSON(), UsuarioSociedad: personaMap[t.id_usuario_sociedad] }));
      } catch (e) {
        console.error('Error cargando personas:', e.message);
      }

      // Documentos
      const documentos = await DocumentoCliente.findAll({
        where: { id_sociedad: req.params.id },
      });

      const docsMap = {};
      for (const doc of documentos) {
        let ver = null;
        if (doc.version_activa) {
          ver = await DocumentoVersion.findByPk(doc.version_activa);
        }
        docsMap[doc.id_documento] = {
          id: doc.id,
          versionId: ver?.id || null,
          nombre: doc.nombre_documento,
          categoria: doc.categoria,
          esObligatorio: doc.es_obligatorio,
          estado: ver ? ver.estado : 'sin_version',
          datos: ver?.datos_formulario || null,
          url: ver?.url_archivo || null,
          motivoRechazo: ver?.motivo_rechazo || null,
          observaciones: ver?.observaciones || null,
        };
      }

      res.json({
        success: true,
        data: {
          ...mapCliente(sociedad),
          personas,
          authorities: personas.filter(p => ['presidente','director','vicepresidente','gerente'].includes(p.position)),
          beneficialOwners: personas,
          signatories: personas.filter(p => p.tipo_firma && p.tipo_firma !== 'ninguna'),
          attorneys: personas.filter(p => p.rol === 'apoderado'),
          documents: docsMap,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const { legalName, cuit, legalForm, clientType, status } = req.body;
      const sociedad = await SociedadTag.create({
        razon_social: legalName,
        cuit_cuil: cuit,
        tipo_sociedad: legalForm,
        estado: status || 'pendiente',
      });
      await LogAccion.create({
        id_sociedad: sociedad.id_sociedad,
        id_usuario_interno: req.user.id,
        tipo_accion: 'alta_iniciada',
        estado_nuevo: sociedad.estado,
        direccion_ip: req.ip,
      });
      res.status(201).json({ success: true, message: 'Cliente creado exitosamente', data: mapCliente(sociedad) });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const sociedad = await SociedadTag.findByPk(req.params.id);
      if (!sociedad) return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
      const estadoAnterior = sociedad.estado;
      const updates = {};
      if (req.body.legalName) updates.razon_social = req.body.legalName;
      if (req.body.cuit) updates.cuit_cuil = req.body.cuit;
      if (req.body.status) updates.estado = req.body.status;
      if (req.body.legalForm) updates.tipo_sociedad = req.body.legalForm;
      await sociedad.update(updates);
      if (updates.estado && updates.estado !== estadoAnterior) {
        await LogAccion.create({
          id_sociedad: parseInt(req.params.id),
          id_usuario_interno: req.user.id,
          tipo_accion: 'datos_modificados',
          estado_anterior: estadoAnterior,
          estado_nuevo: updates.estado,
          direccion_ip: req.ip,
        });
      }
      res.json({ success: true, message: 'Cliente actualizado', data: mapCliente(sociedad) });
    } catch (error) {
      next(error);
    }
  },

  async deactivate(req, res, next) {
    try {
      const sociedad = await SociedadTag.findByPk(req.params.id);
      if (!sociedad) return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
      const estadoAnterior = sociedad.estado;
      await sociedad.update({ estado: 'baja' });
      await LogAccion.create({
        id_sociedad: parseInt(req.params.id),
        id_usuario_interno: req.user.id,
        tipo_accion: 'datos_modificados',
        estado_anterior: estadoAnterior,
        estado_nuevo: 'baja',
        motivo: req.body.reason,
        direccion_ip: req.ip,
      });
      res.json({ success: true, message: 'Cliente dado de baja exitosamente' });
    } catch (error) {
      next(error);
    }
  },

  async approve(req, res, next) {
    try {
      const sociedad = await SociedadTag.findByPk(req.params.id);
      if (!sociedad) return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
      const estadoAnterior = sociedad.estado;
      await sociedad.update({ estado: 'aprobado' });
      await LogAccion.create({
        id_sociedad: parseInt(req.params.id),
        id_usuario_interno: req.user.id,
        tipo_accion: 'alta_completada',
        estado_anterior: estadoAnterior,
        estado_nuevo: 'aprobado',
        direccion_ip: req.ip,
      });
      res.json({ success: true, message: 'Cliente aprobado exitosamente', data: mapCliente(sociedad) });
    } catch (error) {
      next(error);
    }
  },

  async reject(req, res, next) {
    try {
      const sociedad = await SociedadTag.findByPk(req.params.id);
      if (!sociedad) return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
      const estadoAnterior = sociedad.estado;
      await sociedad.update({ estado: 'rechazado' });
      await LogAccion.create({
        id_sociedad: parseInt(req.params.id),
        id_usuario_interno: req.user.id,
        tipo_accion: 'alta_excepcion_docs',
        estado_anterior: estadoAnterior,
        estado_nuevo: 'rechazado',
        motivo: req.body.reason,
        direccion_ip: req.ip,
      });
      res.json({ success: true, message: 'Cliente rechazado' });
    } catch (error) {
      next(error);
    }
  },

  async setFraudFlag(req, res, next) {
    try {
      const sociedad = await SociedadTag.findByPk(req.params.id);
      if (!sociedad) return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
      const { hasFraudFlag, reason } = req.body;
      await LogAccion.create({
        id_sociedad: parseInt(req.params.id),
        id_usuario_interno: req.user.id,
        tipo_accion: 'datos_modificados',
        motivo: `Flag de fraude ${hasFraudFlag ? 'activado' : 'desactivado'}: ${reason}`,
        direccion_ip: req.ip,
      });
      res.json({ success: true, message: `Flag de fraude ${hasFraudFlag ? 'activado' : 'desactivado'}` });
    } catch (error) {
      next(error);
    }
  },

  async getAuditHistory(req, res, next) {
    try {
      const logs = await LogAccion.findAll({
        where: { id_sociedad: req.params.id },
        order: [['created_at', 'DESC']],
      });
      res.json({ success: true, data: logs });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = clientController;
