const Leave = require('../models/Leave');
const { logAuditAction } = require('../utils/logAuditAction');
const { sendEmail } = require('../utils/emailService');

// ✅ Admin: Approve/Reject Leave
exports.updateLeaveStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied: Admins only' });
  }

  try {
    const leave = await Leave.findById(id).populate('user', 'name email');
    if (!leave) return res.status(404).json({ message: 'Leave not found' });

    leave.status = status;
    await leave.save();

    // ✅ Log the admin action
    await logAuditAction({
      adminId: req.user._id,
      action: `Leave ${status}`,
      target: 'LeaveRequest',
      targetId: leave._id,
      details: {
        user: {
          id: leave.user._id,
          name: leave.user.name,
          email: leave.user.email
        },
        reason: leave.reason,
        startDate: leave.startDate,
        endDate: leave.endDate
      }
    });

    // ✅ Send email notification
    await sendEmail({
      to: leave.user.email,
      subject: `Leave ${status}`,
      text: `Hi ${leave.user.name},\n\nYour leave from ${leave.startDate.toDateString()} to ${leave.endDate.toDateString()} has been ${status}.\n\nRegards,\nHR Team`
    });

    res.json(leave);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};