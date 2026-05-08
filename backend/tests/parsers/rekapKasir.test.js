const fs = require('fs');
const path = require('path');
const { parseRekapKasir } = require('../../src/parsers/rekapKasir');

const fixtureText = fs.readFileSync(
  path.join(__dirname, '../fixtures/rekap.txt'),
  'utf-8'
);

describe('parseRekapKasir', () => {
  let result;
  beforeAll(() => { result = parseRekapKasir(fixtureText); });

  test('returns array of kasir', () => {
    expect(Array.isArray(result.kasir)).toBe(true);
    expect(result.kasir.length).toBeGreaterThan(0);
  });

  test('kasir pertama berisi data PKB yang benar', () => {
    const kasir = result.kasir[0];
    expect(kasir.total_pkb).toBe(42439700);
    expect(kasir.total_swdkllj).toBe(10122000);
    expect(kasir.grand_total).toBe(89465000);
  });

  test('grand total semua kasir = 89465000', () => {
    const total = result.kasir.reduce((s, k) => s + k.grand_total, 0);
    expect(total).toBe(89465000);
  });
});
