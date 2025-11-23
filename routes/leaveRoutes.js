const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  requestLeave,
  updateLeaveStatus,
  getMyLeaves,
  getAllLeaves
} = require('../controllers/leaveController');

router.post('/request', protect, requestLeave);
router.get('/my', protect, getMyLeaves);
router.get('/admin/all', protect, getAllLeaves);
router.put('/admin/:id/status', protect, updateLeaveStatus);

module.exports = router;