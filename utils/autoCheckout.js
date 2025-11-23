const cron = require('node-cron');
const Attendance = require('../models/Attendance');

const autoCheckout = () => {
  cron.schedule('*/10 * * * *', async () => {
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    try {
      const records = await Attendance.find({
        checkOutTime: { $exists: false },
        checkInTime: { $lte: twoHoursAgo }
      });

      for (const record of records) {
        record.checkOutTime = now;
        await record.save();
        console.log(`⏱️ Auto-checked out: ${record.user} at ${now.toISOString()}`);
      }
    } catch (err) {
      console.error('❌ Auto-checkout error:', err.message);
    }
  });
};

module.exports = autoCheckout;