const fs = require('fs');
const path = require('path');
const { parseSam } = require('../../src/parsers/sam');

const fixtureText = fs.readFileSync(
  path.join(__dirname, '../fixtures/sam.txt'),
  'utf-8'
);

describe('parseSam', () => {
  let result;
  beforeAll(() => { result = parseSam(fixtureText); });

  test('returns array of transactions', () => {
    expect(Array.isArray(result.transaksi)).toBe(true);
  });

  test('parses correct total count (218 transactions)', () => {
    expect(result.transaksi).toHaveLength(218);
  });

  test('parses first transaction SKKP and jenis', () => {
    const first = result.transaksi[0];
    expect(first.no_skkp).toBe('7434441');
    expect(first.jenis_kendaraan).toBe('R01');
    expect(first.pkb).toBe(161300);
  });

  test('summary by jenis correct', () => {
    const byJenis = {};
    result.transaksi.forEach(t => {
      byJenis[t.jenis_kendaraan] = (byJenis[t.jenis_kendaraan] || 0) + 1;
    });
    expect(byJenis['R01']).toBe(199);
    expect(byJenis['C01']).toBe(15);
  });

  test('total all pkb equals 42439700', () => {
    const totalPkb = result.transaksi.reduce((s, t) => s + t.pkb, 0);
    expect(totalPkb).toBe(42439700);
  });

  test('parses first transaction no_polisi', () => {
    expect(result.transaksi[0].no_polisi).toMatch(/^[A-Z0-9]+$/);
    expect(result.transaksi[0].no_polisi).toBe('Z2429DAJ');
  });

  test('parses first transaction swdkllj (R01 = 35000)', () => {
    expect(result.transaksi[0].swdkllj).toBe(35000);
  });

  test('total swdkllj equals 10122000', () => {
    const total = result.transaksi.reduce((s, t) => s + t.swdkllj, 0);
    expect(total).toBe(10122000);
  });

  test('parses first transaction adm', () => {
    expect(result.transaksi[0].adm).toBe(0);
  });

  test('parses first transaction total', () => {
    expect(result.transaksi[0].total).toBe(267800);
  });
});
