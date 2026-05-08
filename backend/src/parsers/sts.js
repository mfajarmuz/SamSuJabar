'use strict';

/**
 * Parser for STS (Surat Tanda Setoran) PDF text.
 * Assumes all whitespace has been stripped per line before passing to this function.
 */

function parseRupiah(str) {
  if (!str) return 0;
  return parseInt(str.replace(/\./g, ''), 10) || 0;
}

function extractNumbers(str) {
  const matches = str.match(/\d{1,3}(?:\.\d{3})+/g) || [];
  return matches.map(parseRupiah);
}

function extractSection(text, startMarker, endMarker) {
  const startIdx = text.indexOf(startMarker);
  if (startIdx === -1) return null;
  const contentStart = startIdx + startMarker.length;
  const endIdx = endMarker ? text.indexOf(endMarker, contentStart) : text.length;
  return text.substring(contentStart, endIdx === -1 ? undefined : endIdx);
}

function parseSts(text) {
  const lines = text.split('\n').map(l => l.trim());
  // Join all lines for summary section parsing (existing approach)
  const joined = lines.join('');

  const setoran = [];

  // ── Provinsi Jawa Barat ──────────────────────────────────────────────────
  const provSection = extractSection(joined, 'PemerintahProvinsiJawaBarat', 'PT.JasaRaharja');
  if (provSection) {
    const nums = extractNumbers(provSection);
    const total = nums[nums.length - 1] || 0;
    setoran.push({ instansi: 'provinsi', pkb: total, bbnkb: 0, swdkllj: 0, adm: 0, total });
  }

  // ── Jasa Raharja ─────────────────────────────────────────────────────────
  const jrSection = extractSection(joined, 'PT.JasaRaharja', 'Polda');
  if (jrSection) {
    const nums = extractNumbers(jrSection);
    const swdkllj = nums[0] || 0;
    const total = nums[2] || nums[1] || 0;
    setoran.push({ instansi: 'jasa_raharja', pkb: 0, bbnkb: 0, swdkllj, adm: 0, total });
  }

  // ── Polda ─────────────────────────────────────────────────────────────────
  const poldaSection = extractSection(joined, 'Polda', 'Kabupaten/Kota');
  if (poldaSection) {
    const nums = extractNumbers(poldaSection);
    const stnk = nums[0] || 0;
    const tnkb = nums[1] || 0;
    const total = nums[2] || (stnk + tnkb);
    const adm = stnk + tnkb;
    setoran.push({ instansi: 'polda', pkb: 0, bbnkb: 0, swdkllj: 0, adm, total });
  }

  // ── Kabupaten/Kota ────────────────────────────────────────────────────────
  const kabSection = extractSection(joined, 'Kabupaten/Kota', 'GrandTotal');
  if (kabSection) {
    const nums = extractNumbers(kabSection);
    const total = nums[nums.length - 1] || 0;
    setoran.push({ instansi: 'kab_kota', pkb: total, bbnkb: 0, swdkllj: 0, adm: 0, total });
  }

  // ── Per-row Provinsi data (for Potensi section) ───────────────────────────
  // Each row: KODE-NAME[numbers], where nums[0]=PKB Pokok, nums[-1]=Jumlah
  const provinsiRows = [];
  let inProv = false;
  for (const line of lines) {
    if (line === 'PemerintahProvinsiJawaBarat') { inProv = true; continue; }
    if (inProv && line.startsWith('PT.JasaRaharja')) break;
    if (!inProv) continue;
    const m = line.match(/^(\d{5})-([A-Z][A-Z.\s-]*)/);
    if (m) {
      const nums = extractNumbers(line);
      if (nums.length > 0) {
        // When BBNKB=0: nums=[pkb_pokok, pkb_denda, opsen_pkb_denda, total_pkb_denda, jumlah] or [pkb_pokok, jumlah]
        const pkb_denda = nums.length >= 5 ? nums[1] : 0;
        const opsen_pkb_denda = nums.length >= 5 ? nums[2] : 0;
        provinsiRows.push({
          kode: m[1],
          nama: m[2].trim(),
          pkb_pokok: nums[0],
          pkb_denda,
          opsen_pkb_denda,
          jumlah: nums[nums.length - 1],
        });
      }
    }
  }

  // ── Per-row Kab/Kota data (for ONLINE section) ────────────────────────────
  // Group rows:  XXXX-KABUPATENNAME[numbers]  (4-digit kode, then letter)
  // PPPD rows:   XXXX-YYYYY-PPPD.NAME[nums]  (4-digit + 5-digit + PPPD)
  const kabkotaRows = [];
  const pppdRows = [];
  let inKab = false;
  for (const line of lines) {
    if (line.includes('Kabupaten/Kota')) { inKab = true; continue; }
    if (inKab && line.startsWith('GrandTotal')) break;
    if (!inKab) continue;

    const pppdM = line.match(/^(\d{4})-(\d{5})-PPPD\.([A-Z][A-Z\s.-]+)/);
    if (pppdM) {
      const nums = extractNumbers(line);
      if (nums.length > 0) pppdRows.push({ kab_kode: pppdM[1], prov_kode: pppdM[2], nama: pppdM[3].trim(), opsen_pkb: nums[0] });
      continue;
    }

    const kabM = line.match(/^(\d{4})-([A-Z][A-Z\s.]*)/);
    if (kabM) {
      const nums = extractNumbers(line);
      if (nums.length > 0) {
        kabkotaRows.push({
          kode: kabM[1],
          nama: kabM[2].trim(),
          opsen_pkb: nums[0],
          jumlah: nums[nums.length - 1],
        });
      }
    }
  }

  // ── Determine outlet's own Provinsi row (Potensi) ────────────────────────
  let potensi = null;
  if (provinsiRows.length > 0) {
    const ownRow = provinsiRows.reduce((max, r) => r.pkb_pokok > max.pkb_pokok ? r : max, provinsiRows[0]);
    const pppdMatch = pppdRows.find(r => r.prov_kode === ownRow.kode);
    potensi = {
      kode: ownRow.kode,
      nama: ownRow.nama,
      pkb_pokok: ownRow.pkb_pokok,
      opsen_pkb: pppdMatch ? pppdMatch.opsen_pkb : 0,
      jumlah: ownRow.jumlah,
    };
  }

  // ── Merge PPPD rows with Provinsi rows by kode ───────────────────────────
  const instansiRows = pppdRows.map(pppd => {
    const prov = provinsiRows.find(r => r.kode === pppd.prov_kode) || {};
    const pkb_pokok = prov.pkb_pokok || 0;
    const pkb_denda = prov.pkb_denda || 0;
    const opsen_pkb_denda = prov.opsen_pkb_denda || 0;
    const opsen_pkb = pppd.opsen_pkb;
    return {
      kode: pppd.prov_kode,
      nama: pppd.nama,
      pkb_pokok,
      pkb_denda,
      opsen_pkb_denda,
      opsen_pkb,
      jumlah: pkb_pokok + pkb_denda + opsen_pkb_denda + opsen_pkb,
    };
  });

  return { setoran, potensi, instansi_rows: instansiRows };
}

module.exports = { parseSts };
