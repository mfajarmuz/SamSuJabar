import { formatWhatsAppText } from '../src/utils/whatsapp';

const sampleData = {
  outlet_nama: 'Ciawi',
  tanggal: '2026-05-04',
  jenis_summary: { R01: 199, C01: 15, A01: 1, F01: 2, G11: 1 },
  rekap: { total_pkb: 42439700, total_swdkllj: 10122000, grand_total: 89465000 },
  sts: { kab_kota: 28022000 },
};

describe('formatWhatsAppText', () => {
  let text;
  beforeAll(() => { text = formatWhatsAppText(sampleData); });

  test('header adalah nama outlet langsung (tanpa prefix Samsat KISS)', () => {
    const firstLine = text.split('\n')[0];
    expect(firstLine).toBe('Ciawi');
    expect(text).not.toContain('Samsat KISS');
  });

  test('tanggal diformat dengan benar (04 Mei 2026 adalah Senin)', () => {
    expect(text).toContain('Hari Senin, tanggal 04-05-2026');
  });

  test('R.2 = jumlah R01', () => {
    expect(text).toContain('R.2...   =  199 WP');
  });

  test('R.4 = semua non-R01', () => {
    expect(text).toContain('R.4...   =  19 WP');
  });

  test('total WP benar', () => {
    expect(text).toContain('Jumlah =  218 WP');
  });

  test('PKB Provinsi diformat rupiah', () => {
    expect(text).toContain('Prov      Rp 42.439.700,-');
  });

  test('Opsen PKB dari sts.kab_kota', () => {
    expect(text).toContain('Opsen   Rp 28.022.000,-');
  });

  test('Jumlah PKB = PKB + Opsen', () => {
    expect(text).toContain('Jumlah  Rp 70.461.700,-');
  });
});
