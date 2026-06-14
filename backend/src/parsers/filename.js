function detectType(name) {
  if (name.startsWith('SAM_III-2_')) return 'sam';
  if (name.startsWith('Rekap_Kasir_')) return 'rekap';
  if (name.startsWith('STS_')) return 'sts';
  return null;
}

function parseDate(ddmmyyyy) {
  const [dd, mm, yyyy] = ddmmyyyy.split('-');
  // FIX Bug #12: Validate date components
  const day = parseInt(dd, 10);
  const month = parseInt(mm, 10);
  const year = parseInt(yyyy, 10);
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  if (day < 1 || day > 31 || month < 1 || month > 12 || year < 2000 || year > 2100) return null;
  return `${yyyy}-${mm}-${dd}`;
}

function extractKode(name) {
  const match = name.match(/(\d{5}-\d{4})/);
  return match ? match[1] : null;
}

function extractTanggal(name) {
  const match = name.match(/(\d{2}-\d{2}-\d{4})/);
  return match ? parseDate(match[1]) : null;
}

function parseFilename(filename) {
  const base = filename.replace(/\s*\(\d+\)\.pdf$/, '.pdf');
  const name = base.replace(/\.pdf$/i, '');

  const type = detectType(name);
  if (!type) return null;

  const tanggal = extractTanggal(name);
  const kode = extractKode(name);

  if (!tanggal || !kode) return null;

  return { type, tanggal, kode };
}

module.exports = { parseFilename };
