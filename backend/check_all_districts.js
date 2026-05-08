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

  const districtGroups = {};

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

    const kdJenis = block[jenisIdx];
    const isR2 = kdJenis === 'R01';

    // Find 12 zeros
    let zerosStart = -1;
    for (let j = jenisIdx + 1; j < block.length - 11; j++) {
      let allZero = true;
      for (let k = 0; k < 12; k++) {
        if (block[j + k] !== '0') { allZero = false; break; }
      }
      if (allZero) { zerosStart = j; break; }
    }
    if (zerosStart === -1) continue;

    // Address and other details are between jenisIdx + 2 and zerosStart
    // Typically, the last 1 or 2 lines before zerosStart contain the Kecamatan/Desa name
    // Let's print out the last 2 lines before the zeros start to see how they look
    const addressLines = block.slice(jenisIdx + 2, zerosStart);
    const fullAddress = addressLines.join(' ').toUpperCase();

    // Try to guess the Kecamatan based on common Tasikmalaya sub-districts found in this outlet
    let kecamatan = 'LAIN-LAIN';
    if (fullAddress.includes('KARANGNUNGGAL')) kecamatan = 'KARANGNUNGGAL';
    else if (fullAddress.includes('SUKARAJA')) kecamatan = 'SUKARAJA';
    else if (fullAddress.includes('CIBALONG')) kecamatan = 'CIBALONG';
    else if (fullAddress.includes('PARUNGPONTENG') || fullAddress.includes('PARPONT')) kecamatan = 'PARUNGPONTENG';
    else if (fullAddress.includes('BANTARKALONG')) kecamatan = 'BANTARKALONG';
    else if (fullAddress.includes('CIKALONG')) kecamatan = 'CIKALONG';
    else if (fullAddress.includes('PATUTAN') || fullAddress.includes('CIPAIPAT')) kecamatan = 'CIPAIPAT';
    else {
      // If not guessed, use the last address line as a guess
      const lastLine = addressLines[addressLines.length - 1] || 'TIDAK TERDETEKSI';
      kecamatan = `LAIN-LAIN (${lastLine})`;
    }

    if (!districtGroups[kecamatan]) {
      districtGroups[kecamatan] = { r2: 0, r4: 0, total: 0, items: [] };
    }

    if (isR2) {
      districtGroups[kecamatan].r2++;
    } else {
      districtGroups[kecamatan].r4++;
    }
    districtGroups[kecamatan].total++;
    districtGroups[kecamatan].items.push({
      nopol: block[jenisIdx + 1],
      owner: addressLines[0],
      address: addressLines.slice(1).join(' -> '),
      jenis: kdJenis
    });
  }

  console.log('================================================');
  console.log('📊 PEMETAAN TRANSAKSI BERDASARKAN KECAMATAN');
  console.log('================================================');
  for (const [kec, data] of Object.entries(districtGroups)) {
    console.log(`\n📍 KECAMATAN: ${kec}`);
    console.log(`   R2...   = ${data.r2} WP`);
    console.log(`   R4...   = ${data.r4} WP`);
    console.log(`   Total   = ${data.total} WP`);
    console.log('   Beberapa contoh kendaraan:');
    data.items.slice(0, 3).forEach(item => {
      console.log(`     - Nopol: ${item.nopol} | Jenis: ${item.jenis} | Pemilik: ${item.owner} | Alamat: ${item.address}`);
    });
  }
}
test();
