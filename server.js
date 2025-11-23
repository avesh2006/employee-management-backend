require('dotenv').config();
console.log('✅ PORT:', process.env.PORT);
console.log('✅ MONGO_URI:', process.env.MONGO_URI);
const express = require('express');
const path = require('path');
const cors = require('cors');
const connectDB = require('./utils/db');
const autoCheckout = require('./utils/autoCheckout'); // ✅ Auto-checkout logic

const authRoutes = require('./routes/authRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');

const app = express();
app.use(express.json());
app.use(cors());
app.use('/api/auth', authRoutes);


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/attendance', attendanceRoutes);

app.get('/', (req, res) => {
  res.send('🚀 API is running...');
});

const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});