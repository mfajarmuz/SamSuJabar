const pdfParse = require('pdf-parse');
const fs = require('fs');
const path = require('path');

const files = {
  sam: path.resolve(__dirname, '../../../Resource/PDF/Laporan/SAM_III-2_04-05-2026_12801-0002-OUTLET_CIAWI-SUKARAJ (1).pdf'),
  rekap: path.resolve(__dirname, '../../../Resource/PDF/Laporan/Rekap_Kasir_04-05-2026__12801-0002-OUTLET_CIAWI-SUKARAJ.pdf'),
  sts: path.resolve(__dirname, '../../../Resource/PDF/Laporan/STS_04-05-2026_12801-0002-OUTLET_CIAWI-SUKARAJ.pdf'),
};

const OUT_DIR = path.resolve(__dirname, '../tests/fixtures');

async function inspect(key, filePath) {
  const buf = fs.readFileSync(filePath);
  const data = await pdfParse(buf);
  const outPath = path.join(OUT_DIR, `${key}.txt`);
  fs.writeFileSync(outPath, data.text, 'utf-8');
  console.log(`✓ ${key}: ${data.numpages} pages, ${data.text.length} chars → ${outPath}`);
  console.log('--- PREVIEW (first 800 chars) ---');
  console.log(data.text.substring(0, 800));
  console.log('--- PREVIEW (chars 800-1600) ---');
  console.log(data.text.substring(800, 1600));
  console.log('...\n');
}

(async () => {
  for (const [key, filePath] of Object.entries(files)) {
    await inspect(key, filePath);
  }
})();
