const { parseFilename } = require('../../src/parsers/filename');

describe('parseFilename', () => {
  test('parses SAM III-2 filename', () => {
    const result = parseFilename(
      'SAM_III-2_04-05-2026_12801-0002-OUTLET_CIAWI-SUKARAJ (1).pdf'
    );
    expect(result).toEqual({
      type: 'sam',
      tanggal: '2026-05-04',
      kode: '12801-0002',
    });
  });

  test('parses Rekap Kasir filename (double underscore)', () => {
    const result = parseFilename(
      'Rekap_Kasir_04-05-2026__12801-0002-OUTLET_CIAWI-SUKARAJ.pdf'
    );
    expect(result).toEqual({
      type: 'rekap',
      tanggal: '2026-05-04',
      kode: '12801-0002',
    });
  });

  test('parses STS filename', () => {
    const result = parseFilename(
      'STS_04-05-2026_12801-0002-OUTLET_CIAWI-SUKARAJ.pdf'
    );
    expect(result).toEqual({
      type: 'sts',
      tanggal: '2026-05-04',
      kode: '12801-0002',
    });
  });

  test('returns null for unknown format', () => {
    expect(parseFilename('laporan.pdf')).toBeNull();
  });
});
