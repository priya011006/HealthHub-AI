const AuditLog = require('../models/AuditLog');

/**
 * Creates a new audit log entry
 */
const logAction = async (userId, action, details) => {
  try {
    await AuditLog.create({
      userId: userId || null,
      action,
      details,
    });
    console.log(`[Audit Logged] User: ${userId || 'Anonymous'} | Action: ${action} | Info: ${details}`);
  } catch (error) {
    console.error('[Audit Logger Error] Failed to write audit log:', error.message);
  }
};

module.exports = {
  logAction,
};
