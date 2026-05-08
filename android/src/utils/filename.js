// src/utils/filename.js

function detectType(name) {
  if (name.startsWith('SAM_III-2_')) return 'sam';
  if (name.startsWith('Rekap_Kasir_')) return 'rekap';
  if (name.startsWith('STS_')) return 'sts';
  return null;
}

function parseDate(ddmmyyyy) {
  const [dd, mm, yyyy] = ddmmyyyy.split('-');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Parse nama file PDF Samsat.
 * @param {string} filename - Nama file asli dari DocumentPicker
 * @returns {{ type: string, tanggal: string, kode: string } | null}
 */
export function parseFilename(filename) {
  // Hapus suffix duplikat browser (1), (2), dst.
  const base = filename.replace(/\s*\(\d+\)\.pdf$/i, '.pdf');
  const name = base.replace(/\.pdf$/i, '');

  const type = detectType(name);
  if (!type) return null;

  const dateMatch = name.match(/(\d{2}-\d{2}-\d{4})/);
  if (!dateMatch) return null;
  const tanggal = parseDate(dateMatch[1]);

  const kodeMatch = name.match(/(\d{5}-\d{4})/);
  if (!kodeMatch) return null;
  const kode = kodeMatch[1];

  return { type, tanggal, kode };
}
