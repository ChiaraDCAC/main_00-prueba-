const { SociedadTag, DocumentoCliente, DocumentoVersion, UsuarioSociedad, UsuarioSociedadTag, LogAccion } = require('../models');
const { Op } = require('sequelize');

// Estados del flujo de alta
const ESTADOS_ALTA = {
  INICIADA: 'alta_iniciada',
  BORRADOR: 'alta_guardada_borrador',
  PENDIENTE: 'alta_avanzada_pendiente',
  COMPLETADA: 'alta_completada',
  EXCEPCION: 'alta_excepcion_docs',
};

const altaController = {
  // GET /api/alta/:id_sociedad/estado
  async obtenerEstado(req, res, next) {
    try {
      const { id_sociedad } = req.params;
      const idSociedad = parseInt(id_sociedad);

      const sociedad = await SociedadTag.findByPk(idSociedad);
      if (!sociedad) {
        return res.status(404).json({ success: false, message: 'Sociedad no encontrada' });
      }

      // Último log de alta
      const ultimoLog = await LogAccion.findOne({
        where: {
          id_sociedad: idSociedad,
          tipo_accion: [
            'alta_iniciada', 'alta_guardada_borrador', 'alta_avanzada_pendiente',
            'alta_completada', 'alta_excepcion_docs', 'alta_psp', 'alta_psp_excepcion',
          ],
        },
        order: [['created_at', 'DESC']],
      });

      // Documentos del cliente con su estado real (a través de version_activa)
      const docsCliente = await DocumentoCliente.findAll({
        where: { id_sociedad: idSociedad },
      });

      const versionActivaIds = docsCliente
        .map(d => d.version_activa)
        .filter(v => v !== null && v !== undefined);

      const versionesActivas = versionActivaIds.length > 0
        ? await DocumentoVersion.findAll({ where: { id: { [Op.in]: versionActivaIds } } })
        : [];
      const versionMap = new Map(versionesActivas.map(v => [v.id, v]));

      const documentosDetalle = docsCliente.map(d => {
        const v = d.version_activa ? versionMap.get(d.version_activa) : null;
        return {
          id: d.id,
          id_documento: d.id_documento,
          nombre_documento: d.nombre_documento,
          categoria: d.categoria,
          es_obligatorio: d.es_obligatorio,
          es_condicional: d.es_condicional,
          // 'sin_cargar' si nunca se subió, sino el estado real de la versión
          estado: v ? v.estado : 'sin_cargar',
          motivo_rechazo: v?.motivo_rechazo || null,
          observaciones: v?.observaciones || null,
          aprobado_por: v?.aprobado_por || null,
          aprobado_en: v?.aprobado_en || null,
          subido_en: v?.subido_en || null,
        };
      });

      // Conteos por estado (solo obligatorios)
      const obligatorios = documentosDetalle.filter(d => d.es_obligatorio);
      const por_estado = {
        sin_cargar: obligatorios.filter(d => d.estado === 'sin_cargar').length,
        pendiente:  obligatorios.filter(d => d.estado === 'pendiente').length,
        observado:  obligatorios.filter(d => d.estado === 'observado').length,
        rechazado:  obligatorios.filter(d => d.estado === 'rechazado').length,
        aprobado:   obligatorios.filter(d => d.estado === 'aprobado').length,
      };
      const total = obligatorios.length;
      const aprobados = por_estado.aprobado;
      const pendientes = total - aprobados;
      const todos_aprobados = total > 0 && aprobados === total;

      // Personas vinculadas
      const vinculos = await UsuarioSociedadTag.findAll({
        where: { id_sociedad: idSociedad, activo: true },
        include: [{ model: UsuarioSociedad, required: false }],
      });
      const personas = vinculos.map(v => ({
        id_vinculo: v.id,
        rol: v.rol,
        id_usuario_sociedad: v.id_usuario_sociedad,
        apellido: v.UsuarioSociedad?.apellido,
        nombre: v.UsuarioSociedad?.nombre,
        nro_documento: v.UsuarioSociedad?.nro_documento,
        cuit: v.UsuarioSociedad?.cuit,
        cargo_societario: v.UsuarioSociedad?.cargo_societario,
        es_pep: v.UsuarioSociedad?.es_pep,
      }));

      res.json({
        success: true,
        data: {
          sociedad,
          estado_actual: ultimoLog?.tipo_accion || null,
          documentos: {
            // Compat: campos del response anterior
            total,
            aprobados,
            pendientes,
            // Nuevos: vista global rica
            por_estado,
            detalle: documentosDetalle,
          },
          personas,
          listo_para_completar: todos_aprobados,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/alta/:id_sociedad/iniciar
  async iniciar(req, res, next) {
    try {
      const { id_sociedad } = req.params;

      const sociedad = await SociedadTag.findByPk(id_sociedad);
      if (!sociedad) {
        return res.status(404).json({ success: false, message: 'Sociedad no encontrada' });
      }

      await LogAccion.create({
        id_sociedad: parseInt(id_sociedad),
        id_usuario_interno: req.user.id,
        tipo_accion: 'alta_iniciada',
        estado_nuevo: 'alta_iniciada',
        direccion_ip: req.ip,
      });

      res.json({ success: true, message: 'Alta iniciada', data: sociedad });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/alta/:id_sociedad/guardar
  async guardarBorrador(req, res, next) {
    try {
      const { id_sociedad } = req.params;
      const { motivo } = req.body;

      await LogAccion.create({
        id_sociedad: parseInt(id_sociedad),
        id_usuario_interno: req.user.id,
        tipo_accion: 'alta_guardada_borrador',
        motivo: motivo || null,
        direccion_ip: req.ip,
      });

      res.json({ success: true, message: 'Borrador guardado' });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/alta/:id_sociedad/avanzar
  async avanzar(req, res, next) {
    try {
      const { id_sociedad } = req.params;
      const { estado_nuevo, motivo, forzar } = req.body;
      const idSociedad = parseInt(id_sociedad);

      const tiposValidos = ['alta_avanzada_pendiente', 'alta_completada', 'alta_excepcion_docs'];
      if (!tiposValidos.includes(estado_nuevo)) {
        return res.status(400).json({ success: false, message: 'Estado inválido' });
      }

      // Validación: para alta_completada, todos los obligatorios deben estar aprobados
      // Excepción: si se pasa { forzar: true } o se elige el estado 'alta_excepcion_docs', se permite
      if (estado_nuevo === 'alta_completada' && !forzar) {
        const docsObligatorios = await DocumentoCliente.findAll({
          where: { id_sociedad: idSociedad, es_obligatorio: true },
        });

        const versionIds = docsObligatorios.map(d => d.version_activa).filter(Boolean);
        const versiones = versionIds.length > 0
          ? await DocumentoVersion.findAll({ where: { id: { [Op.in]: versionIds } } })
          : [];
        const versionMap = new Map(versiones.map(v => [v.id, v]));

        const docsNoAprobados = docsObligatorios.filter(d => {
          if (!d.version_activa) return true; // sin cargar
          const v = versionMap.get(d.version_activa);
          return !v || v.estado !== 'aprobado';
        });

        if (docsNoAprobados.length > 0) {
          return res.status(422).json({
            success: false,
            message: 'No se puede completar el alta: hay documentos obligatorios sin aprobar',
            data: {
              docs_no_aprobados: docsNoAprobados.map(d => {
                const v = d.version_activa ? versionMap.get(d.version_activa) : null;
                return {
                  id: d.id,
                  id_documento: d.id_documento,
                  nombre_documento: d.nombre_documento,
                  estado_actual: v ? v.estado : 'sin_cargar',
                };
              }),
              hint: 'Si querés completar igual con excepción, usá estado_nuevo="alta_excepcion_docs", o forzar=true.',
            },
          });
        }
      }

      await LogAccion.create({
        id_sociedad: idSociedad,
        id_usuario_interno: req.user.id,
        tipo_accion: estado_nuevo,
        motivo: motivo || null,
        direccion_ip: req.ip,
      });

      res.json({ success: true, message: 'Estado actualizado', data: { tipo_accion: estado_nuevo } });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/alta/:id_sociedad/cvu
  async generarCVU(req, res, next) {
    try {
      const { id_sociedad } = req.params;
      const { nro_cvu, es_psp, es_excepcion } = req.body;

      const tipo_accion = es_psp
        ? (es_excepcion ? 'alta_psp_excepcion' : 'alta_psp')
        : (es_excepcion ? 'alta_excepcion_docs' : 'alta_completada');

      await LogAccion.create({
        id_sociedad: parseInt(id_sociedad),
        id_usuario_interno: req.user.id,
        tipo_accion,
        genera_cvu: true,
        nro_cvu: nro_cvu || null,
        cvu_generado_en: nro_cvu ? new Date() : null,
        estado_nuevo: 'cvu_habilitado',
        direccion_ip: req.ip,
      });

      res.json({ success: true, message: 'CVU registrado', data: { nro_cvu, tipo_accion } });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/alta/:id_sociedad/historial
  async historial(req, res, next) {
    try {
      const { id_sociedad } = req.params;

      const logs = await LogAccion.findAll({
        where: { id_sociedad: parseInt(id_sociedad) },
        order: [['created_at', 'DESC']],
      });

      res.json({ success: true, data: logs });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = altaController;
