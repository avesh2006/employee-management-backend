const AuditLog = require('../models/AuditLog');

exports.logAuditAction = async ({ adminId, action, target, targetId, details }) => {
  try {
    await AuditLog.create({
      admin: adminId,
      action,
      target,
      targetId,
      details
    });
  } catch (err) {
    console.error('❌ Audit log failed:', err.message);
  }
};