import { parseFilename } from '../../utils/filename';

describe('parseFilename', () => {
  test('parses SAM III-2 filename', () => {
    expect(
      parseFilename('SAM_III-2_04-05-2026_12801-0002-OUTLET_CIAWI-SUKARAJ (1).pdf')
    ).toEqual({ type: 'sam', tanggal: '2026-05-04', kode: '12801-0002' });
  });

  test('parses Rekap Kasir filename (double underscore)', () => {
    expect(
      parseFilename('Rekap_Kasir_04-05-2026__12801-0002-OUTLET_CIAWI-SUKARAJ.pdf')
    ).toEqual({ type: 'rekap', tanggal: '2026-05-04', kode: '12801-0002' });
  });

  test('parses STS filename', () => {
    expect(
      parseFilename('STS_04-05-2026_12801-0002-OUTLET_CIAWI-SUKARAJ.pdf')
    ).toEqual({ type: 'sts', tanggal: '2026-05-04', kode: '12801-0002' });
  });

  test('returns null for unknown format', () => {
    expect(parseFilename('laporan.pdf')).toBeNull();
  });
});
