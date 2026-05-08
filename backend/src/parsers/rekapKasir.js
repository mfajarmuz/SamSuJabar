'use strict';

/**
 * Parser for Rekap Kasir PDF text output (pdf-parse one-token-per-line format).
 *
 * Numbers are split at column boundaries by pdf-parse, e.g.:
 *   "42.439.7" on one line, "00" on the next.
 * Strategy: join all lines of a kasir data block (no separator) so that
 * split numbers are reconstructed, then extract rupiah numbers with regex.
 *
 * Per-kasir column order (after 10 BBNKB zeros):
 *   [0] PKB POKOK
 *   [1] PKB DENDA
 *   [2] OPSEN PKB POKOK
 *   [3] OPSEN PKB DENDA
 *   [4] SWDKLLJ POKOK
 *   [5] SWDKLLJ DENDA
 *   [6] ADM STNK
 *   [7] ADM TNKB
 *   [8] JUMLAH (grand total)
 */

const RUPIAH_RE = /\d{1,3}(?:\.\d{3})+/g;

// Header noise lines to skip when looking for data
const HEADER_NOISE_RE = [
  /^PEMERINTAHPROVINSI/,
  /^BADANPENDAPATANDAERAH/,
  /^OUTLET/,
  /^LAPORANREKAP/,
  /^HALAMAN:/,
  /^TANGGALPROSES:/,
  /^JAMCETAK:/,
  /^PUSATPENGEL/,
  /^WILAYAH/,
  /^KASIPENERIMAAN/,
];

const HEADER_NOISE_EXACT = new Set([
  'No', 'Nama', 'Kasir',
  'BBNKB1', 'BBNKB2',
  'POKOK', 'DENDA',
  'OPSEN', 'TOTAL',
  'TOTALBBNKB',
  'PKB', 'SWDKLLJ', 'SWDKLLJ',
  'SWDKLLJ', 'ADM', 'STNK', 'TNKB', 'JUMLAH',
  'BBNKB1POKOK', 'BBNKB1DENDA', 'OPSEN BBNKB1POKOK', 'OPSEN BBNKB1DENDA',
  'BBNKB2POKOK', 'BBNKB2DENDA', 'OPSEN BBNKB2POKOK', 'OPSEN BBNKB2DENDA',
  'PKBPOKOK', 'PKBDENDA', 'OPSENPKBPOKOK', 'OPSENPKBDENDA',
  'SWDKLLJ', 'SWDKLLJ',
  'SWDKLLJ', 'ADMSTNK', 'ADMTNKB',
  // signature / footer lines
  'SYARIEFHIDAYAT,S.I.P',
  '(--------------------------------------------)',
]);

