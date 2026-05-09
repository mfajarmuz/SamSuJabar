const fs = require('fs');
const pdfParse = require('pdf-parse');
const { parseSts } = require('./src/parsers/sts');

const pdfPath = `D:\\AI FILES\\Claude-Space\\Resource\\PDF\\Samades Manonjaya\\STS_08-05-2026_12804-0001-SAMADES_MANONJAYA.pdf`;

async function test() {
  const buffer = fs.readFileSync(pdfPath);
  const { text } = await pdfParse(buffer);
  const result = parseSts(text);
  console.log('Parsed Potensi object:', result.potensi);
}

test();
