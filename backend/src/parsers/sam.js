'use strict';

/**
 * Parser for SAM III-2 PDF text output (pdf-parse one-token-per-line format).
 *
 * Layout per transaction (after page headers are stripped):
 *   <row_number>          -- sequential integer 1..218
 *   <no_skkp>             -- 7-digit number e.g. 7434441
 *   <kohir>               -- may span 1 or 2 lines due to line-wrap
 *   <kd_jenis>            -- R01 | C01 | A01 | F01 | G11
 *   <no_polisi>           -- e.g. Z2429DAJ
 *   -
 *   <tgl_pajak>
 *   <nama_pemilik>        -- variable lines
 *   <alamat>              -- variable lines
 *   <jenis_kb>            -- e.g. NC11B1CA/T
 *   <bahan_bakar>         -- e.g. A/T  M/T
 *   <merk_kb>             -- e.g. HONDA
 *   <th_cc_bbm>           -- e.g. 2019/125/BENSIN
 *   12 × '0'              -- BBN fields (all zero in this dataset)
 *   <pkb_pokok>           -- first financial value
 *   <pkb_denda>
 *   <pkb_jumlah>
 *   <opsen_pkb_pokok>
 *   <opsen_pkb_denda>
 *   <opsen_pkb_jumlah>
 *   <swdkllj_pokok>
 *   <swdkllj_denda>
 *   <swdkllj_jumlah>
 *   00                    -- BEA TNKB (literal "00")
 *   <warna>               -- e.g. PUTIH
 *   DaftarUlang
 *   1                     -- MILIK KE
 *   <jumlah_biaya>
 *   TUNAI | NONTUNAI
 */

const JENIS_RE = /^[A-Z]\d{2}$/;
const SKKP_RE = /^\d{7,9}$/;
const ROW_NUM_RE = /^\d{1,3}$/;
const RUPIAH_RE = /^\d{1,3}(\.\d{3})*$/;   // e.g. 161.300  or 1.516.600
const PAYMENT_RE = /^(TUNAI|NONTUNAI)$/;

// Lines that are page-header noise — skip them
const HEADER_NOISE = new Set([
  'No', 'NO.SKKP', 'KOHIR', 'KD.JENIS', 'NO.POLISI', 'NOPOLLAMA',
  'TGL.PAJAK', 'NAMAPEMILIK', 'ALAMATPEMILIK', 'JENISKB', 'MEREKKB',
  'TH/CC/BBM',
  'BBNIPOKOK', 'BBNIDENDA', 'OPSENBBNI', 'OPSENBBNIDENDA',
  'BBNIIPOKOK', 'BBNIIDENDA', 'OPSENBBNII',
  'PKBPOKOK', 'PKBDENDA',
  'OPSENPKBPOKOK', 'OPSENPKBDENDA',
  'SWDKLLJ', 'BEASTNK', 'ULANGSTNK', 'BEATNKBTNKB',
  'KETERANGAN', 'KETERANGA', 'MILIKKE',
  'JUMLAHBIAYA', 'KANAL', 'PEMBAYARAN',
  'JUMLAH',
  // repeated JUMLAH-like tokens from OPSEN rows
  'POKOK', 'DENDA',
]);

// Multi-token header noise patterns (exact lines)
const HEADER_NOISE_RE = [
  /^PEMERINTAHPROVINSI/,
  /^BADANPENDAPATANDAERAH/,
  /^OUTLET/,
  /^RINCIANPENERIMAAN/,
  /^TANGGAL:/,
  /^NONE-SAMSAT/,
  /^TGL\.CETAK:/,
  /^JAM:/,
  /^HALAMAN:/,
  /^JUMLAHOBJEK/,
  /^JUMLAHSKKP/,
  /^JUMLAHPOKOKHARIINI/,
  /^JUMLAHDENDAHARIINI/,
  /^JUMLAHPOKOK\+DENDA/,
  /^JUMLAHS\.D\./,
  /^PUSATPENGEL/,
  /^WILAYAH/,
  /^KASIPENERIMAAN/,
  /^SAMIII-2/,
  /^JenisKB/,
  /^JenisLayanan/,
  /^100000-/,
];

function isHeaderNoise(line) {
  if (HEADER_NOISE.has(line)) return true;
  for (const re of HEADER_NOISE_RE) {
    if (re.test(line)) return true;
  }
  return false;
}

function parseRupiah(str) {
  if (!str) return 0;
  return parseInt(str.replace(/\./g, ''), 10) || 0;
}

