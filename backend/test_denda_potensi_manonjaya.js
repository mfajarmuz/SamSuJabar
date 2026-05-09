const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

const pdfPath = `D:\\AI FILES\\Claude-Space\\Resource\\PDF\\Samades Manonjaya\\STS_08-05-2026_12804-0001-SAMADES_MANONJAYA.pdf`;

function parseRupiah(str) {
  if (!str) return 0;
  return parseInt(str.replace(/\./g, ''), 10) || 0;
}

function extractNumbers(str) {
  const matches = str.match(/\d{1,3}(?:\.\d{3})+/g) || [];
  return matches.map(parseRupiah);
}

async function test() {
  const buffer = fs.readFileSync(pdfPath);
  const { text } = await pdfParse(buffer);
  const lines = text.split('\n').map(l => l.trim());

  console.log('--- Raw Lines in Provinsi Section ---');
  let inProv = false;
  for (const line of lines) {
    if (line === 'PemerintahProvinsiJawaBarat') { inProv = true; continue; }
    if (inProv && line.startsWith('PT.JasaRaharja')) break;
    if (!inProv) continue;
    console.log('Line:', JSON.stringify(line));
    const m = line.match(/^(\d{5})-([A-Z][A-Z.\s-]*)/);
    if (m) {
      const nums = extractNumbers(line);
      console.log('  -> Matches:', m[1], m[2]);
      console.log('  -> Numbers:', nums);
    }
  }
}

test();
