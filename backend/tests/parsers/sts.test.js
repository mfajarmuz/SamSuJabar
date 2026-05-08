const fs = require('fs');
const path = require('path');
const { parseSts } = require('../../src/parsers/sts');

const fixtureText = fs.readFileSync(
  path.join(__dirname, '../fixtures/sts.txt'),
  'utf-8'
);

describe('parseSts', () => {
  let result;
  beforeAll(() => { result = parseSts(fixtureText); });

  test('returns setoran array', () => {
    expect(Array.isArray(result.setoran)).toBe(true);
  });

  test('Jasa Raharja record ada dengan nilai benar', () => {
    const jr = result.setoran.find(s => s.instansi === 'jasa_raharja');
    expect(jr).toBeDefined();
    expect(jr.swdkllj).toBe(10122000);
    expect(jr.total).toBe(11500000);
  });

  test('Polda record ada dengan nilai benar', () => {
    const polda = result.setoran.find(s => s.instansi === 'polda');
    expect(polda).toBeDefined();
    expect(polda.adm).toBe(6520000);
    expect(polda.total).toBe(6520000);
  });

  test('Grand total setoran = 89465000', () => {
    const total = result.setoran.reduce((s, r) => s + r.total, 0);
    expect(total).toBe(89465000);
  });
});
