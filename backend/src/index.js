require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/upload', require('./routes/upload'));
app.use('/api/outlets', require('./routes/outlets'));
app.use('/api/laporan', require('./routes/laporan'));
app.use('/api/transaksi', require('./routes/transaksi'));
app.use('/api/rekap', require('./routes/rekap'));
app.use('/api/sts', require('./routes/sts'));
app.use('/api/dashboard', require('./routes/dashboard'));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(err.status || 500).json({ error: err.message });
});

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`Samsat backend running on port ${PORT}`));
}

module.exports = app;
