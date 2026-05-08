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
  const { data, error } = await supabase
    .from('sts_setoran')
    .select('*')
    .eq('laporan_id', req.query.laporan_id);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;
