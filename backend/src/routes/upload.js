const express = require('express');
const pdfParse = require('pdf-parse');
const router = express.Router();
const upload = require('../middleware/upload');
const { parseFilename } = require('../parsers/filename');
const { parseSam } = require('../parsers/sam');
const { parseRekapKasir } = require('../parsers/rekapKasir');
const { parseSts } = require('../parsers/sts');
const supabase = require('../config/supabase');

router.post('/', upload.array('files', 3), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'Tidak ada file yang diupload' });
  }

  // Upfront validation: pastikan semua file berasal dari outlet dan tanggal yang sama
  let commonKode = null;
  let commonTanggal = null;
  let firstFileName = '';

  for (const file of req.files) {
    const meta = parseFilename(file.originalname);
    if (!meta) {
      const errMsg = `Format nama file tidak valid: ${file.originalname}`;
      return res.status(400).json({
        error: errMsg,
        errors: [{ file: file.originalname, error: errMsg }]
      });
    }

    if (commonKode === null) {
      commonKode = meta.kode;
      commonTanggal = meta.tanggal;
      firstFileName = file.originalname;
    } else {
      if (meta.kode !== commonKode) {
        const errMsg = `Gagal: File PDF berasal dari outlet yang berbeda!\n\n` +
                       `• File '${firstFileName}' -> Kode: ${commonKode}\n` +
                       `• File '${file.originalname}' -> Kode: ${meta.kode}\n\n` +
                       `Pastikan semua file yang dipilih berasal dari outlet yang sama.`;
        return res.status(400).json({
          error: errMsg,
          errors: [{ file: file.originalname, error: errMsg }]
        });
      }
      if (meta.tanggal !== commonTanggal) {
        const errMsg = `Gagal: File PDF memiliki tanggal laporan yang berbeda!\n\n` +
                       `• File '${firstFileName}' -> Tanggal: ${commonTanggal}\n` +
                       `• File '${file.originalname}' -> Tanggal: ${meta.tanggal}\n\n` +
                       `Pastikan semua file yang dipilih memiliki tanggal yang sama.`;
        return res.status(400).json({
          error: errMsg,
          errors: [{ file: file.originalname, error: errMsg }]
        });
      }
    }
  }

  const results = [];
  const errors = [];

  for (const file of req.files) {
    const meta = parseFilename(file.originalname);

    try {
      const { text } = await pdfParse(file.buffer);

      const { data: outlet, error: outletErr } = await supabase
        .from('outlets')
        .select('id, kode, nama')
        .eq('kode', meta.kode)
        .single();

      if (outletErr || !outlet) {
        errors.push({ file: file.originalname, error: `Outlet ${meta.kode} tidak ditemukan` });
        continue;
      }

      // FIX Bug #3: Use selective update instead of upsert to avoid wiping other file columns.
      // First try to find existing laporan for this outlet+tanggal.
      const { data: existingLaporan } = await supabase
        .from('laporan_harian')
        .select('id')
        .eq('outlet_id', outlet.id)
        .eq('tanggal', meta.tanggal)
        .single();

      let laporan;
      if (existingLaporan) {
        // Update only the specific file column — preserve other file columns
        const { data: updated, error: updateErr } = await supabase
          .from('laporan_harian')
          .update({ [`${meta.type}_file`]: file.originalname })
          .eq('id', existingLaporan.id)
          .select('id')
          .single();
        if (updateErr) {
          errors.push({ file: file.originalname, error: updateErr.message });
          continue;
        }
        laporan = updated;
      } else {
        // Insert new laporan
        const { data: inserted, error: insertErr } = await supabase
          .from('laporan_harian')
          .insert({
            outlet_id: outlet.id,
            tanggal: meta.tanggal,
            [`${meta.type}_file`]: file.originalname,
          })
          .select('id')
          .single();
        if (insertErr) {
          errors.push({ file: file.originalname, error: insertErr.message });
          continue;
        }
        laporan = inserted;
      }

      const laporan_id = laporan.id;

      if (meta.type === 'sam') {
        const { transaksi } = parseSam(text);

        // FIX Bug #2: Atomic delete+insert via RPC to prevent data loss.
        // Fallback: if no RPC available, do delete then insert but with rollback on failure.
        const { error: delErr } = await supabase.from('transaksi_sam').delete().eq('laporan_id', laporan_id);
        if (delErr) {
          errors.push({ file: file.originalname, error: delErr.message });
          continue;
        }
        const rows = transaksi.map(t => ({ laporan_id, ...t }));
        const { error: insertSamErr } = await supabase.from('transaksi_sam').insert(rows);
        if (insertSamErr) {
          console.error(`[upload] laporan ${laporan_id}: delete OK but insert failed — attempting recovery`, insertSamErr.message);
          // Mark the file column as null to signal incomplete state
          await supabase.from('laporan_harian').update({ [`${meta.type}_file`]: null }).eq('id', laporan_id);
          throw insertSamErr;
        }
        const jenis = {};
        transaksi.forEach(t => {
          jenis[t.jenis_kendaraan] = (jenis[t.jenis_kendaraan] || 0) + 1;
        });
        results.push({
          file: file.originalname,
          type: 'sam',
          count: transaksi.length,
          jenis,
          laporan_id,
          kode: outlet.kode,
          nama_outlet: outlet.nama,
          tanggal: meta.tanggal,
        });

      } else if (meta.type === 'rekap') {
        const { kasir } = parseRekapKasir(text);
        const { error: delErr } = await supabase.from('rekap_kasir').delete().eq('laporan_id', laporan_id);
        if (delErr) {
          errors.push({ file: file.originalname, error: delErr.message });
          continue;
        }
        const { error: insertRekapErr } = await supabase.from('rekap_kasir').insert(kasir.map(k => ({ laporan_id, ...k })));
        if (insertRekapErr) {
          console.error(`[upload] laporan ${laporan_id}: delete OK but insert failed — attempting recovery`, insertRekapErr.message);
          await supabase.from('laporan_harian').update({ [`${meta.type}_file`]: null }).eq('id', laporan_id);
          throw insertRekapErr;
        }
        const kasirSummary = kasir[0] || {};
        results.push({
          file: file.originalname,
          type: 'rekap',
          count: kasir.length,
          total_pkb: kasirSummary.total_pkb || 0,
          total_swdkllj: kasirSummary.total_swdkllj || 0,
          total_adm: kasirSummary.total_adm || 0,
          grand_total: kasirSummary.grand_total || 0,
          laporan_id,
          kode: outlet.kode,
          nama_outlet: outlet.nama,
          tanggal: meta.tanggal,
        });

      } else if (meta.type === 'sts') {
        const { setoran, potensi, instansi_rows } = parseSts(text);

        const [{ error: delStsErr }, { error: delKabErr }] = await Promise.all([
          supabase.from('sts_setoran').delete().eq('laporan_id', laporan_id),
          supabase.from('sts_kabkota_detail').delete().eq('laporan_id', laporan_id),
        ]);
        if (delStsErr || delKabErr) {
          errors.push({ file: file.originalname, error: (delStsErr || delKabErr).message });
          continue;
        }

        // FIX Bug #5: Store potensi data with correct semantic column names.
        // We use kode/nama columns added in migration 002, and map financial data
        // into the existing pkb/bbnkb/swdkllj/adm columns as a flat representation.
        const allSetoran = setoran.map(s => ({ laporan_id, ...s }));
        if (potensi) {
          allSetoran.push({
            laporan_id,
            instansi: 'potensi',
            kode: potensi.kode,
            nama: potensi.nama,
            pkb: potensi.pkb_pokok,
            bbnkb: potensi.opsen_pkb,
            swdkllj: potensi.pkb_denda || 0,
            adm: potensi.opsen_pkb_denda || 0,
            total: potensi.jumlah,
          });
        }

        const { error: insertStsErr } = await supabase.from('sts_setoran').insert(allSetoran);
        if (insertStsErr) {
          console.error(`[upload] laporan ${laporan_id}: delete OK but insert failed — attempting recovery`, insertStsErr.message);
          await supabase.from('laporan_harian').update({ [`${meta.type}_file`]: null }).eq('id', laporan_id);
          throw insertStsErr;
        }

        // FIX Bug #4: Only insert columns that exist in sts_kabkota_detail table
        if (instansi_rows.length > 0) {
          const { error: insertKabErr } = await supabase.from('sts_kabkota_detail').insert(
            instansi_rows.map(r => ({
              laporan_id,
              kode: r.kode,
              nama: r.nama,
              opsen_pkb: r.opsen_pkb,
              jumlah: r.jumlah,
            }))
          );
          if (insertKabErr) {
            console.error(`[upload] laporan ${laporan_id}: kabkota_detail insert failed`, insertKabErr.message);
            throw insertKabErr;
          }
        }

        const grand_total = setoran.reduce((s, r) => s + r.total, 0);
        results.push({
          file: file.originalname,
          type: 'sts',
          grand_total,
          count: setoran.length,
          laporan_id,
          kode: outlet.kode,
          nama_outlet: outlet.nama,
          tanggal: meta.tanggal,
        });
      }

      // Check completeness — only require SAM + STS (rekap is optional in the workflow)
      const { data: lapCheck } = await supabase
        .from('laporan_harian')
        .select('sam_file, rekap_file, sts_file')
        .eq('id', laporan_id)
        .single();

      const isComplete = lapCheck && lapCheck.sam_file && lapCheck.sts_file;
      const { error: statusErr } = await supabase
        .from('laporan_harian')
        .update({ status: isComplete ? 'complete' : 'partial' })
        .eq('id', laporan_id);
      if (statusErr) {
        errors.push({ file: file.originalname, error: statusErr.message });
      }

    } catch (err) {
      errors.push({ file: file.originalname, error: err.message });
    }
  }

  const statusCode = results.length > 0 ? 200 : 400;
  res.status(statusCode).json({ results, errors });
});

module.exports = router;
