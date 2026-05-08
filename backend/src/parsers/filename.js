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
