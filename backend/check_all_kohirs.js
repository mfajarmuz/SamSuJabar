const fs = require('fs');
const pdfParse = require('pdf-parse');

async function test() {
  const filePath = 'D:\\AI FILES\\Claude-Space\\Resource\\PDF\\SAM_III-2_08-05-2026_12801-0003-OUTLET_KARANGNUNGGAL.pdf';
  const buffer = fs.readFileSync(filePath);
  const { text } = await pdfParse(buffer);
  const raw = text.split('\n').map(l => l.trim()).filter(Boolean);
  
  const SKKP_RE = /^\d{7,9}$/;
  const ROW_NUM_RE = /^\d{1,3}$/;
  const JENIS_RE = /^[A-Z]\d{2}$/;

  const anchors = [];
  for (let i = 0; i < raw.length; i++) {
    if (SKKP_RE.test(raw[i])) {
      const prev1 = i > 0 ? raw[i - 1] : '';
      const prev2 = i > 1 ? raw[i - 2] : '';
      const prev3 = i > 2 ? raw[i - 3] : '';
      if (ROW_NUM_RE.test(prev1) || ROW_NUM_RE.test(prev2) || ROW_NUM_RE.test(prev3)) {
        anchors.push({ idx: i, skkp: raw[i] });
      }
    }
  }

  const codes = {};
  for (let a = 0; a < anchors.length; a++) {
    const startIdx = anchors[a].idx;
    const endIdx = a + 1 < anchors.length ? anchors[a + 1].idx - 2 : raw.length - 1;
    const block = raw.slice(startIdx, endIdx + 1);

    let jenisIdx = -1;
    for (let j = 1; j < block.length; j++) {
      if (JENIS_RE.test(block[j])) {
        jenisIdx = j;
        break;
      }
    }
    if (jenisIdx === -1) continue;

    // Kohir line is typically block[1] or block[2]
    const kohirLine = block[1];
    const match = kohirLine.match(/(\d{5})/);
    if (match) {
      const code = match[1];
      codes[code] = (codes[code] || 0) + 1;
    } else {
      console.log(`Kohir pattern not found in transaction #${a+1}: ${kohirLine}`);
    }
  }

  console.log('================================================');
  console.log('📊 DISTRIBUSI KODE WILAYAH SAMSAT DI SAM III-2');
  console.log('================================================');
  console.log(codes);
}
test();