function isHeaderNoise(line) {
  if (HEADER_NOISE_EXACT.has(line)) return true;
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
 * Parse Rekap Kasir text.
 * @param {string} text  Raw text as output by pdf-parse (one token per line).
 * @returns {{ kasir: Array }}
 */
function parseRekapKasir(text) {
  const allLines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // Find the start of the data section: line that is exactly '1' (first kasir number).
  // We identify kasir-row-number lines as standalone integers (1, 2, 3, ...).
  // The JUMLAH summary row starts with 'JUMLAH' prefix in the joined text.

  // Split the full text into per-kasir blocks.
  // A kasir block starts at a line that is a small positive integer (row number)
  // and is not preceded by a non-header data line that would make it a partial number.

  // Strategy:
  // 1. Find all lines matching /^\d+$/ that could be row numbers.
  // 2. The first such line after the header is kasir #1.
  // 3. Collect lines from that kasir row number up to (not including) the line
  //    starting with 'JUMLAH' (the summary row).

  // Locate the header/footer boundary:
  // Data section starts at the first standalone row-number line ('1').
  // Data section ends just before the line starting with 'JUMLAH'.

  const ROW_NUM_RE = /^\d{1,3}$/;

  // Find index of the '1' kasir row (first data row).
  // It should appear after all the column header lines.
  // We detect it as the first line that equals '1' preceded by lines like 'JUMLAH'
  // (last column header) or similar header noise.
  let dataStartIdx = -1;
  for (let i = 0; i < allLines.length; i++) {
    if (allLines[i] === '1') {
      // Verify this is indeed a kasir row number and not part of a split number.
      // A kasir row number '1' should be preceded by header noise or another kasir block.
      // The line after '1' should be the start of a kasir name (letters/hyphens, not a number).
      const nextLine = allLines[i + 1] || '';
      if (/^[A-Z]/.test(nextLine)) {
        dataStartIdx = i;
        break;
      }
    }
  }

  if (dataStartIdx === -1) return { kasir: [] };

  // Find the JUMLAH summary row index (line starting with 'JUMLAH' + digits or 'JUMLAH0...')
  let jumlahIdx = -1;
  for (let i = dataStartIdx + 1; i < allLines.length; i++) {
    if (/^JUMLAH/.test(allLines[i])) {
      jumlahIdx = i;
      break;
    }
  }

  // Data lines are from dataStartIdx to jumlahIdx (exclusive)
  const dataLines = jumlahIdx !== -1
    ? allLines.slice(dataStartIdx, jumlahIdx)
    : allLines.slice(dataStartIdx);

  // Now split dataLines into per-kasir blocks.
  // Each kasir block starts with a row number line (e.g. '1', '2', '3', ...).
  const kasirBlocks = [];
  let currentBlock = null;
  let expectedRowNum = 1;

  for (let i = 0; i < dataLines.length; i++) {
    const line = dataLines[i];
    // Detect a new kasir row number: matches expected row number
    if (line === String(expectedRowNum)) {
      // Check next line starts with a letter (kasir name fragment)
      const nextLine = dataLines[i + 1] || '';
      if (/^[A-Z]/.test(nextLine)) {
        if (currentBlock) kasirBlocks.push(currentBlock);
        currentBlock = [line];
        expectedRowNum++;
        continue;
      }
    }
    if (currentBlock) currentBlock.push(line);
  }
  if (currentBlock) kasirBlocks.push(currentBlock);

  if (kasirBlocks.length === 0) return { kasir: [] };

  // Parse each kasir block
  const kasir = kasirBlocks.map(block => {
    // Extract kasir name: lines between the row-number line and the first '0' or '0000...' line
    // Name lines are consecutive lines starting with [A-Z] before the zeros block
    let nameLines = [];
    let zerosIdx = -1;
    for (let i = 1; i < block.length; i++) { // skip block[0] = row number
      // The BBNKB zeros appear as a single concatenated string of '0's
      // e.g. '0000000000' (10 zeros for 10 BBNKB columns)
      if (/^0+$/.test(block[i]) && block[i].length >= 5) {
        zerosIdx = i;
        break;
      }
      nameLines.push(block[i]);
    }

    // Reconstruct kasir name from fragments
    const nama_kasir = nameLines.join('');

    // Join all lines from zerosIdx onward into one string to reconstruct split numbers
    const financialBlock = zerosIdx !== -1
      ? block.slice(zerosIdx).join('')
      : block.slice(1).join('');

    // Extract all rupiah-formatted numbers from the joined financial block
    const matches = financialBlock.match(RUPIAH_RE) || [];
    const numbers = matches.map(parseRupiah);

    // Column mapping (after stripping the BBNKB zeros from the joined string):
    // [0] PKB POKOK
    // [1] PKB DENDA       (not stored — no DB column)
    // [2] OPSEN PKB POKOK (not stored — no DB column)
    // [3] OPSEN PKB DENDA (not stored — no DB column)
    // [4] SWDKLLJ POKOK
    // [5] SWDKLLJ DENDA   (not stored — no DB column)
    // [6] ADM STNK        } summed into total_adm
    // [7] ADM TNKB        }
    // [8] JUMLAH (grand total)
    //
    // Only the 7 columns that exist in the rekap_kasir DB schema are returned:
    //   nama_kasir, total_wp, total_pkb, total_bbnkb,
    //   total_swdkllj, total_adm, grand_total
    return {
      nama_kasir,
      total_wp: 0,                                    // not available in Rekap Kasir PDF
      total_pkb: numbers[0] || 0,                     // PKB POKOK
      total_bbnkb: 0,                                 // no BBNKB in this dataset
      total_swdkllj: numbers[4] || 0,                 // SWDKLLJ POKOK
      total_adm: (numbers[6] || 0) + (numbers[7] || 0), // ADM STNK + ADM TNKB
      grand_total: numbers[8] || 0,                   // JUMLAH
    };
  });

  return { kasir };
}

module.exports = { parseRekapKasir };
