const express = require('express');
const router = express.Router();

// ✅ Middleware
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// ✅ Controllers
const {
  checkIn,
  checkOut,
  getHistory,
  getAllAttendance,
} = require('../controllers/attendanceController');
const { getMonthlySummary } = require('../controllers/attendanceController');
const { getAdminMonthlySummary } = require('../controllers/attendanceController');
const { exportAttendanceCSV } = require('../controllers/attendanceController');
const { getCalendarView } = require('../controllers/attendanceController');
const { getMissingCheckOuts } = require('../controllers/attendanceController');
const { autoCheckout } = require('../controllers/attendanceController');
const { getDashboard } = require('../controllers/attendanceController');
const { getAnalytics } = require('../controllers/attendanceController');
// ✅ Routes
router.post('/check-in', protect, upload.single('photo'), checkIn);
router.post('/check-out', protect, checkOut);
router.get('/history', protect, getHistory);
router.get('/admin/history', protect, getAllAttendance);
router.get('/summary', protect, getMonthlySummary);
router.get('/admin/summary', protect, getAdminMonthlySummary);
router.get('/admin/export', protect, exportAttendanceCSV);
router.get('/calendar', protect, getCalendarView);
router.get('/admin/missing-checkouts', protect, getMissingCheckOuts);
router.post('/admin/auto-checkout', protect, autoCheckout);
router.get('/dashboard', protect, getDashboard);
router.get('/admin/analytics', protect, getAnalytics);

module.exports = router;