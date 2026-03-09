const { AuditLog } = require('../models');

const auditLogger = {
  async log({ entityType, entityId, action, changes, reason, userId, req }) {
    try {
      await AuditLog.create({
        entityType,
        entityId,
        action,
        changes,
        reason,
        userId,
        ipAddress: req?.ip || req?.connection?.remoteAddress,
        userAgent: req?.headers?.['user-agent'],
      });
    } catch (error) {
      console.error('Error logging audit:', error);
    }
  },

  async getHistory(entityType, entityId) {
    return AuditLog.findAll({
      where: { entityType, entityId },
      order: [['createdAt', 'DESC']],
      include: ['User'],
    });
  },
};

module.exports = auditLogger;
