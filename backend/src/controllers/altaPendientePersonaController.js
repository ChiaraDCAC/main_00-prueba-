const {
  AltaPendientePersona,
  SociedadTag,
  Usuario,
  UsuarioSociedad,
  UsuarioSociedadTag,
  LogAccion,
} = require('../models');

/**
 * Determina si todos los datos mínimos y la documentación obligatoria están listos.
 * Cuando devuelve true, el alta puede auto-cerrarse.
 */
function estaListaParaAutoCierre(alta) {
  const camposMinimos = ['apellido', 'nombre', 'tipo_documento', 'nro_documento', 'cuit'];
  const datosOk = camposMinimos.every((c) => !!alta[c]);
  const docs = Array.isArray(alta.documentos_requeridos) ? alta.documentos_requeridos : [];
  const docsOk = docs.length > 0 && docs.every((d) => d.recibido === true);
  return datosOk && docsOk;
}

const altaPendientePersonaController = {
  // GET /api/altas-pendientes
  async listar(req, res, next) {
    try {
      const {
        estado,
        rol,
        id_sociedad,
        id_responsable,
        page = 1,
        limit = 20,
      } = req.query;

      const where = {};
      if (estado) where.estado = estado;
      if (rol) where.rol = rol;
      if (id_sociedad) where.id_sociedad = parseInt(id_sociedad);
      if (id_responsable) where.id_responsable = parseInt(id_responsable);

      const offset = (parseInt(page) - 1) * parseInt(limit);

      const { count, rows } = await AltaPendientePersona.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset,
        include: [
          { model: SociedadTag, as: 'sociedad', attributes: ['id_sociedad', 'razon_social', 'cuit_cuil'] },
          { model: Usuario, as: 'responsable', attributes: ['id', 'nombre', 'apellido', 'email'] },
        ],
        order: [['created_at', 'DESC']],
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

  // GET /api/altas-pendientes/:id
  async obtener(req, res, next) {
    try {
      const alta = await AltaPendientePersona.findByPk(req.params.id, {
        include: [
          { model: SociedadTag, as: 'sociedad' },
          { model: Usuario, as: 'responsable', attributes: ['id', 'nombre', 'apellido', 'email'] },
          { model: UsuarioSociedad, as: 'usuarioCreado' },
        ],
      });
      if (!alta) {
        return res.status(404).json({ success: false, message: 'Alta pendiente no encontrada' });
      }
      res.json({ success: true, data: alta });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/altas-pendientes
  async crear(req, res, next) {
    try {
      const data = req.body || {};

      // Mínimo razonable para registrar el pendiente: al menos apellido + nombre.
      if (!data.apellido || !data.nombre) {
        return res.status(400).json({
          success: false,
          message: 'Apellido y nombre son obligatorios para registrar el pendiente',
        });
      }

      const alta = await AltaPendientePersona.create({
        apellido:           data.apellido,
        nombre:             data.nombre,
        tipo_documento:     data.tipo_documento || 'DNI',
        nro_documento:      data.nro_documento,
        cuit:               data.cuit,
        fecha_nacimiento:   data.fecha_nacimiento,
        nacionalidad:       data.nacionalidad,
        correo_electronico: data.correo_electronico,
        telefono:           data.telefono,
        domicilio:          data.domicilio,
        es_pep:             data.es_pep || false,
        id_sociedad:        data.id_sociedad,
        rol:                data.rol,
        id_responsable:     data.id_responsable,
        fecha_limite:       data.fecha_limite,
        documentos_requeridos: data.documentos_requeridos || undefined, // usa default si no llega
        observaciones:      data.observaciones,
        estado:             'pendiente',
      });

      // Log de la acción
      try {
        await LogAccion.create({
          id_sociedad:       data.id_sociedad || null,
          id_usuario_interno:req.user?.id || null,
          tipo_accion:       'alta_iniciada',
          estado_nuevo:      'pendiente',
          motivo:            `Alta pendiente persona humana: ${data.apellido}, ${data.nombre}`,
        });
      } catch (_) { /* logging best-effort */ }

      res.status(201).json({ success: true, data: alta });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/altas-pendientes/:id
  async actualizar(req, res, next) {
    try {
      const alta = await AltaPendientePersona.findByPk(req.params.id);
      if (!alta) {
        return res.status(404).json({ success: false, message: 'Alta pendiente no encontrada' });
      }
      if (alta.estado === 'completada') {
        return res.status(400).json({ success: false, message: 'No se puede modificar un alta completada' });
      }

      const editable = [
        'apellido','nombre','tipo_documento','nro_documento','cuit',
        'fecha_nacimiento','nacionalidad','correo_electronico','telefono','domicilio',
        'es_pep','id_sociedad','rol','id_responsable','fecha_limite',
        'documentos_requeridos','observaciones',
      ];
      const updates = {};
      editable.forEach((k) => {
        if (req.body[k] !== undefined) updates[k] = req.body[k];
      });

      // Si arranca como pendiente y ahora tiene actividad, marcar en_proceso
      if (alta.estado === 'pendiente' && Object.keys(updates).length > 0) {
        updates.estado = 'en_proceso';
      }

      await alta.update(updates);
      await alta.reload();

      // Auto-cierre si ya está todo
      if (estaListaParaAutoCierre(alta) && alta.estado !== 'completada') {
        await alta.update({
          estado: 'completada',
          completada_en: new Date(),
        });
      }

      res.json({ success: true, data: alta });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/altas-pendientes/:id/documento
  // body: { tipo, recibido, observaciones? }
  async marcarDocumento(req, res, next) {
    try {
      const alta = await AltaPendientePersona.findByPk(req.params.id);
      if (!alta) {
        return res.status(404).json({ success: false, message: 'Alta pendiente no encontrada' });
      }
      if (alta.estado === 'completada') {
        return res.status(400).json({ success: false, message: 'No se puede modificar un alta completada' });
      }

      const { tipo, recibido, observaciones } = req.body || {};
      if (!tipo) {
        return res.status(400).json({ success: false, message: 'Falta el tipo de documento' });
      }

      const docs = Array.isArray(alta.documentos_requeridos)
        ? [...alta.documentos_requeridos]
        : [];
      const idx = docs.findIndex((d) => d.tipo === tipo);
      if (idx < 0) {
        return res.status(404).json({ success: false, message: 'Documento no encontrado en el checklist' });
      }
      docs[idx] = { ...docs[idx], recibido: !!recibido, observaciones: observaciones ?? docs[idx].observaciones };

      const updates = { documentos_requeridos: docs };
      if (alta.estado === 'pendiente') updates.estado = 'en_proceso';

      await alta.update(updates);
      await alta.reload();

      // Auto-cierre
      if (estaListaParaAutoCierre(alta) && alta.estado !== 'completada') {
        await alta.update({
          estado: 'completada',
          completada_en: new Date(),
        });
      }

      res.json({ success: true, data: alta });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/altas-pendientes/:id/completar
  // Cierre manual. Si crear_persona=true, intenta crear el UsuarioSociedad y vincularlo.
  async completar(req, res, next) {
    try {
      const alta = await AltaPendientePersona.findByPk(req.params.id);
      if (!alta) {
        return res.status(404).json({ success: false, message: 'Alta pendiente no encontrada' });
      }
      if (alta.estado === 'completada') {
        return res.json({ success: true, data: alta, message: 'Ya estaba completada' });
      }

      const { crear_persona = false } = req.body || {};
      let usuarioCreado = null;

      if (crear_persona) {
        if (!alta.apellido || !alta.nombre) {
          return res.status(400).json({
            success: false,
            message: 'Para crear la persona se requieren apellido y nombre',
          });
        }
        usuarioCreado = await UsuarioSociedad.create({
          apellido:           alta.apellido,
          nombre:             alta.nombre,
          nro_documento:      alta.nro_documento,
          cuit:               alta.cuit,
          correo_electronico: alta.correo_electronico,
          telefono:           alta.telefono,
          domicilio:          alta.domicilio,
          es_pep:             alta.es_pep,
        });

        if (alta.id_sociedad) {
          await UsuarioSociedadTag.create({
            id_usuario_sociedad: usuarioCreado.id,
            id_sociedad:         alta.id_sociedad,
            rol:                 alta.rol,
            activo:              true,
          });
        }
      }

      await alta.update({
        estado: 'completada',
        completada_en: new Date(),
        id_usuario_sociedad_creado: usuarioCreado ? usuarioCreado.id : alta.id_usuario_sociedad_creado,
      });

      try {
        await LogAccion.create({
          id_sociedad:        alta.id_sociedad || null,
          id_usuario_interno: req.user?.id || null,
          id_usuario_sociedad:usuarioCreado ? usuarioCreado.id : null,
          tipo_accion:        'alta_completada',
          estado_anterior:    'en_proceso',
          estado_nuevo:       'completada',
          motivo:             `Alta completada manualmente: ${alta.apellido}, ${alta.nombre}`,
        });
      } catch (_) { /* best-effort */ }

      res.json({ success: true, data: alta, usuarioCreado });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/altas-pendientes/:id/cancelar
  async cancelar(req, res, next) {
    try {
      const alta = await AltaPendientePersona.findByPk(req.params.id);
      if (!alta) {
        return res.status(404).json({ success: false, message: 'Alta pendiente no encontrada' });
      }
      if (alta.estado === 'completada') {
        return res.status(400).json({ success: false, message: 'No se puede cancelar un alta completada' });
      }
      const { motivo } = req.body || {};
      await alta.update({
        estado: 'cancelada',
        observaciones: motivo
          ? `${alta.observaciones || ''}\n[Cancelada] ${motivo}`.trim()
          : alta.observaciones,
      });
      res.json({ success: true, data: alta });
    } catch (error) {
      next(error);
    }
  },

  // DELETE /api/altas-pendientes/:id
  async eliminar(req, res, next) {
    try {
      const alta = await AltaPendientePersona.findByPk(req.params.id);
      if (!alta) {
        return res.status(404).json({ success: false, message: 'Alta pendiente no encontrada' });
      }
      await alta.destroy();
      res.json({ success: true, message: 'Alta pendiente eliminada' });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/altas-pendientes/stats
  async stats(req, res, next) {
    try {
      const [pendientes, enProceso, completadas, canceladas] = await Promise.all([
        AltaPendientePersona.count({ where: { estado: 'pendiente' } }),
        AltaPendientePersona.count({ where: { estado: 'en_proceso' } }),
        AltaPendientePersona.count({ where: { estado: 'completada' } }),
        AltaPendientePersona.count({ where: { estado: 'cancelada' } }),
      ]);
      res.json({
        success: true,
        data: {
          pendientes,
          en_proceso: enProceso,
          completadas,
          canceladas,
          total_abiertas: pendientes + enProceso,
        },
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = altaPendientePersonaController;
