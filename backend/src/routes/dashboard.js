const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

router.get('/', async (req, res) => {
  if (req.query.tanggal && !/^\d{4}-\d{2}-\d{2}$/.test(req.query.tanggal)) {
    return res.status(400).json({ error: 'Format tanggal harus YYYY-MM-DD' });
  }

  const tanggal = req.query.tanggal || new Date().toISOString().split('T')[0];

  const { data: laporan, error } = await supabase
    .from('laporan_harian')
    .select(`
      id, status, sam_file, rekap_file, sts_file,
      outlets ( id, nama, kode ),
      rekap_kasir ( grand_total, total_pkb, total_swdkllj )
    `)
    .eq('tanggal', tanggal);

  if (error) return res.status(500).json({ error: error.message });

  const { data: outlets } = await supabase
    .from('outlets')
    .select('id, nama, kode')
    .eq('aktif', true);

  const outletMap = {};
  (laporan || []).forEach(l => {
    if (!l.outlets) return;
    const rekap = l.rekap_kasir?.[0] || {};
    outletMap[l.outlets.kode] = {
      outlet_id: l.outlets.id,
      nama: l.outlets.nama,
      kode: l.outlets.kode,
      laporan_id: l.id,
      status: l.status,
      has_sam: !!l.sam_file,
      has_rekap: !!l.rekap_file,
      has_sts: !!l.sts_file,
      grand_total: rekap.grand_total || 0,
      total_pkb: rekap.total_pkb || 0,
      total_wp: rekap.total_wp || 0,
    };
  });

  const summary = (outlets || []).map(o => outletMap[o.kode] || {
    outlet_id: o.id,
    nama: o.nama,
    kode: o.kode,
    laporan_id: null,
    status: null,
    has_sam: false,
    has_rekap: false,
    has_sts: false,
    grand_total: 0,
    total_pkb: 0,
    total_wp: 0,
  });

  res.json({
    tanggal,
    outlets_lapor: summary.filter(o => o.laporan_id).length,
    total_outlets: outlets?.length || 8,
    total_setoran: summary.reduce((s, o) => s + o.grand_total, 0),
    total_pkb: summary.reduce((s, o) => s + o.total_pkb, 0),
    total_wp: summary.reduce((s, o) => s + (o.total_wp || 0), 0),
    outlets: summary,
  });
});

module.exports = router;
