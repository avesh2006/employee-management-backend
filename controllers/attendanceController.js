const Attendance = require('../models/Attendance');
const User = require('../models/User');

// ✅ Check-In
exports.checkIn = async (req, res) => {
  const { latitude, longitude } = req.body;

  try {
    const existing = await Attendance.findOne({
      user: req.user._id,
      checkOutTime: { $exists: false }
    });

    if (existing) {
      return res.status(400).json({ message: 'Already checked in. Please check out first.' });
    }

    const attendance = await Attendance.create({
      user: req.user._id,
      checkInTime: new Date(),
      checkOutTime: null,
      location: { latitude, longitude },
      photo: req.file?.filename || null,
    });

    console.log(`📍 Checked in: ${req.user._id} at ${attendance.checkInTime.toISOString()}`);
    res.status(201).json(attendance);
  } catch (err) {
    console.error('❌ Check-in error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

// ✅ Check-Out
exports.checkOut = async (req, res) => {
  try {
    const record = await Attendance.findOne({
      user: req.user._id,
      checkOutTime: { $exists: false }
    });

    if (!record) {
      return res.status(400).json({ message: 'No active check-in found.' });
    }

    record.checkOutTime = new Date();
    await record.save();

    console.log(`✅ Checked out: ${req.user._id} at ${record.checkOutTime.toISOString()}`);
    res.status(200).json(record);
  } catch (err) {
    console.error('❌ Check-out error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

// ✅ Get Personal History
exports.getHistory = async (req, res) => {
  const { from, to } = req.query;
  const filter = { user: req.user._id };

  if (from && to) {
    filter.checkInTime = {
      $gte: new Date(from),
      $lte: new Date(to)
    };
  }

  try {
    const records = await Attendance.find(filter).sort({ checkInTime: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Admin: Get All Attendance
exports.getAllAttendance = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Admins only' });
    }

    const records = await Attendance.find()
      .populate('user', 'name email role')
      .sort({ checkInTime: -1 });

    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Monthly Summary
exports.getMonthlySummary = async (req, res) => {
  const { month, year } = req.query;

  if (!month || !year) {
    return res.status(400).json({ message: 'Month and year are required.' });
  }

  try {
    const startDate = new Date(`${year}-${month}-01`);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    const records = await Attendance.find({
      user: req.user._id,
      checkInTime: { $gte: startDate, $lt: endDate },
      checkOutTime: { $ne: null }
    });

    let totalDays = records.length;
    let totalHours = 0;

    records.forEach(record => {
      const checkIn = new Date(record.checkInTime);
      const checkOut = new Date(record.checkOutTime);
      const hours = (checkOut - checkIn) / (1000 * 60 * 60);
      totalHours += hours;
    });

    res.json({
      month,
      year,
      totalDays,
      totalHours: totalHours.toFixed(2)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
//Admin Monthly Summary
exports.getAdminMonthlySummary = async (req, res) => {
  const { month, year } = req.query;

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied: Admins only' });
  }

  if (!month || !year) {
    return res.status(400).json({ message: 'Month and year are required.' });
  }

  try {
    const startDate = new Date(`${year}-${month}-01`);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    const records = await Attendance.find({
      checkInTime: { $gte: startDate, $lt: endDate },
      checkOutTime: { $ne: null }
    }).populate('user', 'name email');

    const summaryMap = {};

    records.forEach(record => {
      const userId = record.user._id.toString();
      const name = record.user.name;
      const email = record.user.email;
      const checkIn = new Date(record.checkInTime);
      const checkOut = new Date(record.checkOutTime);
      const hours = (checkOut - checkIn) / (1000 * 60 * 60);

      if (!summaryMap[userId]) {
        summaryMap[userId] = {
          name,
          email,
          totalDays: 0,
          totalHours: 0
        };
      }

      summaryMap[userId].totalDays += 1;
      summaryMap[userId].totalHours += hours;
    });

    const summary = Object.values(summaryMap).map(user => ({
      ...user,
      totalHours: user.totalHours.toFixed(2)
    }));

    res.json({ month, year, summary });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// csv package
const { Parser } = require('json2csv');

exports.exportAttendanceCSV = async (req, res) => {
  const { month, year } = req.query;

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied: Admins only' });
  }

  try {
    const startDate = new Date(`${year}-${month}-01`);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    const records = await Attendance.find({
      checkInTime: { $gte: startDate, $lt: endDate }
    }).populate('user', 'name email');

    const data = records.map(r => ({
      Name: r.user.name,
      Email: r.user.email,
      CheckIn: r.checkInTime?.toISOString(),
      CheckOut: r.checkOutTime?.toISOString(),
      Latitude: r.location?.latitude,
      Longitude: r.location?.longitude,
      Photo: r.photo || 'N/A'
    }));

    const parser = new Parser();
    const csv = parser.parse(data);

    res.header('Content-Type', 'text/csv');
    res.attachment(`attendance-${month}-${year}.csv`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
//Calendar Data Routes
exports.getCalendarView = async (req, res) => {
  const { month, year, userId } = req.query;

  const targetUser = req.user.role === 'admin' && userId ? userId : req.user._id;

  if (!month || !year) {
    return res.status(400).json({ message: 'Month and year are required.' });
  }

  try {
    const startDate = new Date(`${year}-${month}-01`);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    const records = await Attendance.find({
      user: targetUser,
      checkInTime: { $gte: startDate, $lt: endDate }
    });

    const calendar = {};

    records.forEach(record => {
      const date = new Date(record.checkInTime).toISOString().split('T')[0];
      calendar[date] = {
        checkIn: record.checkInTime,
        checkOut: record.checkOutTime || null,
        status: record.checkOutTime ? '✅ Present' : '🕒 Checked-in only'
      };
    });

    res.json({ month, year, calendar });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// Missing Check-out Detection
exports.getMissingCheckOuts = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied: Admins only' });
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const records = await Attendance.find({
      checkInTime: { $gte: today, $lt: tomorrow },
      checkOutTime: { $exists: false }
    }).populate('user', 'name email');

    const missing = records.map(r => ({
      name: r.user.name,
      email: r.user.email,
      checkInTime: r.checkInTime,
      status: '❌ Missing check-out'
    }));

    res.json({ date: today.toISOString().split('T')[0], missing });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
//Auto-Checkout Logic
exports.autoCheckout = async (req, res) => {
  const MAX_HOURS = 9;

  try {
    const now = new Date();

    const records = await Attendance.find({
      checkOutTime: { $exists: false }
    });

    const updated = [];

    for (const record of records) {
      const checkIn = new Date(record.checkInTime);
      const hours = (now - checkIn) / (1000 * 60 * 60);

      if (hours >= MAX_HOURS) {
        record.checkOutTime = new Date(checkIn.getTime() + MAX_HOURS * 60 * 60 * 1000);
        await record.save();
        updated.push({
          user: record.user,
          checkIn: record.checkInTime,
          autoCheckedOut: record.checkOutTime
        });
      }
    }

    res.json({
      message: `✅ Auto-checked out ${updated.length} users`,
      updated
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
//Dashboard Route
exports.getDashboard = async (req, res) => {
  const { month, year } = req.query;

  try {
    const user = await User.findById(req.user._id).select('name email role');

    const startDate = new Date(`${year}-${month}-01`);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    const records = await Attendance.find({
      user: req.user._id,
      checkInTime: { $gte: startDate, $lt: endDate },
      checkOutTime: { $ne: null }
    }).sort({ checkInTime: -1 });

    let totalDays = records.length;
    let totalHours = 0;

    records.forEach(r => {
      const hours = (new Date(r.checkOutTime) - new Date(r.checkInTime)) / (1000 * 60 * 60);
      totalHours += hours;
    });

    res.json({
      profile: user,
      summary: {
        month,
        year,
        totalDays,
        totalHours: totalHours.toFixed(2)
      },
      recentLogs: records.slice(0, 5)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
//Analytics Route
exports.getAnalytics = async (req, res) => {
  const { month, year } = req.query;

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied: Admins only' });
  }

  if (!month || !year) {
    return res.status(400).json({ message: 'Month and year are required.' });
  }

  try {
    const startDate = new Date(`${year}-${month}-01`);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    const records = await Attendance.find({
      checkInTime: { $gte: startDate, $lt: endDate },
      checkOutTime: { $ne: null }
    }).populate('user', 'name email');

    const analyticsMap = {};

    records.forEach(r => {
      const id = r.user._id.toString();
      const name = r.user.name;
      const email = r.user.email;
      const checkIn = new Date(r.checkInTime);
      const checkOut = new Date(r.checkOutTime);
      const hours = (checkOut - checkIn) / (1000 * 60 * 60);

      if (!analyticsMap[id]) {
        analyticsMap[id] = {
          name,
          email,
          totalDays: 0,
          totalHours: 0,
          checkInTimes: [],
          checkOutTimes: []
        };
      }

      analyticsMap[id].totalDays += 1;
      analyticsMap[id].totalHours += hours;
      analyticsMap[id].checkInTimes.push(checkIn.getHours() + checkIn.getMinutes() / 60);
      analyticsMap[id].checkOutTimes.push(checkOut.getHours() + checkOut.getMinutes() / 60);
    });

    const analytics = Object.values(analyticsMap).map(user => {
      const avg = arr => arr.reduce((a, b) => a + b, 0) / arr.length || 0;
      return {
        name: user.name,
        email: user.email,
        totalDays: user.totalDays,
        totalHours: user.totalHours.toFixed(2),
        avgCheckIn: avg(user.checkInTimes).toFixed(2),
        avgCheckOut: avg(user.checkOutTimes).toFixed(2)
      };
    });

    res.json({ month, year, analytics });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
