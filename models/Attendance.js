const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  checkInTime: { type: Date, default: Date.now },
  checkOutTime: { type: Date },
  location: {
    latitude: { type: Number },
    longitude: { type: Number }
  },
  photo: { type: String }, // path to uploaded image
}, { timestamps: true });

module.exports = mongoose.model('Attendance', attendanceSchema);