const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true }, // e.g. "Leave Approved"
  target: { type: String }, // e.g. "LeaveRequest"
  targetId: { type: mongoose.Schema.Types.ObjectId },
  timestamp: { type: Date, default: Date.now },
  details: { type: Object } // optional metadata
});

module.exports = mongoose.model('AuditLog', auditLogSchema);