const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

router.get('/', async (req, res) => {
  if (req.query.tanggal && !/^\d{4}-\d{2}-\d{2}$/.test(req.query.tanggal)) {
    return res.status(400).json({ error: 'Format tanggal harus YYYY-MM-DD' });
  }

  let query = supabase
    .from('laporan_harian')
    .select('*, outlets(nama, kode)')
    .order('tanggal', { ascending: false });

  if (req.query.tanggal) query = query.eq('tanggal', req.query.tanggal);
  if (req.query.outlet_id) query = query.eq('outlet_id', req.query.outlet_id);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.get('/:id', async (req, res) => {
  const id = req.params.id;

  // Guard: DB uses integer PKs
  if (!id || isNaN(Number(id)) || Number(id) < 1) {
    return res.status(400).json({ error: 'ID laporan tidak valid' });
  }

  const [laporanRes, transaksiRes, rekapRes, stsRes, kabkotaRes] = await Promise.all([
    supabase.from('laporan_harian').select('*, outlets(nama, kode)').eq('id', id).single(),
    supabase.from('transaksi_sam').select('jenis_kendaraan, is_kabupaten').eq('laporan_id', id),
    supabase.from('rekap_kasir').select('total_pkb, total_swdkllj, total_adm, grand_total').eq('laporan_id', id),
    supabase.from('sts_setoran').select('instansi, pkb, bbnkb, total, kode, nama').eq('laporan_id', id),
    supabase.from('sts_kabkota_detail').select('kode, nama, pkb_pokok, pkb_denda, opsen_pkb_denda, opsen_pkb, jumlah').eq('laporan_id', id),
  ]);

  if (laporanRes.error) return res.status(404).json({ error: 'Laporan tidak ditemukan' });

  const jenisSummary = {};
  const potensiSummary = {};
  (transaksiRes.data || []).forEach(t => {
    jenisSummary[t.jenis_kendaraan] = (jenisSummary[t.jenis_kendaraan] || 0) + 1;
    if (t.is_kabupaten !== false) { // Default to true if null or undefined for backwards compatibility
      potensiSummary[t.jenis_kendaraan] = (potensiSummary[t.jenis_kendaraan] || 0) + 1;
    }
  });

  const rekap = rekapRes.data?.[0] || null;

  const sts = {};
  let potensi = null;
  (stsRes.data || []).forEach(s => {
    if (s.instansi === 'potensi') {
      potensi = {
        kode: s.kode,
        nama: s.nama,
        pkb_pokok: s.pkb,
        opsen_pkb: s.bbnkb,
        pkb_denda: s.swdkllj || 0,
        opsen_pkb_denda: s.adm || 0,
        jumlah: s.total,
      };
    } else {
      sts[s.instansi] = s.total;
    }
  });

  res.json({
    ...laporanRes.data,
    jenis_summary: jenisSummary,
    potensi_summary: potensiSummary,
    rekap,
    sts,
    potensi,
    kabkota: kabkotaRes.data || [],
  });
});

module.exports = router;
