const { LogAccion } = require('../models');

const auditLogger = {
  async log({ tipo_accion = 'datos_modificados', id_sociedad, id_usuario_interno, id_usuario_sociedad, id_documento, estado_anterior, estado_nuevo, motivo, req }) {
    try {
      await LogAccion.create({
        tipo_accion,
        id_sociedad: id_sociedad || null,
        id_usuario_interno: id_usuario_interno || null,
        id_usuario_sociedad: id_usuario_sociedad || null,
        id_documento: id_documento || null,
        estado_anterior: estado_anterior || null,
        estado_nuevo: estado_nuevo || null,
        motivo: motivo || null,
        direccion_ip: req?.ip || req?.connection?.remoteAddress || null,
      });
    } catch (error) {
      console.error('Error logging audit:', error.message);
    }
  },
};

module.exports = auditLogger;
