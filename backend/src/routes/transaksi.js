const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

router.get('/', async (req, res) => {
  if (!req.query.laporan_id) {
    return res.status(400).json({ error: 'laporan_id wajib diisi' });
  }
  if (!/^\d+$/.test(req.query.laporan_id)) {
    return res.status(400).json({ error: 'laporan_id harus berupa angka' });
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const from = (page - 1) * limit;

  const { data, error, count } = await supabase
    .from('transaksi_sam')
    .select('*', { count: 'exact' })
    .eq('laporan_id', req.query.laporan_id)
    .range(from, from + limit - 1);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ data, total: count, page, limit });
});

module.exports = router;
