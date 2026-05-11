const path = require('path');
const { DocumentoCliente, DocumentoVersion, LogAccion } = require('../models');

const documentoController = {
  // GET /api/documentos/sociedad/:id_sociedad
  async listarPorSociedad(req, res, next) {
    try {
      const { id_sociedad } = req.params;

      const documentos = await DocumentoCliente.findAll({
        where: { id_sociedad },
        include: [
          {
            model: DocumentoVersion,
            as: 'versiones',
            required: false,
            order: [['numero_version', 'DESC']],
          },
        ],
        order: [['nombre_documento', 'ASC']],
      });

      res.json({ success: true, data: documentos });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/documentos/sociedad/:id_sociedad
  async crearSlot(req, res, next) {
    try {
      const { id_sociedad } = req.params;
      const { tipo_entidad, id_documento, nombre_documento, categoria, es_obligatorio, es_condicional } = req.body;

      const doc = await DocumentoCliente.create({
        id_sociedad: parseInt(id_sociedad),
        tipo_entidad,
        id_documento,
        nombre_documento,
        categoria: categoria || 'otro',
        es_obligatorio: es_obligatorio !== undefined ? es_obligatorio : true,
        es_condicional: es_condicional || false,
      });

      res.status(201).json({ success: true, data: doc });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/documentos/:id/version — subir archivo
  async subirVersion(req, res, next) {
    try {
      const { id } = req.params;

      const doc = await DocumentoCliente.findByPk(id);
      if (!doc) {
        return res.status(404).json({ success: false, message: 'Documento no encontrado' });
      }

      // Calcular número de versión
      const ultimaVersion = await DocumentoVersion.findOne({
        where: { id_documento: parseInt(id) },
        order: [['numero_version', 'DESC']],
      });
      const numero_version = ultimaVersion ? ultimaVersion.numero_version + 1 : 1;

      const url_archivo = req.file
        ? `/uploads/${req.file.filename}`
        : req.body.url_archivo || null;

      const version = await DocumentoVersion.create({
        id_documento: parseInt(id),
        numero_version,
        url_archivo,
        estado: 'pendiente',
        datos_formulario: req.body.datos_formulario ? JSON.parse(req.body.datos_formulario) : null,
      });

      await LogAccion.create({
        id_sociedad: doc.id_sociedad,
        id_usuario_interno: req.user.id,
        id_documento: parseInt(id),
        tipo_accion: 'datos_modificados',
        estado_nuevo: 'pendiente',
        direccion_ip: req.ip,
      });

      res.status(201).json({ success: true, data: version });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/documentos/:id/aprobar
  async aprobar(req, res, next) {
    try {
      const { id } = req.params;
      const { id_version, observaciones } = req.body;

      const version = await DocumentoVersion.findByPk(id_version);
      if (!version || version.id_documento !== parseInt(id)) {
        return res.status(404).json({ success: false, message: 'Versión no encontrada' });
      }

      await version.update({
        estado: 'aprobado',
        aprobado_por: req.user.id,
        aprobado_en: new Date(),
        observaciones: observaciones || null,
      });

      // Marcar como versión activa
      await DocumentoCliente.update(
        { version_activa: id_version },
        { where: { id: parseInt(id) } }
      );

      const doc = await DocumentoCliente.findByPk(id);

      await LogAccion.create({
        id_sociedad: doc.id_sociedad,
        id_usuario_interno: req.user.id,
        id_documento: parseInt(id),
        tipo_accion: 'documento_aprobado',
        estado_anterior: version.estado,
        estado_nuevo: 'aprobado',
        direccion_ip: req.ip,
      });

      res.json({ success: true, message: 'Documento aprobado', data: version });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/documentos/:id/rechazar
  async rechazar(req, res, next) {
    try {
      const { id } = req.params;
      const { id_version, motivo_rechazo } = req.body;

      const version = await DocumentoVersion.findByPk(id_version);
      if (!version || version.id_documento !== parseInt(id)) {
        return res.status(404).json({ success: false, message: 'Versión no encontrada' });
      }

      await version.update({
        estado: 'rechazado',
        motivo_rechazo,
        aprobado_por: req.user.id,
        aprobado_en: new Date(),
      });

      const doc = await DocumentoCliente.findByPk(id);

      await LogAccion.create({
        id_sociedad: doc.id_sociedad,
        id_usuario_interno: req.user.id,
        id_documento: parseInt(id),
        tipo_accion: 'documento_rechazado',
        estado_anterior: version.estado,
        estado_nuevo: 'rechazado',
        motivo: motivo_rechazo,
        direccion_ip: req.ip,
      });

      res.json({ success: true, message: 'Documento rechazado', data: version });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/documentos/:id/observar
  async observar(req, res, next) {
    try {
      const { id } = req.params;
      const { id_version, observaciones } = req.body;

      const version = await DocumentoVersion.findByPk(id_version);
      if (!version || version.id_documento !== parseInt(id)) {
        return res.status(404).json({ success: false, message: 'Versión no encontrada' });
      }

      await version.update({ estado: 'observado', observaciones });

      const doc = await DocumentoCliente.findByPk(id);

      await LogAccion.create({
        id_sociedad: doc.id_sociedad,
        id_usuario_interno: req.user.id,
        id_documento: parseInt(id),
        tipo_accion: 'documento_observado',
        estado_anterior: version.estado,
        estado_nuevo: 'observado',
        motivo: observaciones,
        direccion_ip: req.ip,
      });

      res.json({ success: true, message: 'Documento observado', data: version });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = documentoController;
