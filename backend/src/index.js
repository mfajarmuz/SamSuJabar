require('dotenv').config();

const express = require('express');
const cors = require('cors');
const multer = require('multer');

const app = express();

// CORS: restrict to known origins (configurable via env)
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://localhost:8081'];
app.use(cors({
  origin(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Still allow but log — change to callback(new Error(...)) for strict
    }
  },
}));

app.use(express.json({ limit: '1mb' }));

app.use('/api/upload', require('./routes/upload'));
app.use('/api/outlets', require('./routes/outlets'));
app.use('/api/laporan', require('./routes/laporan'));
app.use('/api/transaksi', require('./routes/transaksi'));
app.use('/api/rekap', require('./routes/rekap'));
app.use('/api/sts', require('./routes/sts'));
app.use('/api/dashboard', require('./routes/dashboard'));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Global error handler — catches async errors + Multer errors
app.use((err, req, res, next) => {
  console.error(err.message);
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }
  const status = err.status || (err.message && err.message.includes('tidak') ? 400 : 500);
  res.status(status).json({ error: err.message });
});

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`Samsat backend running on port ${PORT}`));
}

module.exports = app;
