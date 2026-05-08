const request = require('supertest');
const path = require('path');
const fs = require('fs');

jest.mock('../../src/config/supabase', () => {
  const mockChain = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: { id: 1, kode: '12801-0002', nama: 'Outlet Ciawi' }, error: null }),
    upsert: jest.fn().mockReturnThis(),
    insert: jest.fn().mockResolvedValue({ data: [{ id: 1 }], error: null }),
    delete: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
  };
  return { from: jest.fn(() => mockChain) };
});

const app = require('../../src/index');

const SAM_PDF_PATH = path.resolve(
  __dirname,
  '../../../../Resource/PDF/Laporan/SAM_III-2_04-05-2026_12801-0002-OUTLET_CIAWI-SUKARAJ (1).pdf'
);

describe('POST /api/upload', () => {
  test('returns 400 if no file uploaded', async () => {
    const res = await request(app).post('/api/upload');
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test('returns 400 if filename format invalid', async () => {
    const res = await request(app)
      .post('/api/upload')
      .attach('files', Buffer.from('%PDF-1.4 dummy'), {
        filename: 'laporan.pdf',
        contentType: 'application/pdf',
      });
    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
    expect(res.body.errors[0].error).toMatch(/format nama file/i);
  });

  test('returns 200 with parsed summary for valid SAM PDF', async () => {
    if (!fs.existsSync(SAM_PDF_PATH)) {
      console.warn('SAM PDF not found, skipping');
      return;
    }
    const res = await request(app)
      .post('/api/upload')
      .attach('files', fs.readFileSync(SAM_PDF_PATH), {
        filename: 'SAM_III-2_04-05-2026_12801-0002-OUTLET_CIAWI-SUKARAJ.pdf',
        contentType: 'application/pdf',
      });
    expect(res.status).toBe(200);
    expect(res.body.results).toBeDefined();
    expect(res.body.results[0].type).toBe('sam');
    expect(res.body.results[0].count).toBe(218);
    expect(res.body.results[0].laporan_id).toBeDefined();
  }, 30000);
});