/**
 * Parse the SAM III-2 text.
 * @param {string} text  Raw text as output by pdf-parse (one token per line).
 * @returns {{ transaksi: Array }}
 */
function parseSam(text) {
  // Split into non-empty trimmed lines, strip header noise
  const raw = text.split('\n').map(l => l.trim()).filter(Boolean);

  // -----------------------------------------------------------------------
  // Pass 1: locate every SKKP anchor (7-digit number)
  // Build a list of { skkpIdx, skkp } so we can slice between them.
  // -----------------------------------------------------------------------
  const anchors = [];   // { idx: lineIndex, skkp: string }

  for (let i = 0; i < raw.length; i++) {
    if (SKKP_RE.test(raw[i])) {
      // Verify if any of the 3 preceding lines is a row number (1-3 digit integer)
      const prev1 = i > 0 ? raw[i - 1] : '';
      const prev2 = i > 1 ? raw[i - 2] : '';
      const prev3 = i > 2 ? raw[i - 3] : '';
      if (ROW_NUM_RE.test(prev1) || ROW_NUM_RE.test(prev2) || ROW_NUM_RE.test(prev3)) {
        anchors.push({ idx: i, skkp: raw[i] });
      }
    }
  }

  // -----------------------------------------------------------------------
  // Pass 2: for each anchor slice, extract fields
  // -----------------------------------------------------------------------
  const transaksi = [];

  for (let a = 0; a < anchors.length; a++) {
    const startIdx = anchors[a].idx;                                  // SKKP line
    const endIdx = a + 1 < anchors.length
      ? anchors[a + 1].idx - 2   // exclude the row-number line preceding next SKKP
      : raw.length - 1;

    const block = raw.slice(startIdx, endIdx + 1);

    // block[0] = SKKP
    const no_skkp = block[0];

    // Find KD.JENIS in the block
    let jenisIdx = -1;
    for (let j = 1; j < block.length; j++) {
      if (JENIS_RE.test(block[j])) {
        jenisIdx = j;
        break;
      }
    }
    if (jenisIdx === -1) continue;  // shouldn't happen

    const jenis_kendaraan = block[jenisIdx];

    // NO.POLISI is the line immediately after KD.JENIS
    const no_polisi = block[jenisIdx + 1] || '';

    // -----------------------------------------------------------------------
    // Find the 12 consecutive '0' lines (BBN section) that appear after jenis.
    // We look for 12 zeros in a row.
    // -----------------------------------------------------------------------
    let zerosStart = -1;
    for (let j = jenisIdx + 1; j < block.length - 11; j++) {
      let allZero = true;
      for (let k = 0; k < 12; k++) {
        if (block[j + k] !== '0') { allZero = false; break; }
      }
      if (allZero) { zerosStart = j; break; }
    }

    let pkb = 0;
    let total = 0;
    let swdkllj = 0;
    let adm = 0;

    if (zerosStart !== -1) {
      // After the 12 zeros: PKB POKOK, PKB DENDA, PKB JUMLAH, ...
      const financialStart = zerosStart + 12;
      pkb = parseRupiah(block[financialStart]);              // PKB POKOK  (+0)
      const pkb_jumlah = parseRupiah(block[financialStart + 2]);   // PKB JUMLAH (+2)
      const opsen_pkb_jumlah = parseRupiah(block[financialStart + 5]); // OPSEN PKB JUMLAH (+5)
      swdkllj = parseRupiah(block[financialStart + 6]);     // SWDKLLJ POKOK (+6)

      // JUMLAH BIAYA is immediately before TUNAI/NONTUNAI — scan forward from
      // financialStart to find the payment line, then take the preceding rupiah value.
      for (let j = financialStart; j < block.length; j++) {
        if (PAYMENT_RE.test(block[j])) {
          // walk backward from j-1 to find the first rupiah value
          for (let k = j - 1; k >= financialStart; k--) {
            if (RUPIAH_RE.test(block[k])) {
              total = parseRupiah(block[k]);
              break;
            }
          }
          break;
        }
      }

      // adm = total minus PKB jumlah and OPSEN PKB jumlah (BEA STNK/TNKB)
      adm = total - pkb_jumlah - opsen_pkb_jumlah;
    }

    transaksi.push({ no_skkp, jenis_kendaraan, no_polisi, pkb, swdkllj, adm, total });
  }

  return { transaksi };
}

module.exports = { parseSam };
