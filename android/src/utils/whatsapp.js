// src/utils/whatsapp.js
import { formatRupiah } from './format';

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

function formatTanggalWA(isoDate) {
  const d = new Date(isoDate.slice(0, 10) + 'T00:00:00');
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `Hari ${HARI[d.getDay()]}, tanggal ${dd}-${mm}-${yyyy}`;
}

function blokWP(r2, r4, totalWp) {
  return [
    `R.2...   =  ${r2} WP`,
    `R.4...   =  ${r4} WP`,
    '           -------------',
    `Jumlah =  ${totalWp} WP`,
  ].join('\n');
}

function blokPKB(label, prov, opsen) {
  const total = prov + opsen;
  return [
    label,
    `Prov      Rp ${formatRupiah(prov)},-`,
    `Opsen   Rp ${formatRupiah(opsen)},-`,
    '           =============',
    `Jumlah  Rp ${formatRupiah(total)},-`,
  ].join('\n');
}

function formatNamaInstansi(nama) {
  return nama
    .replace(/^KAB\./, 'Kab. ')
    .replace(/^KOTA/, 'Kota ')
    // BANDUNG variants (longest first to avoid partial match)
    .replace(/BANDUNGBARAT/g, 'Bandung Barat')
    .replace(/BANDUNGIII/g, 'Bandung III ')
    .replace(/BANDUNGII/g, 'Bandung II ')
    .replace(/BANDUNGI/g, 'Bandung I ')
    .split(/\s+/)
    .filter(w => w.length > 0)
    .map(w => {
      if (/[a-z]/.test(w)) return w;   // already formatted prefix/suffix
      if (w.length <= 4) return w;      // short = abbreviation, keep uppercase
      return w.charAt(0) + w.slice(1).toLowerCase();
    })
    .join(' ');
}

function blokInstansi(nama, pkb_pokok, opsen_pkb, pkb_denda, opsen_pkb_denda) {
  const totalDenda = (pkb_denda || 0) + (opsen_pkb_denda || 0);
  const jumlah = (pkb_pokok || 0) + (opsen_pkb || 0) + totalDenda;
  const lines = [
    formatNamaInstansi(nama),
    `PKB    Rp ${formatRupiah(pkb_pokok)},-`,
    `Opsen  Rp ${formatRupiah(opsen_pkb)},-`,
  ];
  if (totalDenda > 0) {
    lines.push(`Denda  Rp ${formatRupiah(totalDenda)},-`);
  } else {
    lines.push(`Denda  Rp -,-`);
  }
  lines.push(`         ============`);
  lines.push(`Jml    Rp ${formatRupiah(jumlah)},-`);
  return lines.join('\n');
}

export function formatWhatsAppText({ outlet_nama, tanggal, jenis_summary, rekap, sts, potensi, kabkota }) {
  const r2 = jenis_summary?.['R01'] || 0;
  const totalWp = Object.values(jenis_summary || {}).reduce((s, n) => s + n, 0);
  const r4 = totalWp - r2;

  const pkbProv = rekap?.total_pkb || 0;
  const opsen = sts?.kab_kota || 0;

  const blocks = [
    outlet_nama,
    formatTanggalWA(tanggal),
    '',
    blokWP(r2, r4, totalWp),
    'Total PKB :',
    blokPKB('', pkbProv, opsen),
  ];

  if (potensi?.nama) {
    const potensiNama = potensi.nama.charAt(0) + potensi.nama.slice(1).toLowerCase();
    blocks.push('');
    blocks.push(`Potensi ${potensiNama}`);
    blocks.push('');
    blocks.push(blokWP(r2, r4, totalWp));
    
    const totalDenda = (potensi.pkb_denda || 0) + (potensi.opsen_pkb_denda || 0);
    const lines = [
      `Prov    Rp ${formatRupiah(potensi.pkb_pokok || 0)},-`,
      `Opsen   Rp ${formatRupiah(potensi.opsen_pkb || 0)},-`,
    ];
    if (totalDenda > 0) {
      lines.push(`Denda   Rp ${formatRupiah(totalDenda)},-`);
    } else {
      lines.push(`Denda   Rp -,-`);
    }
    const totalPotensi = (potensi.pkb_pokok || 0) + (potensi.opsen_pkb || 0) + totalDenda;
    lines.push('         =============');
    lines.push(`Jumlah  Rp ${formatRupiah(totalPotensi)},-`);
    blocks.push(lines.join('\n'));
  }

  const onlineList = (kabkota || []).filter(k => k.kode !== potensi?.kode);
  if (onlineList.length > 0) {
    blocks.push('');
    blocks.push('ONLINE');
    onlineList.forEach(k => {
      blocks.push('');
      blocks.push(blokInstansi(k.nama, k.pkb_pokok || 0, k.opsen_pkb || 0, k.pkb_denda || 0, k.opsen_pkb_denda || 0));
    });
  }

  return blocks.join('\n');
}
